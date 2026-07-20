-- ============================================================
--  Add banned_user_ids column to sendiyou_chats
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

ALTER TABLE sendiyou_chats
  ADD COLUMN IF NOT EXISTS banned_user_ids UUID[] DEFAULT '{}';

-- Done! ✅
