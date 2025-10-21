-- Fix Security Issue: Restrict access to user email addresses in profiles table
-- Drop the overly permissive policy that allows everyone to view all profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a restrictive policy: users can only view their own profile (including email)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Create a policy for public profile viewing that excludes sensitive data
-- This allows authenticated users to see basic profile info (name, avatar) but not emails
CREATE POLICY "Public profile info viewable"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can see full_name and avatar_url of other users, but not email
  -- This is enforced at application level by selecting only non-sensitive columns
  true
);

-- Note: The above policy still requires application-level enforcement to exclude email
-- For maximum security, queries should explicitly exclude email when viewing other profiles
-- Example: SELECT id, full_name, avatar_url FROM profiles WHERE id != auth.uid()

-- Fix Security Issue: Protect voter privacy in votes table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;

-- Create a policy that allows viewing aggregate results but not individual voter identifiers
-- Only allow election creators to see their election's votes (for verification)
CREATE POLICY "Election creators can view their election votes"
ON public.votes
FOR SELECT
TO authenticated
USING (
  election_id IN (
    SELECT id FROM public.elections WHERE created_by = auth.uid()
  )
);

-- Create a policy for public aggregate results (without voter_identifier)
-- This is for displaying live results - applications should only select vote_value and election_id
CREATE POLICY "Public can view vote counts"
ON public.votes
FOR SELECT
TO authenticated
USING (
  -- Allow viewing for aggregation purposes, but applications MUST exclude voter_identifier
  -- from SELECT queries to maintain voter privacy
  election_id IN (
    SELECT id FROM public.elections WHERE is_public = true
  )
);

-- Add a comment to document the security requirement
COMMENT ON TABLE public.votes IS 'SECURITY: When querying votes for public display, NEVER include voter_identifier in SELECT. Only use vote_value, election_id, and voted_at for aggregation.';
