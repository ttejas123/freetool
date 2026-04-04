-- Migration: Create file uploads table and storage configuration
-- Run this in your Supabase SQL Editor

-- 1. Create the tracking table
CREATE TABLE IF NOT EXISTS file_uploads (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '2 days')
);

-- Enable RLS
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (users uploading files)
CREATE POLICY "Allow public insert" ON file_uploads FOR INSERT WITH CHECK (true);

-- Allow reading only if the user knows the exact ID (or we can just make it fully public read)
-- For a share link, whoever has the ID can read it.
CREATE POLICY "Allow public read" ON file_uploads FOR SELECT USING (true);


-- 2. Create Storage Bucket (if not exists)
-- NOTE: In Supabase Dashboard, you might need to manually create 'temp_shares' bucket 
-- and make it PUBLIC so file URLs work without signed URLs, OR keep it PRIVATE and use signed URLs.
-- We assume it's PUBLIC for easy sharing.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('temp_shares', 'temp_shares', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
CREATE POLICY "Allow public uploads to temp_shares" ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'temp_shares');

CREATE POLICY "Allow public read to temp_shares" ON storage.objects FOR SELECT 
USING (bucket_id = 'temp_shares');

-- 3. (Optional) pg_cron cleanup job
-- This automatically deletes records older than 2 days
-- Note: it doesn't automatically delete the storage object, so we might want a trigger or edge function 
-- for true auto-deletion, or we handle the storage object deletion here via http extension (advanced).
-- If you use pg_cron in Supabase:
/*
SELECT cron.schedule(
    'delete-expired-files',
    '0 * * * *', -- Run every hour
    $$
    DELETE FROM file_uploads WHERE expires_at < NOW()
    $$
);
*/
