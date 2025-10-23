-- Fix elections table: Remove NULL created_by vulnerability
-- Step 1: Delete elections with NULL created_by (cannot assign to anyone)
DELETE FROM public.elections WHERE created_by IS NULL;

-- Step 2: Make created_by NOT NULL to prevent future NULL values
ALTER TABLE public.elections 
ALTER COLUMN created_by SET NOT NULL;

-- Step 3: Drop and recreate the UPDATE policy without NULL fallback
DROP POLICY IF EXISTS "Users can update their own elections" ON public.elections;

CREATE POLICY "Users can update their own elections"
  ON public.elections
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());