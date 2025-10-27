-- Add tags column to elections table
ALTER TABLE public.elections
ADD COLUMN tags text[] DEFAULT ARRAY['others']::text[];

-- Create GIN index for efficient tag filtering
CREATE INDEX idx_elections_tags ON public.elections USING GIN(tags);

-- Add comment for documentation
COMMENT ON COLUMN public.elections.tags IS 'AI-generated tags for categorizing elections (governance, environment, economy, social, technology, community, justice, sports, others)';