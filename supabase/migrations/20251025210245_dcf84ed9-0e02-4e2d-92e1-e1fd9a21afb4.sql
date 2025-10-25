-- Create function for updating updated_at timestamp if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create discussion_comments table for threaded debates
CREATE TABLE public.discussion_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_edited BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;

-- Policies for viewing comments (public can view comments on public/ongoing elections)
CREATE POLICY "Anyone can view comments on public elections"
ON public.discussion_comments
FOR SELECT
USING (
  election_id IN (
    SELECT id FROM elections 
    WHERE is_public = true OR is_ongoing = true
  )
);

-- Policy for creating comments (authenticated users only)
CREATE POLICY "Authenticated users can create comments"
ON public.discussion_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for updating own comments
CREATE POLICY "Users can update their own comments"
ON public.discussion_comments
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy for deleting own comments
CREATE POLICY "Users can delete their own comments"
ON public.discussion_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_discussion_comments_election_id ON public.discussion_comments(election_id);
CREATE INDEX idx_discussion_comments_parent_id ON public.discussion_comments(parent_id);
CREATE INDEX idx_discussion_comments_user_id ON public.discussion_comments(user_id);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_discussion_comments_updated_at
BEFORE UPDATE ON public.discussion_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for discussion comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.discussion_comments;