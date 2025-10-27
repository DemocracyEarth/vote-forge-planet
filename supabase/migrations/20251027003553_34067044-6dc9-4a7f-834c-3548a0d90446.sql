-- Fix the vote validation function to check the correct config field
CREATE OR REPLACE FUNCTION public.is_valid_vote_value(election_uuid uuid, vote_val text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  bill_cfg JSONB;
  ballot_type TEXT;
  allowed_options JSONB;
BEGIN
  -- Get the bill config for the election (not voting_logic_config)
  SELECT bill_config INTO bill_cfg
  FROM elections
  WHERE id = election_uuid;
  
  -- If no config found, reject the vote
  IF bill_cfg IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get ballot type from bill_config
  ballot_type := bill_cfg->>'ballotType';
  
  -- For freeText ballots, allow any non-empty text
  IF ballot_type = 'freeText' THEN
    RETURN vote_val IS NOT NULL AND LENGTH(TRIM(vote_val)) > 0;
  END IF;
  
  -- For single and multiple choice, validate against allowed options in bill_config
  allowed_options := bill_cfg->'ballotOptions';
  
  -- Check if the vote value exists in the allowed options
  RETURN allowed_options ? vote_val;
END;
$function$;

-- Also clean up the invalid votes that got through
DELETE FROM anonymous_votes 
WHERE election_id = 'cdad06f4-5349-4a92-94d8-1314813e1729' 
AND vote_value NOT IN ('Mantener edad actual', 'Reducir edad', 'Aumentar edad', 'Sistema diferenciado');