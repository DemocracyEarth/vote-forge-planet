-- Add RLS policy to allow creators to delete their own elections
CREATE POLICY "Creators can delete their own elections"
ON public.elections
FOR DELETE
USING (created_by = auth.uid());