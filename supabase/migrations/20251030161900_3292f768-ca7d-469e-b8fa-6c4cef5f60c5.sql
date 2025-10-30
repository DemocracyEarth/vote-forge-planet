CREATE OR REPLACE FUNCTION public.sanitize_vote_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Allow timestamp and related_votes in metadata, strip everything else
  IF NEW.metadata IS NOT NULL THEN
    NEW.metadata = jsonb_build_object(
      'voted_at', COALESCE(NEW.metadata->>'voted_at', to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
      'related_votes', COALESCE(NEW.metadata->'related_votes', '[]'::jsonb)
    );
  END IF;
  RETURN NEW;
END;
$function$;