-- Migration: Add missing columns to sendiyou_posts for the Redesign

ALTER TABLE public.sendiyou_posts 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS selected_animation TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];
