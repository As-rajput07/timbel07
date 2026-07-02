-- Migration: Create SendiYou Tables
-- Please run this script in your Supabase SQL Editor

-- 1. users Table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  branch TEXT NOT NULL,
  enrollment_number TEXT UNIQUE NOT NULL,
  gender TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read all public profiles
CREATE POLICY "Users can view all profiles" 
ON public.users FOR SELECT 
USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- 2. sendiyou_posts Table (The Requests)
CREATE TABLE IF NOT EXISTS public.sendiyou_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  connection_type TEXT NOT NULL, -- e.g., 'crush', 'missing item', 'group study'
  preferred_gender TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sendiyou_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read posts
CREATE POLICY "Anyone can read posts" 
ON public.sendiyou_posts FOR SELECT 
USING (true);

-- Authenticated users can insert posts
CREATE POLICY "Authenticated users can create posts" 
ON public.sendiyou_posts FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

-- Creators can delete their own posts
CREATE POLICY "Creators can delete their own posts" 
ON public.sendiyou_posts FOR DELETE 
USING (auth.uid() = creator_id);

-- 3. sendiyou_chats Table (The Chat Rooms)
CREATE TABLE IF NOT EXISTS public.sendiyou_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.sendiyou_posts(id) ON DELETE CASCADE NOT NULL,
  participant_ids UUID[] NOT NULL,
  revealed_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sendiyou_chats ENABLE ROW LEVEL SECURITY;

-- Participants can read their chats
CREATE POLICY "Participants can view chats" 
ON public.sendiyou_chats FOR SELECT 
USING (auth.uid() = ANY(participant_ids));

-- Any authenticated user can create a chat (replying to a post)
CREATE POLICY "Authenticated users can create chats" 
ON public.sendiyou_chats FOR INSERT 
WITH CHECK (auth.uid() = ANY(participant_ids));

-- Participants can update chat (to reveal identity)
CREATE POLICY "Participants can update chat" 
ON public.sendiyou_chats FOR UPDATE 
USING (auth.uid() = ANY(participant_ids));

-- 4. messages Table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.sendiyou_chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Participants of the chat can read messages
CREATE POLICY "Participants can view messages" 
ON public.messages FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.sendiyou_chats 
    WHERE id = public.messages.chat_id 
    AND auth.uid() = ANY(participant_ids)
  )
);

-- Participants of the chat can insert messages
CREATE POLICY "Participants can insert messages" 
ON public.messages FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sendiyou_chats 
    WHERE id = public.messages.chat_id 
    AND auth.uid() = ANY(participant_ids)
  )
  AND auth.uid() = sender_id
);

-- Enable real-time for chats and messages
alter publication supabase_realtime add table sendiyou_chats;
alter publication supabase_realtime add table messages;
