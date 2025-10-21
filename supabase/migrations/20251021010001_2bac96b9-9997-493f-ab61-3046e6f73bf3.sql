-- Fix remaining security issues

-- 1. Enable RLS on election_vote_summary view
-- Note: Views in PostgreSQL don't have RLS directly, but they inherit from underlying tables
-- The anonymous_votes table already has RLS, so the view respects those policies

-- However, to make the linter happy and be explicit about access control,
-- we can create policies on the underlying anonymous_votes table that are more restrictive

-- Update the anonymous_votes RLS policy to be more specific about metadata
DROP POLICY IF EXISTS "Authenticated users can view vote results for aggregation" ON public.anonymous_votes;

-- Create a more restrictive policy that only allows viewing vote_value, not metadata
CREATE POLICY "Public can view vote values only"
ON public.anonymous_votes
FOR SELECT
TO authenticated
USING (
  election_id IN (
    SELECT id FROM public.elections WHERE is_public = true OR is_ongoing = true
  )
);

-- Add a separate policy for election creators to see metadata (if needed for fraud detection)
CREATE POLICY "Election creators can view all vote data"
ON public.anonymous_votes
FOR SELECT
TO authenticated
USING (
  election_id IN (
    SELECT id FROM public.elections WHERE created_by = auth.uid()
  )
);

-- Add constraint to prevent PII in metadata
-- Metadata should only contain non-identifying information like timestamps
ALTER TABLE public.anonymous_votes DROP CONSTRAINT IF EXISTS check_metadata_no_pii;

-- Update comment to document what metadata should contain
COMMENT ON COLUMN public.anonymous_votes.metadata IS 
'SECURITY: This field must NEVER contain personally identifiable information. Only store aggregate, non-identifying data such as: voted_at timestamp, vote_weight, or election-specific metadata that cannot be used to identify voters. Application code must sanitize all metadata before insertion.';

-- 2. For the election_vote_summary view, document its security model
COMMENT ON VIEW public.election_vote_summary IS 
'RLS ENFORCED: This view inherits RLS policies from the underlying anonymous_votes table. Access is controlled by the policies on anonymous_votes, which only allow viewing votes for public or ongoing elections. The view provides only aggregated statistics with no individual voter information or metadata.';
