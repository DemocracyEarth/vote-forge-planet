-- Add policy to allow viewing voter lists for public/ongoing elections
-- This allows users to see WHO voted (voter identity and timestamp)
-- but NOT WHAT they voted for (vote details remain private in anonymous_votes)
CREATE POLICY "Anyone can view voter list for public elections"
ON public.voter_registry
FOR SELECT
USING (
  election_id IN (
    SELECT id FROM public.elections 
    WHERE is_public = true OR is_ongoing = true
  )
);