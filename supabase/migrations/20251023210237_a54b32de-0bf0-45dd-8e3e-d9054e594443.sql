-- Add length constraint to vote_value to prevent abuse
ALTER TABLE public.anonymous_votes 
ADD CONSTRAINT vote_value_length CHECK (char_length(vote_value) <= 1000);

-- Add comment for documentation
COMMENT ON CONSTRAINT vote_value_length ON public.anonymous_votes IS 
'Prevents excessively long vote values that could be used for abuse or attacks';

-- Create index on election_id and vote_value for better query performance
CREATE INDEX IF NOT EXISTS idx_anonymous_votes_election_value 
ON public.anonymous_votes(election_id, vote_value);