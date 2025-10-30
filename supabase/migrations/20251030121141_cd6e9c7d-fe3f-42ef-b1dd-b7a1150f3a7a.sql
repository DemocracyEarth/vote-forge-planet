-- Create function to check if user can vote in election (server-side validation)
CREATE OR REPLACE FUNCTION public.can_user_vote_in_election(
  p_election_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  election_identity_config JSONB;
  restriction_type TEXT;
  restriction_data JSONB;
  user_email TEXT;
  user_phone TEXT;
  allowed_list JSONB;
  user_domain TEXT;
BEGIN
  -- Get user data from auth.users (server-side only)
  SELECT 
    COALESCE(raw_user_meta_data->>'email', email) as email,
    phone
  INTO user_email, user_phone
  FROM auth.users
  WHERE id = p_user_id;

  -- Get election identity configuration
  SELECT identity_config INTO election_identity_config
  FROM elections
  WHERE id = p_election_id;

  -- If no restrictions, allow voting
  IF election_identity_config->'restrictions' IS NULL THEN
    RETURN TRUE;
  END IF;

  restriction_data := election_identity_config->'restrictions';
  restriction_type := restriction_data->>'restrictionType';

  -- Validate based on restriction type
  CASE restriction_type
    WHEN 'open' THEN
      RETURN TRUE;
      
    WHEN 'email-list' THEN
      allowed_list := restriction_data->'allowedEmails';
      IF allowed_list IS NULL THEN
        RETURN TRUE;
      END IF;
      
      -- Check if user's email is in allowed list (case-insensitive)
      RETURN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(allowed_list) AS allowed_email
        WHERE LOWER(allowed_email) = LOWER(user_email)
      );
      
    WHEN 'domain' THEN
      allowed_list := restriction_data->'allowedDomains';
      IF allowed_list IS NULL OR user_email IS NULL THEN
        RETURN FALSE;
      END IF;
      
      -- Extract domain from user email
      user_domain := LOWER(split_part(user_email, '@', 2));
      
      -- Check if domain is in allowed list
      RETURN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(allowed_list) AS allowed_domain
        WHERE LOWER(allowed_domain) = user_domain
      );
      
    WHEN 'phone-list' THEN
      allowed_list := restriction_data->'allowedPhones';
      IF allowed_list IS NULL THEN
        RETURN TRUE;
      END IF;
      
      -- Check if user's phone is in allowed list
      RETURN EXISTS (
        SELECT 1 
        FROM jsonb_array_elements_text(allowed_list) AS allowed_phone
        WHERE allowed_phone = user_phone
      );
      
    WHEN 'country' THEN
      -- Country validation not yet implemented
      RETURN TRUE;
      
    ELSE
      -- Unknown restriction type, default to deny
      RETURN FALSE;
  END CASE;
END;
$$;

-- Update RLS policy on anonymous_votes to enforce eligibility
DROP POLICY IF EXISTS "Anyone can cast anonymous votes" ON anonymous_votes;

CREATE POLICY "Users can cast votes in eligible elections"
ON anonymous_votes
FOR INSERT
TO authenticated
WITH CHECK (
  public.can_user_vote_in_election(election_id, auth.uid())
);

-- Update RLS policy on voter_registry to enforce eligibility
DROP POLICY IF EXISTS "Users can register their vote" ON voter_registry;

CREATE POLICY "Users can register vote in eligible elections"
ON voter_registry
FOR INSERT
TO authenticated
WITH CHECK (
  voter_id = auth.uid() 
  AND public.can_user_vote_in_election(election_id, auth.uid())
);