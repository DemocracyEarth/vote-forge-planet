-- Add policy to allow users to view their own voting history
-- This is needed for the "Participated Elections" feature
CREATE POLICY "Users can view their own votes"
ON public.votes
FOR SELECT
TO authenticated
USING (
  -- Users can see votes where they are the voter
  -- This requires matching against voter_identifier which should be their email/phone/id
  voter_identifier IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
    UNION
    SELECT phone FROM auth.users WHERE id = auth.uid()
  )
);
