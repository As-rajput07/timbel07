-- Migration: Add is_suspended column to users table
-- Please run this script in your Supabase SQL Editor

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false NOT NULL;
