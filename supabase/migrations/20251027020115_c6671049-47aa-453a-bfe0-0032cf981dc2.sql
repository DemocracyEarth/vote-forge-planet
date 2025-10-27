-- Drop and recreate the get_election_results function to properly sum vote weights
DROP FUNCTION IF EXISTS public.get_election_results(uuid);

CREATE OR REPLACE FUNCTION public.get_election_results(election_uuid uuid)
RETURNS TABLE(vote_value text, vote_count bigint, total_votes bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  WITH vote_counts AS (
    SELECT 
      v.vote_value,
      COALESCE(SUM(v.vote_weight), 0)::bigint as vote_count
    FROM public.anonymous_votes v
    WHERE v.election_id = election_uuid
    GROUP BY v.vote_value
  ),
  total AS (
    SELECT COALESCE(SUM(vote_weight), 0)::bigint as total_votes
    FROM public.anonymous_votes
    WHERE election_id = election_uuid
  )
  SELECT 
    vc.vote_value,
    vc.vote_count,
    COALESCE(t.total_votes, 0) as total_votes
  FROM vote_counts vc
  CROSS JOIN total t
  UNION ALL
  SELECT NULL::text, 0::bigint, COALESCE(t.total_votes, 0)
  FROM total t
  WHERE NOT EXISTS (SELECT 1 FROM vote_counts)
$function$;