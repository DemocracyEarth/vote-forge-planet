-- Fix security warning: Add explicit search_path to function
DROP FUNCTION IF EXISTS get_valid_delegators_for_election(UUID, UUID);

CREATE OR REPLACE FUNCTION get_valid_delegators_for_election(
  delegate_user_id UUID,
  election_id UUID
)
RETURNS TABLE (
  delegator_count INTEGER,
  delegators JSONB
) 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  election_constraints JSONB;
  restriction_type TEXT;
BEGIN
  -- Get election constraints
  SELECT identity_config INTO election_constraints
  FROM elections
  WHERE id = election_id;
  
  restriction_type := election_constraints->'restrictions'->>'restrictionType';
  
  -- For 'open' elections, count all active delegators
  IF restriction_type = 'open' OR restriction_type IS NULL THEN
    RETURN QUERY
    SELECT 
      COUNT(*)::INTEGER as delegator_count,
      COALESCE(
        JSONB_AGG(
          JSONB_BUILD_OBJECT(
            'id', p.id,
            'full_name', p.full_name,
            'avatar_url', p.avatar_url
          )
        ) FILTER (WHERE p.id IS NOT NULL),
        '[]'::JSONB
      ) as delegators
    FROM delegations d
    LEFT JOIN profiles p ON p.id = d.delegator_id
    WHERE d.delegate_id = delegate_user_id 
      AND d.active = true;
  
  -- For other restriction types, return 0 for now (can be expanded later)
  ELSE
    RETURN QUERY SELECT 0::INTEGER, '[]'::JSONB;
  END IF;
END;
$$;