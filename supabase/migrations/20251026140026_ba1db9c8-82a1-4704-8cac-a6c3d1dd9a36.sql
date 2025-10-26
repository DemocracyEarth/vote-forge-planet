-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Public can view election details" ON public.elections;

-- Create a new policy that allows viewing both ongoing and closed public elections
CREATE POLICY "Public can view public elections" 
ON public.elections 
FOR SELECT 
USING (
  is_public = true OR 
  created_by = auth.uid()
);

-- Ensure the comment on the policy explains it covers closed elections too
COMMENT ON POLICY "Public can view public elections" ON public.elections IS 
'Allows viewing public elections regardless of whether they are ongoing or closed. Users can also view their own elections.';