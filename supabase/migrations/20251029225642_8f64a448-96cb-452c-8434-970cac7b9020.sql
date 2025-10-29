-- Step 1: Clean up existing data - keep only the most recent active delegation per user
WITH ranked_delegations AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY delegator_id ORDER BY created_at DESC) as rn
  FROM delegations
  WHERE active = true
)
UPDATE delegations
SET active = false
WHERE id IN (
  SELECT id FROM ranked_delegations WHERE rn > 1
);

-- Step 2: Add unique constraint to enforce only one active delegation per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_delegation_per_user 
ON delegations (delegator_id) 
WHERE active = true;