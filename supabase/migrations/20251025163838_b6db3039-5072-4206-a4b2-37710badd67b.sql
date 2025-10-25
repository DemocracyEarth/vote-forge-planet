-- Fix #1: Add vote_id foreign key to voter_registry for secure vote updates
ALTER TABLE public.voter_registry 
ADD COLUMN vote_id uuid REFERENCES public.anonymous_votes(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_voter_registry_vote_id ON public.voter_registry(vote_id);

-- Fix #2: Make profile storage buckets private and require authentication
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('avatars', 'profile-videos');

-- Drop existing public policies
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view all profile videos" ON storage.objects;

-- Create new authenticated-only policies
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can view profile videos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'profile-videos');