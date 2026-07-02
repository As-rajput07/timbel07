-- Migration: Add custom avatar and poster support
-- Please run this script in your Supabase SQL Editor

-- 1. Add new columns to the users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS poster_url TEXT,
ADD COLUMN IF NOT EXISTS custom_avatar_url TEXT;

-- 2. Create the Storage Bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('user_uploads', 'user_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage RLS Policies
-- Allow public access to all files in the bucket
CREATE POLICY "Public Access to user_uploads" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'user_uploads');

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own media" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'user_uploads' 
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own media" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'user_uploads' 
  AND auth.uid() IS NOT NULL
);
