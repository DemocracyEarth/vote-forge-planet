-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can update their own anonymous vote while ongoing" ON public.anonymous_votes;
DROP POLICY IF EXISTS "Users can update their own voter registry" ON public.voter_registry;

-- Allow authenticated users to UPDATE their own anonymous vote while the election is ongoing
-- This uses voter_registry to assert ownership and joins elections to ensure updates only when ongoing
CREATE POLICY "Users can update their own anonymous vote while ongoing"
ON public.anonymous_votes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.voter_registry vr
    JOIN public.elections e ON e.id = vr.election_id
    WHERE vr.vote_id = anonymous_votes.id
      AND vr.voter_id = auth.uid()
      AND e.is_ongoing = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.voter_registry vr
    JOIN public.elections e ON e.id = vr.election_id
    WHERE vr.vote_id = anonymous_votes.id
      AND vr.voter_id = auth.uid()
      AND e.is_ongoing = true
  )
);

-- Allow users to UPDATE their own voter_registry row (used in fallback path that rebinds the vote reference)
CREATE POLICY "Users can update their own voter registry"
ON public.voter_registry
FOR UPDATE
USING (voter_id = auth.uid())
WITH CHECK (voter_id = auth.uid());