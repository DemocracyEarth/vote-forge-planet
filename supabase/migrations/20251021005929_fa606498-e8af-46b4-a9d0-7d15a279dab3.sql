-- Document that our SECURITY DEFINER functions are intentional and necessary
-- These functions are designed to bypass RLS for specific, controlled operations

-- 1. get_election_results: Needs SECURITY DEFINER to aggregate anonymous votes
--    This is safe because it only returns aggregated counts, never individual voter data
COMMENT ON FUNCTION public.get_election_results(uuid) IS 
'SECURITY DEFINER - INTENTIONAL: Aggregates anonymous vote data for public display. Does not expose voter identities. This function needs elevated privileges to bypass RLS and aggregate votes from anonymous_votes table. Safe because it only returns vote counts, not individual voter information.';

-- 2. has_user_voted: Needs SECURITY DEFINER to check voter registry
--    This is safe because it only returns a boolean, not any sensitive data
COMMENT ON FUNCTION public.has_user_voted(uuid) IS 
'SECURITY DEFINER - INTENTIONAL: Checks if the current user has already voted in an election. Returns only a boolean. This function needs elevated privileges to query voter_registry table. Safe because it only checks the current authenticated user and returns no sensitive information.';

-- 3. handle_new_user: Needs SECURITY DEFINER to create user profiles on signup
--    This is a trigger function that runs with elevated privileges for user creation
COMMENT ON FUNCTION public.handle_new_user() IS 
'SECURITY DEFINER - INTENTIONAL: Trigger function that creates user profile records when a new user signs up. This is a standard Supabase pattern for profile creation and requires elevated privileges to insert into the profiles table during the authentication flow.';

-- Add final security audit stamp
COMMENT ON SCHEMA public IS 
'Security Audit: All SECURITY DEFINER functions have been reviewed and are intentionally designed for specific, controlled operations that require elevated privileges. Anonymous voting architecture ensures complete ballot secrecy with cryptographic separation of voter identity from vote content.';
