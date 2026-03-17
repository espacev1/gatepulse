-- Add marking_criteria column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS marking_criteria TEXT[] 
DEFAULT ARRAY['Technical Execution', 'Innovation & Impact', 'Presentation Quality', 'Practical Usability'];

-- Ensure profiles.role constraint is definitely updated for Jury/Faculty
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin','staff','participant','faculty','jury'));
