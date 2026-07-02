-- Migration: Create Notifications Table
-- Please run this script in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only read their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Authenticated users can insert notifications for others (e.g. when sending a message)
CREATE POLICY "Authenticated users can create notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (e.g. mark as read)
CREATE POLICY "Users can update their own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Enable real-time for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
