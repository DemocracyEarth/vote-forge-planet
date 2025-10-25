-- Create storage buckets for profile media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('profile-videos', 'profile-videos', true, 52428800, ARRAY['video/mp4', 'video/webm', 'video/quicktime']);

-- Add profile_video_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS profile_video_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Storage policies for avatars bucket
CREATE POLICY "Users can view all avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policies for profile-videos bucket
CREATE POLICY "Users can view all profile videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-videos');

CREATE POLICY "Users can upload their own profile video"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile video"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile video"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);