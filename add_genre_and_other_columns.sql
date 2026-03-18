-- Add missing columns to the events table to support new UI features
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS genre TEXT DEFAULT 'Culturals',
ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS registration_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS registration_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ;

-- You may also want to update the schema cache by running:
-- NOTIFY pgrst, 'reload schema';
