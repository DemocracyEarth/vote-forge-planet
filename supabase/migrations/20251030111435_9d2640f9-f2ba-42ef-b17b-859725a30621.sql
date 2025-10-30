-- Fix corrupted vote weight for vote ce6c8f55-400e-493a-9315-4ff7ed7eb7cb
-- This vote had an incorrect weight of 10000, should be 1 (no delegations)
UPDATE anonymous_votes
SET vote_weight = 1,
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{delegations_count}',
      '0'
    )
WHERE id = 'ce6c8f55-400e-493a-9315-4ff7ed7eb7cb'
  AND vote_weight = 10000;