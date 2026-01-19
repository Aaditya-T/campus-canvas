-- Create resources table
CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  branch TEXT NOT NULL,
  semester TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PYQ', 'Notes', 'Book', 'Slides')),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  downloads INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) <= 200),
  CONSTRAINT semester_range CHECK (semester IN ('1', '2', '3', '4', '5', '6', '7', '8'))
);

-- Create resource_likes table
CREATE TABLE public.resource_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(resource_id, user_id)
);

-- Create indexes
CREATE INDEX idx_resources_branch ON public.resources(branch);
CREATE INDEX idx_resources_semester ON public.resources(semester);
CREATE INDEX idx_resources_type ON public.resources(type);
CREATE INDEX idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX idx_resources_user_id ON public.resources(user_id);
CREATE INDEX idx_resource_likes_resource_id ON public.resource_likes(resource_id);
CREATE INDEX idx_resource_likes_user_id ON public.resource_likes(user_id);

-- Full-text search index on resources
CREATE INDEX idx_resources_search ON public.resources USING GIN(
  to_tsvector('english', title)
);

-- Enable RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resources
-- Everyone can view resources
CREATE POLICY "Resources are viewable by everyone" ON public.resources
  FOR SELECT USING (true);

-- Authenticated approved users can create resources
CREATE POLICY "Approved users can create resources" ON public.resources
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND status = 'approved'
    )
  );

-- Only owner or admin can update resources
CREATE POLICY "Owners and admins can update resources" ON public.resources
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only owner or admin can delete resources
CREATE POLICY "Owners and admins can delete resources" ON public.resources
  FOR DELETE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for resource_likes
-- Everyone can view likes
CREATE POLICY "Resource likes are viewable by everyone" ON public.resource_likes
  FOR SELECT USING (true);

-- Authenticated users can like resources
CREATE POLICY "Authenticated users can like resources" ON public.resource_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can unlike their own likes
CREATE POLICY "Users can unlike resources" ON public.resource_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_resource_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updated_at
CREATE TRIGGER update_resources_updated_at
  BEFORE UPDATE ON public.resources
  FOR EACH ROW EXECUTE FUNCTION public.update_resource_updated_at();

-- Create storage bucket for resources
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('resources', 'resources', false, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for resources bucket
-- Users can upload their own files
CREATE POLICY "Users can upload their own resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Everyone can download via signed URLs (no direct SELECT policy needed)
-- Users can delete their own files
CREATE POLICY "Users can delete their own resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can delete any resource file
CREATE POLICY "Admins can delete any resource"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources'
  AND EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Function to increment download count
CREATE OR REPLACE FUNCTION public.increment_resource_downloads(p_resource_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.resources
  SET downloads = downloads + 1
  WHERE id = p_resource_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_resource_downloads(UUID) TO authenticated;

