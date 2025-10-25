-- Create delegations table
CREATE TABLE public.delegations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(delegator_id, delegate_id),
  CHECK (delegator_id != delegate_id)
);

-- Enable RLS
ALTER TABLE public.delegations ENABLE ROW LEVEL SECURITY;

-- Users can view all delegations (to see delegation counts)
CREATE POLICY "Anyone can view delegations"
ON public.delegations
FOR SELECT
USING (true);

-- Users can create their own delegations
CREATE POLICY "Users can create their own delegations"
ON public.delegations
FOR INSERT
WITH CHECK (auth.uid() = delegator_id);

-- Users can update their own delegations
CREATE POLICY "Users can update their own delegations"
ON public.delegations
FOR UPDATE
USING (auth.uid() = delegator_id);

-- Users can delete their own delegations
CREATE POLICY "Users can delete their own delegations"
ON public.delegations
FOR DELETE
USING (auth.uid() = delegator_id);

-- Create view for public profiles (for the feed)
CREATE VIEW public.public_profiles AS
SELECT 
  p.id,
  p.full_name,
  p.avatar_url,
  p.bio,
  p.created_at,
  (SELECT COUNT(*) FROM public.delegations WHERE delegate_id = p.id AND active = true) as delegation_count
FROM public.profiles p;

-- Update profiles RLS to allow public viewing
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);