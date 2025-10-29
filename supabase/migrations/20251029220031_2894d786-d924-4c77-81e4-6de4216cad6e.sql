-- Update get_valid_delegators_for_election to exclude delegators who have already voted
CREATE OR REPLACE FUNCTION public.get_valid_delegators_for_election(
  delegate_user_id uuid, 
  election_id uuid
)
RETURNS TABLE(delegator_count integer, delegators jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  
  -- For 'open' elections, count only delegators who haven't voted yet
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
      AND d.active = true
      -- Exclude delegators who have already voted in this election
      AND NOT EXISTS (
        SELECT 1 FROM voter_registry vr 
        WHERE vr.voter_id = d.delegator_id 
        AND vr.election_id = $2
      );
  
  -- For other restriction types, return 0 for now
  ELSE
    RETURN QUERY SELECT 0::INTEGER, '[]'::JSONB;
  END IF;
END;
$$;

-- Function to recalculate delegate vote weight when delegator votes
CREATE OR REPLACE FUNCTION public.recalculate_delegate_vote_weight()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  delegate_user_id UUID;
  delegate_vote_id UUID;
  new_delegator_count INTEGER;
  new_vote_weight NUMERIC;
BEGIN
  -- Find if this voter has an active delegation
  SELECT delegate_id INTO delegate_user_id
  FROM delegations
  WHERE delegator_id = NEW.voter_id
    AND active = true;
  
  -- If no delegation exists, nothing to update
  IF delegate_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if the delegate has already voted in this election
  SELECT vote_id INTO delegate_vote_id
  FROM voter_registry
  WHERE voter_id = delegate_user_id
    AND election_id = NEW.election_id;
  
  -- If delegate hasn't voted yet, nothing to update
  IF delegate_vote_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get the updated count of valid delegators (excluding those who voted)
  SELECT delegator_count INTO new_delegator_count
  FROM get_valid_delegators_for_election(delegate_user_id, NEW.election_id);
  
  -- Calculate new vote weight: delegate's own vote + remaining delegators
  new_vote_weight := 1 + COALESCE(new_delegator_count, 0);
  
  -- Update the delegate's vote weight in anonymous_votes
  UPDATE anonymous_votes
  SET vote_weight = new_vote_weight
  WHERE id = delegate_vote_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on voter_registry for new votes
CREATE TRIGGER recalculate_delegate_weight_on_vote
AFTER INSERT ON voter_registry
FOR EACH ROW
EXECUTE FUNCTION recalculate_delegate_vote_weight();

-- Create trigger on voter_registry for vote updates
CREATE TRIGGER recalculate_delegate_weight_on_vote_update
AFTER UPDATE ON voter_registry
FOR EACH ROW
WHEN (OLD.vote_id IS DISTINCT FROM NEW.vote_id)
EXECUTE FUNCTION recalculate_delegate_vote_weight();