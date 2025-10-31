-- Update is_valid_vote_value to handle ranked voting
CREATE OR REPLACE FUNCTION public.is_valid_vote_value(election_uuid uuid, vote_val text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  bill_cfg JSONB;
  voting_cfg JSONB;
  ballot_type TEXT;
  voting_model TEXT;
  allowed_options JSONB;
  ranked_array JSONB;
  ranked_option TEXT;
BEGIN
  -- Get the bill config and voting logic config for the election
  SELECT bill_config, voting_logic_config INTO bill_cfg, voting_cfg
  FROM elections
  WHERE id = election_uuid;
  
  -- If no config found, reject the vote
  IF bill_cfg IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get ballot type and voting model
  ballot_type := bill_cfg->>'ballotType';
  voting_model := voting_cfg->>'model';
  allowed_options := bill_cfg->'ballotOptions';
  
  -- Handle ranked voting (vote_val is a JSON array)
  IF voting_model = 'ranked' THEN
    BEGIN
      -- Parse as JSON array
      ranked_array := vote_val::JSONB;
      
      -- Validate it's an array
      IF jsonb_typeof(ranked_array) != 'array' THEN
        RETURN FALSE;
      END IF;
      
      -- Check each option exists in allowed_options
      FOR ranked_option IN SELECT jsonb_array_elements_text(ranked_array)
      LOOP
        IF NOT (allowed_options ? ranked_option) THEN
          RETURN FALSE;
        END IF;
      END LOOP;
      
      RETURN TRUE;
    EXCEPTION WHEN OTHERS THEN
      RETURN FALSE;
    END;
  END IF;
  
  -- For freeText ballots, allow any non-empty text
  IF ballot_type = 'freeText' THEN
    RETURN vote_val IS NOT NULL AND LENGTH(TRIM(vote_val)) > 0;
  END IF;
  
  -- For single and multiple choice, validate against allowed options in bill_config
  RETURN allowed_options ? vote_val;
END;
$function$;