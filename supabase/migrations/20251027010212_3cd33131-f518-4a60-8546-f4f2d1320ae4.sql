-- Replace trigger function to allow vote updates by the owner while election is ongoing
CREATE OR REPLACE FUNCTION public.prevent_vote_modification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If election_id is being changed, always block (cannot move a vote to another election)
  IF OLD.election_id != NEW.election_id THEN
    RAISE EXCEPTION 'Vote modification is not allowed. Election cannot change.';
  END IF;

  -- If vote_value is changing, allow only when:
  -- 1) the current user owns this vote via voter_registry
  -- 2) the election is ongoing
  -- 3) the new value is valid per election configuration
  IF OLD.vote_value IS DISTINCT FROM NEW.vote_value THEN
    IF EXISTS (
      SELECT 1
      FROM public.voter_registry vr
      JOIN public.elections e ON e.id = vr.election_id
      WHERE vr.vote_id = OLD.id
        AND vr.voter_id = auth.uid()
        AND e.is_ongoing = true
    ) THEN
      -- Validate new vote value against election config
      IF NOT public.is_valid_vote_value(NEW.election_id, NEW.vote_value) THEN
        RAISE EXCEPTION 'Invalid vote value for this election. Vote manipulation detected.';
      END IF;
      RETURN NEW; -- Permit the update
    ELSE
      RAISE EXCEPTION 'Vote modification is not allowed. Votes are immutable.';
    END IF;
  END IF;

  -- For other fields, allow update to proceed
  RETURN NEW;
END;
$$;