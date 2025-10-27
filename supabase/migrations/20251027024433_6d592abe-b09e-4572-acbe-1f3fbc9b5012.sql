-- Make election_id nullable since not all notifications are election-specific
ALTER TABLE public.notifications 
  ALTER COLUMN election_id DROP NOT NULL;