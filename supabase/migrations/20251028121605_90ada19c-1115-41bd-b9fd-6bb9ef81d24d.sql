-- Add new notification type for election invitations
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'election_invitation';

-- Update notification preferences initialization to include the new type
CREATE OR REPLACE FUNCTION public.initialize_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create default preferences for all notification types
  INSERT INTO notification_preferences (user_id, notification_type, enabled)
  VALUES 
    (NEW.id, 'comment_reply', true),
    (NEW.id, 'delegation_received', true),
    (NEW.id, 'delegator_voted', true),
    (NEW.id, 'election_started', true),
    (NEW.id, 'election_ending_soon', true),
    (NEW.id, 'election_ended', true),
    (NEW.id, 'election_invitation', true);
  
  RETURN NEW;
END;
$function$;

-- Create trigger function to notify eligible voters when election is created
CREATE OR REPLACE FUNCTION public.notify_eligible_voters_on_election_create()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  restriction_data JSONB;
  restriction_type TEXT;
  allowed_emails JSONB;
  allowed_domains JSONB;
  eligible_user RECORD;
  creator_name TEXT;
  domain_pattern TEXT;
BEGIN
  -- Get restriction data from identity_config
  restriction_data := NEW.identity_config->'restrictions';
  restriction_type := restriction_data->>'restrictionType';
  
  -- Only process if there are email or domain restrictions
  IF restriction_type IN ('email-list', 'domain') THEN
    -- Get creator name
    SELECT full_name INTO creator_name
    FROM profiles
    WHERE id = NEW.created_by;
    
    -- Handle email-list restrictions
    IF restriction_type = 'email-list' THEN
      allowed_emails := restriction_data->'allowedEmails';
      
      -- Find eligible users and create notifications
      FOR eligible_user IN
        SELECT p.id, p.email, p.full_name
        FROM profiles p
        WHERE p.email = ANY(
          SELECT jsonb_array_elements_text(allowed_emails)
        )
        AND p.id != NEW.created_by -- Don't notify creator
      LOOP
        -- Check if user wants this notification
        IF public.should_notify_user(eligible_user.id, 'election_invitation') THEN
          INSERT INTO notifications (
            user_id,
            election_id,
            notification_type,
            related_user_id,
            metadata
          )
          VALUES (
            eligible_user.id,
            NEW.id,
            'election_invitation',
            NEW.created_by,
            jsonb_build_object(
              'election_title', NEW.title,
              'creator_name', creator_name,
              'restriction_type', 'email-list'
            )
          );
        END IF;
      END LOOP;
    
    -- Handle domain restrictions
    ELSIF restriction_type = 'domain' THEN
      allowed_domains := restriction_data->'allowedDomains';
      
      -- Find eligible users by domain and create notifications
      FOR eligible_user IN
        SELECT DISTINCT p.id, p.email, p.full_name
        FROM profiles p,
             jsonb_array_elements_text(allowed_domains) as domain
        WHERE p.email ILIKE '%@' || domain
        AND p.id != NEW.created_by -- Don't notify creator
      LOOP
        -- Check if user wants this notification
        IF public.should_notify_user(eligible_user.id, 'election_invitation') THEN
          INSERT INTO notifications (
            user_id,
            election_id,
            notification_type,
            related_user_id,
            metadata
          )
          VALUES (
            eligible_user.id,
            NEW.id,
            'election_invitation',
            NEW.created_by,
            jsonb_build_object(
              'election_title', NEW.title,
              'creator_name', creator_name,
              'restriction_type', 'domain'
            )
          );
        END IF;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Attach trigger to elections table
DROP TRIGGER IF EXISTS on_election_created_notify_voters ON elections;
CREATE TRIGGER on_election_created_notify_voters
  AFTER INSERT ON elections
  FOR EACH ROW
  EXECUTE FUNCTION notify_eligible_voters_on_election_create();