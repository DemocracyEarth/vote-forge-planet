-- Create function to calculate ranked choice voting winner using instant-runoff algorithm
CREATE OR REPLACE FUNCTION public.calculate_ranked_choice_winner(p_election_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_round integer := 1;
  v_rounds jsonb := '[]'::jsonb;
  v_winner text := NULL;
  v_total_ballots integer;
  v_current_tallies jsonb;
  v_eliminated text;
  v_min_votes integer;
  v_remaining_options text[];
  v_ballot record;
  v_vote_rankings text[];
  v_preference text;
  v_round_data jsonb;
BEGIN
  -- Get all ballots and their rankings
  CREATE TEMP TABLE IF NOT EXISTS temp_ballots (
    ballot_id uuid,
    rankings text[],
    weight numeric
  );
  
  DELETE FROM temp_ballots;
  
  INSERT INTO temp_ballots (ballot_id, rankings, weight)
  SELECT 
    id,
    ARRAY(SELECT jsonb_array_elements_text(vote_value::jsonb)),
    vote_weight
  FROM anonymous_votes
  WHERE election_id = p_election_id
    AND vote_value IS NOT NULL
    AND vote_value != '';
  
  v_total_ballots := (SELECT COUNT(*) FROM temp_ballots);
  
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
  FROM temp_ballots, unnest(rankings) AS opt;
  
  -- Instant-runoff voting loop
  LOOP
    -- Count first-preference votes for remaining options
    v_current_tallies := '{}'::jsonb;
    
    FOR v_ballot IN 
      SELECT ballot_id, rankings, weight FROM temp_ballots
    LOOP
      -- Find first preference among remaining options
      v_preference := NULL;
      FOREACH v_preference IN ARRAY v_ballot.rankings
      LOOP
        IF v_preference = ANY(v_remaining_options) THEN
          EXIT;
        END IF;
      END LOOP;
      
      -- Add vote weight to tally
      IF v_preference IS NOT NULL THEN
        v_current_tallies := jsonb_set(
          v_current_tallies,
          ARRAY[v_preference],
          to_jsonb(COALESCE((v_current_tallies->v_preference)::numeric, 0) + v_ballot.weight)
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
    
    FOR v_preference IN SELECT unnest(v_remaining_options)
    LOOP
      DECLARE
        v_votes numeric := COALESCE((v_current_tallies->v_preference)::numeric, 0);
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
  
  DROP TABLE IF EXISTS temp_ballots;
  
  -- Return results
  RETURN jsonb_build_object(
    'winner', v_winner,
    'rounds', v_rounds,
    'final_vote_count', COALESCE((v_current_tallies->v_winner)::numeric, 0),
    'total_ballots', v_total_ballots
  );
END;
$$;