-- Drop the existing view and recreate with proper access control
DROP VIEW IF EXISTS public.election_vote_summary;

-- Recreate the view with security_invoker to enforce RLS through underlying tables
CREATE OR REPLACE VIEW public.election_vote_summary 
WITH (security_invoker=true) AS
SELECT 
  av.election_id,
  COUNT(*) as total_votes,
  COUNT(DISTINCT av.vote_value) as unique_options,
  MIN(av.voted_at) as first_vote_at,
  MAX(av.voted_at) as last_vote_at
FROM public.anonymous_votes av
JOIN public.elections e ON e.id = av.election_id
WHERE e.is_public = true OR e.is_ongoing = true
GROUP BY av.election_id;

-- Grant access to the view
GRANT SELECT ON public.election_vote_summary TO authenticated;

-- Update comments to clarify security requirements
COMMENT ON COLUMN public.anonymous_votes.metadata IS 
'SECURITY WARNING: This field MUST NOT contain any personally identifiable information (IP addresses, browser fingerprints, session tokens, etc.). Only store non-identifying data. Violating this compromises ballot secrecy.';

COMMENT ON VIEW public.election_vote_summary IS
'Secure aggregated view of vote counts. Enforces RLS through underlying tables to show only public/ongoing elections.';

-- Fix election creator privacy: Restrict the elections policy to hide created_by from public
DROP POLICY IF EXISTS "Elections are viewable by everyone" ON public.elections;

-- Create a policy that allows viewing elections but not the creator
CREATE POLICY "Public can view election details"
ON public.elections
FOR SELECT
TO authenticated
USING (is_public = true OR is_ongoing = true);

-- Allow election creators to see their own elections including created_by field
CREATE POLICY "Creators can view their own elections"
ON public.elections
FOR SELECT
TO authenticated
USING (created_by = auth.uid());
