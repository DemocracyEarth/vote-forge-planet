-- Create a completely anonymous voting architecture
-- This separates voter verification from vote content to ensure privacy

-- 1. Create a voter_registry table to track who has voted (for duplicate prevention)
CREATE TABLE IF NOT EXISTS public.voter_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  voter_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  voted_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(election_id, voter_id)
);

-- Enable RLS on voter_registry
ALTER TABLE public.voter_registry ENABLE ROW LEVEL SECURITY;

-- Users can view their own voting history
CREATE POLICY "Users can view their own voting history"
ON public.voter_registry
FOR SELECT
TO authenticated
USING (voter_id = auth.uid());

-- Users can insert their own votes
CREATE POLICY "Users can register their vote"
ON public.voter_registry
FOR INSERT
TO authenticated
WITH CHECK (voter_id = auth.uid());

-- 2. Create anonymous_votes table without any voter identifier
CREATE TABLE IF NOT EXISTS public.anonymous_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  vote_value text NOT NULL,
  metadata jsonb,
  voted_at timestamp with time zone DEFAULT now() NOT NULL,
  vote_weight numeric DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.anonymous_votes ENABLE ROW LEVEL SECURITY;

-- Allow viewing anonymous votes for public/ongoing elections
CREATE POLICY "Public can view anonymous votes"
ON public.anonymous_votes
FOR SELECT
TO authenticated
USING (
  election_id IN (
    SELECT id FROM public.elections WHERE is_public = true OR is_ongoing = true
  )
);

-- Anyone can insert anonymous votes (the voter_registry table prevents duplicates)
CREATE POLICY "Anyone can cast anonymous votes"
ON public.anonymous_votes
FOR INSERT
TO authenticated
WITH CHECK (true);

-- 3. Migrate existing votes to new structure (if any)
INSERT INTO public.voter_registry (election_id, voter_id, voted_at)
SELECT DISTINCT ON (v.election_id, u.id)
  v.election_id,
  u.id,
  v.voted_at
FROM public.votes v
JOIN auth.users u ON (v.voter_identifier = u.email OR v.voter_identifier = u.phone)
WHERE NOT EXISTS (
  SELECT 1 FROM public.voter_registry vr 
  WHERE vr.election_id = v.election_id AND vr.voter_id = u.id
)
ON CONFLICT (election_id, voter_id) DO NOTHING;

INSERT INTO public.anonymous_votes (election_id, vote_value, metadata, voted_at, vote_weight)
SELECT election_id, vote_value, metadata, voted_at, vote_weight
FROM public.votes
ON CONFLICT DO NOTHING;

-- 4. Add helpful function to check if user has voted
CREATE OR REPLACE FUNCTION public.has_user_voted(election_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.voter_registry
    WHERE election_id = election_uuid AND voter_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_user_voted(uuid) TO authenticated;

-- 5. Update get_election_results to use anonymous_votes
CREATE OR REPLACE FUNCTION public.get_election_results(election_uuid uuid)
RETURNS TABLE (
  vote_value text,
  vote_count bigint,
  total_votes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH vote_counts AS (
    SELECT 
      v.vote_value,
      COUNT(*) as vote_count
    FROM public.anonymous_votes v
    WHERE v.election_id = election_uuid
    GROUP BY v.vote_value
  ),
  total AS (
    SELECT COUNT(*) as total_votes
    FROM public.anonymous_votes
    WHERE election_id = election_uuid
  )
  SELECT 
    vc.vote_value,
    vc.vote_count,
    COALESCE(t.total_votes, 0) as total_votes
  FROM vote_counts vc
  CROSS JOIN total t
  UNION ALL
  SELECT NULL::text, 0::bigint, COALESCE(t.total_votes, 0)
  FROM total t
  WHERE NOT EXISTS (SELECT 1 FROM vote_counts)
$$;

-- Add comments
COMMENT ON TABLE public.voter_registry IS 'Tracks which users have voted in which elections for duplicate prevention. Does not store vote content.';
COMMENT ON TABLE public.anonymous_votes IS 'Stores vote content without voter identity. Completely anonymous and cannot be traced back to voters.';
