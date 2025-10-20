-- Add is_public field to elections table
ALTER TABLE public.elections 
ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Add index for faster queries on public elections
CREATE INDEX idx_elections_public_status ON public.elections(is_public, status, is_ongoing) 
WHERE is_public = true AND status = 'active';

-- Add comment
COMMENT ON COLUMN public.elections.is_public IS 'Whether this election is visible in the public feed';