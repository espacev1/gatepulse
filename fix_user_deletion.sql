-- Migration Script to Fix User Deletion Issues
-- This script ensures that when a user is deleted from auth.users (and thus public.profiles),
-- any records referencing them in other tables are either deleted or unlinked (NULL).

-- 1. Fix public.events table
-- Ensures events don't block user deletion. Sets creator to NULL if deleted.
ALTER TABLE public.events 
DROP CONSTRAINT IF EXISTS events_created_by_fkey,
ADD CONSTRAINT events_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Fix public.teams table
-- If a team leader is deleted, the team will still exist but the leader reference will be NULL.
ALTER TABLE public.teams 
DROP CONSTRAINT IF EXISTS teams_leader_id_fkey,
ADD CONSTRAINT teams_leader_id_fkey 
FOREIGN KEY (leader_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Fix public.tickets table
-- If the staff/admin who validated a ticket is deleted, the ticket still remains validated.
ALTER TABLE public.tickets 
DROP CONSTRAINT IF EXISTS tickets_validated_by_fkey,
ADD CONSTRAINT tickets_validated_by_fkey 
FOREIGN KEY (validated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Fix public.attendance_logs table
-- Logs are preserved even if the logging staff member is deleted.
ALTER TABLE public.attendance_logs 
DROP CONSTRAINT IF EXISTS attendance_logs_staff_id_fkey,
ADD CONSTRAINT attendance_logs_staff_id_fkey 
FOREIGN KEY (staff_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 5. Fix public.attendance_sessions table (Just in case, though it already was SET NULL)
ALTER TABLE public.attendance_sessions 
DROP CONSTRAINT IF EXISTS attendance_sessions_activated_by_fkey,
ADD CONSTRAINT attendance_sessions_activated_by_fkey 
FOREIGN KEY (activated_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
