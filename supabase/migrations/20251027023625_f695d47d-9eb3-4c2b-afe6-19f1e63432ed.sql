-- Create notification type enum
CREATE TYPE notification_type AS ENUM (
  'comment_reply',
  'delegation_received',
  'delegator_voted',
  'election_started',
  'election_ending_soon',
  'election_ended'
);

-- Alter notifications table
ALTER TABLE public.notifications 
  ADD COLUMN notification_type notification_type NOT NULL DEFAULT 'comment_reply',
  ADD COLUMN related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb,
  ALTER COLUMN comment_id DROP NOT NULL;

-- Create notification_preferences table
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS on notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
  ON public.notification_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Helper function to check if user wants this notification type
CREATE OR REPLACE FUNCTION public.should_notify_user(p_user_id UUID, p_notification_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If no preference exists, default to enabled
  RETURN COALESCE(
    (SELECT enabled FROM notification_preferences 
     WHERE user_id = p_user_id AND notification_type = p_notification_type),
    true
  );
END;
$$;

-- Update notify_on_reply trigger function
CREATE OR REPLACE FUNCTION public.notify_on_reply()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
    
    -- Only create notification if replying to someone else and they want this notification
    IF parent_user_id IS NOT NULL 
       AND parent_user_id != NEW.user_id 
       AND public.should_notify_user(parent_user_id, 'comment_reply') THEN
      INSERT INTO notifications (
        user_id, 
        comment_id, 
        election_id, 
        notification_type,
        related_user_id,
        metadata
      )
      VALUES (
        parent_user_id, 
        NEW.id, 
        NEW.election_id,
        'comment_reply',
        NEW.user_id,
        jsonb_build_object(
          'commenter_name', (SELECT full_name FROM profiles WHERE id = NEW.user_id),
          'comment_preview', LEFT(NEW.content, 100)
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for delegation notifications
CREATE OR REPLACE FUNCTION public.notify_on_delegation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if active delegation and delegate wants this notification
  IF NEW.active = true 
     AND public.should_notify_user(NEW.delegate_id, 'delegation_received') THEN
    INSERT INTO notifications (
      user_id,
      notification_type,
      related_user_id,
      metadata
    )
    VALUES (
      NEW.delegate_id,
      'delegation_received',
      NEW.delegator_id,
      jsonb_build_object(
        'delegator_name', (SELECT full_name FROM profiles WHERE id = NEW.delegator_id),
        'delegator_id', NEW.delegator_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_delegation_created
  AFTER INSERT ON public.delegations
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_delegation();

-- Create trigger for delegator vote notifications
CREATE OR REPLACE FUNCTION public.notify_delegators_on_vote()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  delegator_record RECORD;
  election_title TEXT;
  delegate_name TEXT;
BEGIN
  -- Get election title
  SELECT title INTO election_title
  FROM elections
  WHERE id = NEW.election_id;
  
  -- Get delegate name
  SELECT full_name INTO delegate_name
  FROM profiles
  WHERE id = NEW.voter_id;
  
  -- Notify all active delegators
  FOR delegator_record IN
    SELECT delegator_id
    FROM delegations
    WHERE delegate_id = NEW.voter_id AND active = true
  LOOP
    -- Check if delegator wants this notification
    IF public.should_notify_user(delegator_record.delegator_id, 'delegator_voted') THEN
      INSERT INTO notifications (
        user_id,
        election_id,
        notification_type,
        related_user_id,
        metadata
      )
      VALUES (
        delegator_record.delegator_id,
        NEW.election_id,
        'delegator_voted',
        NEW.voter_id,
        jsonb_build_object(
          'delegate_name', delegate_name,
          'election_title', election_title,
          'delegate_id', NEW.voter_id
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_vote_cast
  AFTER INSERT ON public.voter_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_delegators_on_vote();

-- Create trigger for initializing default preferences for new users
CREATE OR REPLACE FUNCTION public.initialize_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create default preferences for all notification types
  INSERT INTO notification_preferences (user_id, notification_type, enabled)
  VALUES 
    (NEW.id, 'comment_reply', true),
    (NEW.id, 'delegation_received', true),
    (NEW.id, 'delegator_voted', true),
    (NEW.id, 'election_started', true),
    (NEW.id, 'election_ending_soon', true),
    (NEW.id, 'election_ended', true);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_notification_preferences();

-- Backfill existing users with default preferences
INSERT INTO notification_preferences (user_id, notification_type, enabled)
SELECT id, 'comment_reply', true FROM profiles
UNION ALL
SELECT id, 'delegation_received', true FROM profiles
UNION ALL
SELECT id, 'delegator_voted', true FROM profiles
UNION ALL
SELECT id, 'election_started', true FROM profiles
UNION ALL
SELECT id, 'election_ending_soon', true FROM profiles
UNION ALL
SELECT id, 'election_ended', true FROM profiles
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Add trigger for updating updated_at on notification_preferences
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();