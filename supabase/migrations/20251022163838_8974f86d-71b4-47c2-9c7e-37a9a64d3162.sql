-- Create a public-safe view of elections that excludes sensitive configuration
CREATE OR REPLACE VIEW public.public_elections AS
SELECT 
  id,
  title,
  description,
  start_date,
  end_date,
  is_public,
  is_ongoing,
  status,
  created_at
  -- Explicitly exclude: created_by, identity_config, voting_logic_config, bill_config, voting_page_config
FROM public.elections
WHERE is_public = true OR is_ongoing = true;

-- Grant access to the public view
GRANT SELECT ON public.public_elections TO authenticated;
GRANT SELECT ON public.public_elections TO anon;

COMMENT ON VIEW public.public_elections IS
'Public-safe view of elections that excludes sensitive configuration data. Use this for displaying elections in public feeds to prevent exposing business logic and voter requirements to competitors.';

-- Update election_vote_summary to document its security model
COMMENT ON VIEW public.election_vote_summary IS
'Secure aggregated view of vote counts. Uses security_invoker=true to enforce RLS through underlying anonymous_votes and elections tables. Only shows data for public/ongoing elections. Not a table, so RLS is enforced through underlying tables.';

-- Document the remaining policy warning
COMMENT ON TABLE public.elections IS
'Contains full election configuration. Use public_elections view for public display to avoid exposing sensitive configuration. Direct table access is restricted by RLS policies: only public/ongoing elections and creator-owned elections are viewable.';
