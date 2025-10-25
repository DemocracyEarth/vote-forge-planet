-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  election_id UUID NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create function to notify on replies
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  parent_user_id UUID;
BEGIN
  -- Only create notification if this is a reply (has parent_id)
  IF NEW.parent_id IS NOT NULL THEN
    -- Get the user_id of the parent comment
    SELECT user_id INTO parent_user_id
    FROM discussion_comments
    WHERE id = NEW.parent_id;
    
    -- Only create notification if replying to someone else
    IF parent_user_id IS NOT NULL AND parent_user_id != NEW.user_id THEN
      INSERT INTO notifications (user_id, comment_id, election_id)
      VALUES (parent_user_id, NEW.id, NEW.election_id);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for notifications
CREATE TRIGGER on_comment_reply
  AFTER INSERT ON discussion_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_reply();

-- Add index for better performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read);