-- CRITICAL SECURITY FIX: Validate vote values against election configuration

-- Create a function to validate if a vote value is allowed for an election
CREATE OR REPLACE FUNCTION public.is_valid_vote_value(
  election_uuid UUID,
  vote_val TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  voting_config JSONB;
  ballot_type TEXT;
  allowed_options JSONB;
BEGIN
  -- Get the voting logic config for the election
  SELECT voting_logic_config INTO voting_config
  FROM elections
  WHERE id = election_uuid;
  
  -- If no config found, reject the vote
  IF voting_config IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get ballot type
  ballot_type := voting_config->>'ballotType';
  
  -- For freeText ballots, allow any non-empty text
  IF ballot_type = 'freeText' THEN
    RETURN vote_val IS NOT NULL AND LENGTH(TRIM(vote_val)) > 0;
  END IF;
  
  -- For singleChoice and multipleChoice, validate against allowed options
  allowed_options := voting_config->'ballotOptions';
  
  -- Check if the vote value exists in the allowed options
  RETURN allowed_options ? vote_val;
END;
$$;

-- Create trigger function to validate votes before insertion
CREATE OR REPLACE FUNCTION public.validate_vote_before_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Validate that the vote value is allowed for this election
  IF NOT public.is_valid_vote_value(NEW.election_id, NEW.vote_value) THEN
    RAISE EXCEPTION 'Invalid vote value for this election. Vote manipulation detected.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop trigger if it exists and create it
DROP TRIGGER IF EXISTS validate_vote_trigger ON public.anonymous_votes;
CREATE TRIGGER validate_vote_trigger
  BEFORE INSERT ON public.anonymous_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_vote_before_insert();

-- Also prevent updates to vote_value (votes should be immutable)
CREATE OR REPLACE FUNCTION public.prevent_vote_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent any modification of vote_value or election_id
  IF OLD.vote_value != NEW.vote_value OR OLD.election_id != NEW.election_id THEN
    RAISE EXCEPTION 'Vote modification is not allowed. Votes are immutable.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create update prevention trigger
DROP TRIGGER IF EXISTS prevent_vote_modification_trigger ON public.anonymous_votes;
CREATE TRIGGER prevent_vote_modification_trigger
  BEFORE UPDATE ON public.anonymous_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_vote_modification();

-- Make elections table immutable after creation (prevent option manipulation)
CREATE OR REPLACE FUNCTION public.prevent_election_config_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Allow updates to is_ongoing, is_public, and status only
  -- Prevent modification of voting_logic_config, bill_config, identity_config, and voting_page_config
  IF OLD.voting_logic_config IS DISTINCT FROM NEW.voting_logic_config OR
     OLD.bill_config IS DISTINCT FROM NEW.bill_config OR
     OLD.identity_config IS DISTINCT FROM NEW.identity_config OR
     OLD.voting_page_config IS DISTINCT FROM NEW.voting_page_config THEN
    RAISE EXCEPTION 'Election configuration cannot be modified after creation. This protects election integrity.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create election configuration protection trigger
DROP TRIGGER IF EXISTS prevent_election_config_modification_trigger ON public.elections;
CREATE TRIGGER prevent_election_config_modification_trigger
  BEFORE UPDATE ON public.elections
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_election_config_modification();