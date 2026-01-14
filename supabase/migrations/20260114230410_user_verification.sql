-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create gender enum
CREATE TYPE public.gender_type AS ENUM ('he/him', 'she/her', 'they/them');

-- Add verification fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS status public.verification_status NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS gender public.gender_type,
ADD COLUMN IF NOT EXISTS id_card_path TEXT,
ADD COLUMN IF NOT EXISTS admission_slip_path TEXT,
ADD COLUMN IF NOT EXISTS selfie_path TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id);

-- Create index for pending users
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_submitted_at ON public.profiles(submitted_at DESC);

-- Update RLS policies for profiles
-- Pending users can only view their own profile
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Approved profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (status = 'approved' OR auth.uid() = user_id);

-- Users can update their own profile (only if pending or approved)
CREATE POLICY "Users can update their own pending/approved profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id AND status IN ('pending', 'approved'));

-- Users can insert their own profile
-- (Already exists, but ensure it's correct)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to approve a user
CREATE OR REPLACE FUNCTION public.approve_user(
  p_user_id UUID,
  p_gender public.gender_type,
  p_reviewer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id_card_path TEXT;
  v_admission_slip_path TEXT;
  v_selfie_path TEXT;
BEGIN
  -- Get document paths before deleting
  SELECT id_card_path, admission_slip_path, selfie_path
  INTO v_id_card_path, v_admission_slip_path, v_selfie_path
  FROM public.profiles
  WHERE user_id = p_user_id AND status = 'pending';

  -- Update profile status
  UPDATE public.profiles
  SET 
    status = 'approved',
    gender = p_gender,
    reviewed_at = now(),
    reviewed_by = p_reviewer_id,
    id_card_path = NULL,
    admission_slip_path = NULL,
    selfie_path = NULL
  WHERE user_id = p_user_id;

  -- Delete documents from storage (will be handled by trigger or manually)
  -- Note: Storage deletion needs to be done via Supabase Storage API in application code
  -- This function just clears the paths from the database
END;
$$;

-- Function to reject a user (deletes account)
CREATE OR REPLACE FUNCTION public.reject_user(
  p_user_id UUID,
  p_reviewer_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id_card_path TEXT;
  v_admission_slip_path TEXT;
  v_selfie_path TEXT;
BEGIN
  -- Get document paths before deleting
  SELECT id_card_path, admission_slip_path, selfie_path
  INTO v_id_card_path, v_admission_slip_path, v_selfie_path
  FROM public.profiles
  WHERE user_id = p_user_id AND status = 'pending';

  -- Mark as rejected (for audit trail, then delete)
  UPDATE public.profiles
  SET 
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = p_reviewer_id
  WHERE user_id = p_user_id;

  -- Delete the auth user (cascades to profile and all related data)
  DELETE FROM auth.users WHERE id = p_user_id;

  -- Note: Storage files will need to be deleted via application code
  -- before or after this function is called
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = p_user_id
      AND role = 'admin'
  );
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_user(UUID, public.gender_type, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_user(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- Update the handle_new_user function to set status as pending
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', 'user_' || LEFT(NEW.id::text, 8)),
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Anonymous User'),
    'pending'
  );
  RETURN NEW;
END;
$$;

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('verification-documents', 'verification-documents', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification-documents bucket
-- Only users can upload their own documents
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Only admins can view verification documents
CREATE POLICY "Admins can view verification documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents'
  AND public.is_admin(auth.uid())
);

-- Users can delete their own documents (before review)
CREATE POLICY "Users can delete their own verification documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'verification-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can delete any verification documents
CREATE POLICY "Admins can delete verification documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'verification-documents'
  AND public.is_admin(auth.uid())
);

