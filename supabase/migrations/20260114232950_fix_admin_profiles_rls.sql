-- Fix RLS policy to allow admins to view all profiles (especially pending ones)
-- The current policy only allows viewing approved profiles or own profile
-- Admins need to see pending profiles for verification

-- Drop the existing policy
DROP POLICY IF EXISTS "Approved profiles are viewable by everyone" ON public.profiles;

-- Create new policy that allows:
-- 1. Everyone to view approved profiles
-- 2. Users to view their own profile (regardless of status)
-- 3. Admins to view all profiles (for verification purposes)
CREATE POLICY "Profiles visibility policy" ON public.profiles
  FOR SELECT USING (
    status = 'approved' 
    OR auth.uid() = user_id 
    OR public.is_admin(auth.uid())
  );

