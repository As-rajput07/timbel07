-- ============================================================
--  Automated Deletion of Expired Posts via pg_cron
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Ensure the pg_cron extension is enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to run every day at midnight (UTC)
-- This will automatically delete any sendiyou_posts where expires_at has passed
SELECT cron.schedule(
  'delete-expired-posts', -- name of the cron job
  '0 0 * * *',           -- everyday at midnight
  $$
    DELETE FROM sendiyou_posts 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
  $$
);

-- Done! ✅
