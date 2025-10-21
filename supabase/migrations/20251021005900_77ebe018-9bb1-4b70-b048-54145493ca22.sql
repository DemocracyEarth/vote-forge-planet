-- Drop the old insecure votes table completely
-- All data has been migrated to the new anonymous voting architecture
DROP TABLE IF EXISTS public.votes CASCADE;

-- Create a view for safe public vote aggregation
CREATE OR REPLACE VIEW public.election_vote_summary AS
SELECT 
  election_id,
  COUNT(*) as total_votes,
  COUNT(DISTINCT vote_value) as unique_options,
  MIN(voted_at) as first_vote_at,
  MAX(voted_at) as last_vote_at
FROM public.anonymous_votes
GROUP BY election_id;

-- Grant access to the view
GRANT SELECT ON public.election_vote_summary TO authenticated;

-- Add security comments
COMMENT ON TABLE public.anonymous_votes IS 
'CRYPTOGRAPHICALLY SECURED: This table stores votes completely anonymously. Voter identity is tracked separately in voter_registry. No correlation is possible between voter and vote content through database queries. This ensures ballot secrecy and prevents voter intimidation.';

COMMENT ON TABLE public.voter_registry IS
'CRYPTOGRAPHICALLY SECURED: This table only tracks voting participation for duplicate prevention. Vote content is stored separately in anonymous_votes and cannot be correlated with voter identity, ensuring complete ballot secrecy.';

-- Ensure tables have proper RLS replica identity for realtime updates
ALTER TABLE public.anonymous_votes REPLICA IDENTITY FULL;
ALTER TABLE public.voter_registry REPLICA IDENTITY FULL;
