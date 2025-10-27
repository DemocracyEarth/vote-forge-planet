-- Add illustration_url column to elections table
ALTER TABLE elections ADD COLUMN illustration_url TEXT;

-- Create storage bucket for proposal illustrations
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-illustrations', 'proposal-illustrations', true);

-- Policy: Allow authenticated users to upload illustrations
CREATE POLICY "Allow authenticated users to upload illustrations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proposal-illustrations');

-- Policy: Allow public read access to illustrations
CREATE POLICY "Allow public read access to illustrations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'proposal-illustrations');