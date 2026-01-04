-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('post-images', 'post-images', true, 5242880)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-images bucket
CREATE POLICY "Post images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own post images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own post images"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add images array to posts table
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Create an index on tags for better filter performance
CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING GIN(tags);