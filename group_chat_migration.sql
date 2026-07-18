-- ============================================================
--  Anonymous Group Chat System - Supabase Migration
--  Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add `is_group` flag to sendiyou_chats
ALTER TABLE sendiyou_chats
  ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT FALSE;

-- 2. Add `type` column to messages
--    Values: 'USER_MESSAGE' (default), 'SYSTEM'
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'USER_MESSAGE';

-- 3. Create group_members table
--    Stores: which user has which alias in which group chat
CREATE TABLE IF NOT EXISTS group_members (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id     UUID REFERENCES sendiyou_chats(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  alias       TEXT NOT NULL,
  is_revealed BOOLEAN DEFAULT FALSE,
  joined_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (chat_id, user_id),   -- one alias per user per group
  UNIQUE (chat_id, alias)      -- no two users share same alias in same group
);

-- 4. Enable Row Level Security on group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to read group_members for chats they belong to
CREATE POLICY "group_members_select"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sendiyou_chats sc
      WHERE sc.id = group_members.chat_id
        AND auth.uid() = ANY(sc.participant_ids)
    )
  );

-- Allow any authenticated user to insert their own membership
CREATE POLICY "group_members_insert"
  ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Allow any authenticated user to update their own record (reveal identity)
CREATE POLICY "group_members_update"
  ON group_members FOR UPDATE
  USING (user_id = auth.uid());

-- 5. Enable Supabase Realtime for group_members table
--    (Run in SQL Editor)
ALTER PUBLICATION supabase_realtime ADD TABLE group_members;

-- Done! ✅
