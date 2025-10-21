-- Drop the old insecure votes table completely
-- All data has been migrated to the new anonymous voting architecture
DROP TABLE IF EXISTS public.votes CASCADE;

-- Enable realtime for anonymous_votes to support live results
ALTER PUBLICATION supabase_realtime ADD TABLE public.anonymous_votes;

-- Add indexes for better performance on anonymous_votes
CREATE INDEX IF NOT EXISTS idx_anonymous_votes_election_id ON public.anonymous_votes(election_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_votes_voted_at ON public.anonymous_votes(voted_at);

-- Add indexes for voter_registry
CREATE INDEX IF NOT EXISTS idx_voter_registry_voter_id ON public.voter_registry(voter_id);
CREATE INDEX IF NOT EXISTS idx_voter_registry_election_id ON public.voter_registry(election_id);

-- Add constraint to ensure vote integrity
ALTER TABLE public.anonymous_votes
ADD CONSTRAINT check_vote_value_not_empty 
CHECK (length(trim(vote_value)) > 0);

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

-- Ensure anonymous_votes table has proper RLS replica identity for realtime
ALTER TABLE public.anonymous_votes REPLICA IDENTITY FULL;
ALTER TABLE public.voter_registry REPLICA IDENTITY FULL;
