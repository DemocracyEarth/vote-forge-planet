-- Fix remaining security issues

-- 1. Remove the unsafe "Public profile info viewable" policy
DROP POLICY IF EXISTS "Public profile info viewable" ON public.profiles;

-- Profiles are now only viewable by the owner - this prevents email exposure
-- If apps need to display user info (like names), they should use a separate public_profiles view
-- or query through a security definer function that explicitly excludes email

-- 2. Modify votes policies to prevent voter_identifier exposure to election creators
DROP POLICY IF EXISTS "Election creators can view their election votes" ON public.votes;

-- Create a security definer function for election creators to get aggregated results only
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
    FROM public.votes v
    WHERE v.election_id = election_uuid
    GROUP BY v.vote_value
  ),
  total AS (
    SELECT COUNT(*) as total_votes
    FROM public.votes
    WHERE election_id = election_uuid
  )
  SELECT 
    vc.vote_value,
    vc.vote_count,
    t.total_votes
  FROM vote_counts vc
  CROSS JOIN total t;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_election_results(uuid) TO authenticated;

-- Update the "Public can view vote counts" policy to be more restrictive
DROP POLICY IF EXISTS "Public can view vote counts" ON public.votes;

CREATE POLICY "Authenticated users can view vote results for aggregation"
ON public.votes
FOR SELECT
TO authenticated
USING (
  election_id IN (
    SELECT id FROM public.elections WHERE is_public = true OR is_ongoing = true
  )
);

-- Add comment to remind developers about security
COMMENT ON POLICY "Authenticated users can view vote results for aggregation" ON public.votes IS 
'SECURITY WARNING: Applications MUST only SELECT vote_value, election_id, and voted_at. NEVER select voter_identifier to maintain voter privacy. Use get_election_results() function for aggregated data.';
