-- Remove duplicate and problematic policies on anonymous_votes

-- Drop the policy that allows election creators to view individual vote data
-- This violates voter privacy as creators shouldn't see individual votes
DROP POLICY IF EXISTS "Election creators can view all vote data" ON public.anonymous_votes;

-- Drop duplicate policy
DROP POLICY IF EXISTS "Public can view vote values only" ON public.anonymous_votes;

-- The remaining "Public can view anonymous votes" policy is sufficient
-- It allows viewing for aggregation but applications must responsibly
-- only query vote_value and election_id, not metadata

-- Update the metadata field in vote insertion to ensure no PII
-- Create a trigger to strip out any potentially identifying information
CREATE OR REPLACE FUNCTION public.sanitize_vote_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow timestamp in metadata, strip everything else
  IF NEW.metadata IS NOT NULL THEN
    NEW.metadata = jsonb_build_object(
      'voted_at', COALESCE(NEW.metadata->>'voted_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to sanitize metadata on insert
DROP TRIGGER IF EXISTS sanitize_vote_metadata_trigger ON public.anonymous_votes;
CREATE TRIGGER sanitize_vote_metadata_trigger
  BEFORE INSERT ON public.anonymous_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.sanitize_vote_metadata();

COMMENT ON FUNCTION public.sanitize_vote_metadata IS
'Automatically strips any potentially identifying information from vote metadata, keeping only the timestamp. This ensures ballot secrecy is maintained at the database level.';
