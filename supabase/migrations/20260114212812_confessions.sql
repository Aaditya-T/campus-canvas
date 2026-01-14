-- Create confessions table
CREATE TABLE public.confessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'anonymous',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) <= 100),
  CONSTRAINT description_length CHECK (char_length(description) <= 1000)
);

-- Create confession_likes table
CREATE TABLE public.confession_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(confession_id, user_id)
);

-- Create confession_comments table
-- Comments are NOT anonymous - they show real user profiles
CREATE TABLE public.confession_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT comment_length CHECK (char_length(content) <= 300)
);

-- Create confession_authors table (HIDDEN - compliance only, no SELECT policy for regular users)
CREATE TABLE public.confession_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  confession_id UUID NOT NULL REFERENCES public.confessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(confession_id, user_id)
);

-- Create indexes
CREATE INDEX idx_confessions_created_at ON public.confessions(created_at DESC);
CREATE INDEX idx_confession_likes_confession_id ON public.confession_likes(confession_id);
CREATE INDEX idx_confession_likes_user_id ON public.confession_likes(user_id);
CREATE INDEX idx_confession_comments_confession_id ON public.confession_comments(confession_id);
CREATE INDEX idx_confession_comments_user_id ON public.confession_comments(user_id);
CREATE INDEX idx_confession_authors_confession_id ON public.confession_authors(confession_id);
CREATE INDEX idx_confession_authors_user_id ON public.confession_authors(user_id);

-- Full-text search index on confessions
CREATE INDEX idx_confessions_search ON public.confessions USING GIN(
  to_tsvector('english', title || ' ' || description)
);

-- Enable RLS on all tables
ALTER TABLE public.confessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confession_authors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for confessions
CREATE POLICY "Confessions are viewable by everyone" ON public.confessions
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create confessions" ON public.confessions
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Confessions are permanent - no updates or deletes allowed

-- RLS Policies for confession_likes
CREATE POLICY "Confession likes are viewable by everyone" ON public.confession_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like confessions" ON public.confession_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own likes" ON public.confession_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for confession_comments
CREATE POLICY "Confession comments are viewable by everyone" ON public.confession_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.confession_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.confession_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.confession_comments
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for confession_authors (HIDDEN - only admins can access)
-- NO SELECT policy for regular users - completely hidden from API
CREATE POLICY "Only admins can view confession authors" ON public.confession_authors
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert confession authors" ON public.confession_authors
  FOR INSERT WITH CHECK (true); -- Trigger will insert, so we allow it

-- Function to check confession ownership (uses hidden confession_authors table)
CREATE OR REPLACE FUNCTION public.check_confession_ownership(p_confession_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Check if current user is the author via hidden confession_authors table
  RETURN EXISTS (
    SELECT 1
    FROM public.confession_authors
    WHERE confession_id = p_confession_id
      AND user_id = auth.uid()
  );
END;
$$;

-- Function to handle new confession - creates entry in confession_authors
CREATE OR REPLACE FUNCTION public.handle_new_confession()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into hidden confession_authors table for compliance
  INSERT INTO public.confession_authors (confession_id, user_id)
  VALUES (NEW.id, auth.uid());
  RETURN NEW;
END;
$$;

-- Trigger to create author relationship when confession is created
CREATE TRIGGER on_confession_created
  AFTER INSERT ON public.confessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_confession();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_confession_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_confessions_updated_at
  BEFORE UPDATE ON public.confessions
  FOR EACH ROW EXECUTE FUNCTION public.update_confession_updated_at();

CREATE TRIGGER update_confession_comments_updated_at
  BEFORE UPDATE ON public.confession_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_confession_updated_at();

-- Function for full-text search on confessions
CREATE OR REPLACE FUNCTION public.search_confessions(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  author_name TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.title,
    c.description,
    c.author_name,
    c.created_at,
    c.updated_at
  FROM public.confessions c
  WHERE to_tsvector('english', c.title || ' ' || c.description) @@ plainto_tsquery('english', search_query)
  ORDER BY c.created_at DESC;
END;
$$;

