-- Create the table for storing push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    endpoint text UNIQUE NOT NULL,
    keys_p256dh text NOT NULL,
    keys_auth text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert subscriptions
CREATE POLICY "Allow anonymous users to subscribe" 
ON public.push_subscriptions 
FOR INSERT 
TO anon 
WITH CHECK (true);

-- Allow authenticated (or service role) to read subscriptions (if needed, service role bypasses RLS anyway)
