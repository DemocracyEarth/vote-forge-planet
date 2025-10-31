-- Update sanitize_vote_metadata to allow necessary keys
CREATE OR REPLACE FUNCTION public.sanitize_vote_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Whitelist keys relevant to voting while preserving anonymity
  IF NEW.metadata IS NOT NULL THEN
    NEW.metadata = jsonb_strip_nulls(
      jsonb_build_object(
        'voted_at', COALESCE(NEW.metadata->>'voted_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
        'related_votes', COALESCE(NEW.metadata->'related_votes', '[]'::jsonb),
        'voting_model', COALESCE(NEW.metadata->>'voting_model', NULL),
        'credits_spent', COALESCE(NEW.metadata->'credits_spent', NULL),
        'base_votes', COALESCE(NEW.metadata->'base_votes', NULL),
        'delegations_count', COALESCE(NEW.metadata->'delegations_count', NULL)
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create secure server-side function to submit quadratic votes atomically
CREATE OR REPLACE FUNCTION public.submit_quadratic_vote(
  p_election_id uuid,
  p_allocations jsonb -- [{"option": "Option A", "base_votes": 3}, ...]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev_vote_id uuid;
  prev_related jsonb;
  delegator_count integer := 0;
  insert_ids uuid[] := ARRAY[]::uuid[];
  v_record jsonb;
  v_id uuid;
  option_text text;
  base_votes_int integer;
BEGIN
  -- Ensure user is eligible to vote in this election
  IF NOT public.can_user_vote_in_election(p_election_id, auth.uid()) THEN
    RAISE EXCEPTION 'User not eligible to vote in this election';
  END IF;

  -- Find any existing vote reference for this user in this election
  SELECT vote_id INTO prev_vote_id
  FROM public.voter_registry
  WHERE voter_id = auth.uid()
    AND election_id = p_election_id
  LIMIT 1;

  -- If previous vote exists, delete the entire batch and the registry row
  IF prev_vote_id IS NOT NULL THEN
    SELECT metadata->'related_votes' INTO prev_related
    FROM public.anonymous_votes
    WHERE id = prev_vote_id;

    IF prev_related IS NOT NULL AND jsonb_typeof(prev_related) = 'array' AND jsonb_array_length(prev_related) > 0 THEN
      DELETE FROM public.anonymous_votes
      WHERE id = ANY (
        SELECT ARRAY(SELECT jsonb_array_elements_text(prev_related))::uuid[]
      );
    ELSE
      DELETE FROM public.anonymous_votes WHERE id = prev_vote_id;
    END IF;

    DELETE FROM public.voter_registry
    WHERE voter_id = auth.uid() AND election_id = p_election_id;
  END IF;

  -- Get current delegator count to compute vote weight
  SELECT delegator_count INTO delegator_count
  FROM public.get_valid_delegators_for_election(auth.uid(), p_election_id);

  -- Insert new votes (one per option with base_votes > 0)
  FOR v_record IN SELECT value FROM jsonb_array_elements(p_allocations)
  LOOP
    option_text := NULLIF(TRIM(v_record->>'option'), '');
    base_votes_int := COALESCE((v_record->>'base_votes')::int, 0);

    IF option_text IS NOT NULL AND base_votes_int > 0 THEN
      v_id := gen_random_uuid();
      insert_ids := array_append(insert_ids, v_id);

      INSERT INTO public.anonymous_votes (id, election_id, vote_value, vote_weight, metadata)
      VALUES (
        v_id,
        p_election_id,
        option_text,
        (base_votes_int * (1 + COALESCE(delegator_count, 0)))::numeric,
        jsonb_build_object(
          'voted_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
          'voting_model', 'quadratic',
          'credits_spent', (base_votes_int * base_votes_int),
          'base_votes', base_votes_int,
          'delegations_count', COALESCE(delegator_count, 0),
          'related_votes', '[]'::jsonb -- will be updated below for all rows
        )
      );
    END IF;
  END LOOP;

  -- If we inserted votes, set related_votes for all rows and upsert registry
  IF array_length(insert_ids, 1) IS NOT NULL AND array_length(insert_ids, 1) > 0 THEN
    UPDATE public.anonymous_votes
    SET metadata = metadata || jsonb_build_object('related_votes', to_jsonb(insert_ids))
    WHERE id = ANY(insert_ids);

    INSERT INTO public.voter_registry (election_id, voter_id, vote_id)
    VALUES (p_election_id, auth.uid(), insert_ids[1])
    ON CONFLICT (election_id, voter_id)
    DO UPDATE SET vote_id = EXCLUDED.vote_id, voted_at = now();
  END IF;
END;
$$;