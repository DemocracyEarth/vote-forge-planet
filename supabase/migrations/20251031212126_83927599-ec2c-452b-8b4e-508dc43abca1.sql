-- Replace calculate_ranked_choice_winner with read-only compatible version
CREATE OR REPLACE FUNCTION public.calculate_ranked_choice_winner(p_election_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_round integer := 1;
  v_rounds jsonb := '[]'::jsonb;
  v_winner text := NULL;
  v_total_ballots integer;
  v_current_tallies jsonb;
  v_eliminated text;
  v_min_votes numeric;
  v_remaining_options text[];
  v_preference text;
  v_round_data jsonb;
  v_ballot_data record;
  v_ballot_rankings text[];
  v_ballot_weight numeric;
BEGIN
  -- Count total ballots
  SELECT COUNT(*) INTO v_total_ballots
  FROM anonymous_votes
  WHERE election_id = p_election_id
    AND vote_value IS NOT NULL
    AND vote_value != '';
  
  IF v_total_ballots = 0 THEN
    RETURN jsonb_build_object(
      'winner', NULL,
      'rounds', '[]'::jsonb,
      'final_vote_count', 0,
      'total_ballots', 0
    );
  END IF;
  
  -- Get all unique options from ballots
  SELECT ARRAY_AGG(DISTINCT opt)
  INTO v_remaining_options
  FROM anonymous_votes,
       LATERAL jsonb_array_elements_text(vote_value::jsonb) AS opt
  WHERE election_id = p_election_id
    AND vote_value IS NOT NULL
    AND vote_value != '';
  
  -- Instant-runoff voting loop
  LOOP
    v_current_tallies := '{}'::jsonb;
    
    -- Count first preferences for remaining options
    FOR v_ballot_data IN 
      SELECT 
        ARRAY(SELECT jsonb_array_elements_text(vote_value::jsonb)) as rankings,
        vote_weight as weight
      FROM anonymous_votes
      WHERE election_id = p_election_id
        AND vote_value IS NOT NULL
        AND vote_value != ''
    LOOP
      v_ballot_rankings := v_ballot_data.rankings;
      v_ballot_weight := v_ballot_data.weight;
      v_preference := NULL;
      
      -- Find first preference among remaining options
      FOR i IN 1..array_length(v_ballot_rankings, 1)
      LOOP
        IF v_ballot_rankings[i] = ANY(v_remaining_options) THEN
          v_preference := v_ballot_rankings[i];
          EXIT;
        END IF;
      END LOOP;
      
      -- Add vote weight to tally
      IF v_preference IS NOT NULL THEN
        v_current_tallies := jsonb_set(
          v_current_tallies,
          ARRAY[v_preference],
          to_jsonb(COALESCE((v_current_tallies->v_preference)::numeric, 0) + v_ballot_weight)
        );
      END IF;
    END LOOP;
    
    -- Store round data
    v_round_data := jsonb_build_object(
      'round', v_round,
      'tallies', v_current_tallies,
      'remaining_options', to_jsonb(v_remaining_options)
    );
    v_rounds := v_rounds || v_round_data;
    
    -- Check for majority winner (>50% of total ballots)
    FOR v_preference IN SELECT jsonb_object_keys(v_current_tallies)
    LOOP
      IF (v_current_tallies->v_preference)::numeric > (v_total_ballots / 2.0) THEN
        v_winner := v_preference;
        EXIT;
      END IF;
    END LOOP;
    
    -- If we have a winner or only one option left, exit
    IF v_winner IS NOT NULL OR array_length(v_remaining_options, 1) <= 1 THEN
      IF v_winner IS NULL AND array_length(v_remaining_options, 1) = 1 THEN
        v_winner := v_remaining_options[1];
      END IF;
      EXIT;
    END IF;
    
    -- Find option with fewest votes to eliminate
    v_min_votes := NULL;
    v_eliminated := NULL;
    
    FOR v_preference IN SELECT jsonb_object_keys(v_current_tallies)
    LOOP
      DECLARE
        v_votes numeric := (v_current_tallies->v_preference)::numeric;
      BEGIN
        IF v_min_votes IS NULL OR v_votes < v_min_votes THEN
          v_min_votes := v_votes;
          v_eliminated := v_preference;
        END IF;
      END;
    END LOOP;
    
    -- Remove eliminated option
    v_remaining_options := array_remove(v_remaining_options, v_eliminated);
    
    -- Update round data with elimination info
    v_rounds := jsonb_set(
      v_rounds,
      ARRAY[(v_round - 1)::text, 'eliminated'],
      to_jsonb(v_eliminated)
    );
    
    v_round := v_round + 1;
    
    -- Safety check to prevent infinite loops
    IF v_round > 100 THEN
      EXIT;
    END IF;
  END LOOP;
  
  -- Return results
  RETURN jsonb_build_object(
    'winner', v_winner,
    'rounds', v_rounds,
    'final_vote_count', COALESCE((v_current_tallies->v_winner)::numeric, 0),
    'total_ballots', v_total_ballots
  );
END;
$function$;