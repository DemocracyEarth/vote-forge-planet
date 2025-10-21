-- Fix the security definer view warning
-- The election_vote_summary view doesn't need special permissions
-- since it only aggregates public anonymous vote data

-- Drop and recreate without security definer
DROP VIEW IF EXISTS public.election_vote_summary;

CREATE VIEW public.election_vote_summary 
WITH (security_invoker=true)
AS
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

-- Add helpful comment
COMMENT ON VIEW public.election_vote_summary IS 
'Public view for aggregated vote statistics. Uses security_invoker to respect RLS policies of the querying user.';
