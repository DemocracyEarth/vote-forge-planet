-- Create elections table to store voting configurations
CREATE TABLE public.elections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  identity_config jsonb NOT NULL,
  voting_logic_config jsonb NOT NULL,
  bill_config jsonb NOT NULL,
  voting_page_config jsonb NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  start_date timestamptz,
  end_date timestamptz,
  is_ongoing boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft'))
);

-- Create votes table to store individual votes
CREATE TABLE public.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id uuid REFERENCES public.elections(id) ON DELETE CASCADE NOT NULL,
  voter_identifier text NOT NULL,
  vote_value text NOT NULL,
  vote_weight numeric DEFAULT 1,
  voted_at timestamptz DEFAULT now() NOT NULL,
  metadata jsonb,
  UNIQUE(election_id, voter_identifier)
);

-- Enable RLS
ALTER TABLE public.elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for elections (publicly readable, but only creators can modify)
CREATE POLICY "Elections are viewable by everyone"
  ON public.elections
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create elections"
  ON public.elections
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own elections"
  ON public.elections
  FOR UPDATE
  USING (created_by = auth.uid() OR created_by IS NULL);

-- RLS policies for votes (publicly readable for transparency)
CREATE POLICY "Votes are viewable by everyone"
  ON public.votes
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can cast a vote"
  ON public.votes
  FOR INSERT
  WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_elections_created_by ON public.elections(created_by);
CREATE INDEX idx_votes_election_id ON public.votes(election_id);
CREATE INDEX idx_votes_voter_identifier ON public.votes(voter_identifier);