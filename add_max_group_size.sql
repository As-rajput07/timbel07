-- ============================================================
--  Add max_group_size column to sendiyou_posts
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE sendiyou_posts
  ADD COLUMN IF NOT EXISTS max_group_size INTEGER DEFAULT 50 CHECK (max_group_size >= 2 AND max_group_size <= 50);

-- Done! ✅
