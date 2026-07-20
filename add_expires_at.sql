-- ============================================================
--  Add expires_at column to sendiyou_posts
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE sendiyou_posts
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Done! ✅
