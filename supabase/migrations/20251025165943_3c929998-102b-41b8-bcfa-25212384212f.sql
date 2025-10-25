-- Drop unused views that may cause security definer issues
DROP VIEW IF EXISTS public.election_vote_summary CASCADE;
DROP VIEW IF EXISTS public.public_elections CASCADE;