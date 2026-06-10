-- FIX FOR: violates check constraint "attendance_sessions_status_check"

ALTER TABLE public.attendance_sessions 
DROP CONSTRAINT IF EXISTS attendance_sessions_status_check;

ALTER TABLE public.attendance_sessions 
ADD CONSTRAINT attendance_sessions_status_check 
CHECK (status IN ('opened', 'active', 'ended'));
