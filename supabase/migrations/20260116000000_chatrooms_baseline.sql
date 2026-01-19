-- Chatrooms baseline schema + RLS

-- Enums
CREATE TYPE public.chatroom_access_type AS ENUM ('open', 'request_to_join');
CREATE TYPE public.chatroom_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Chatroom requests table (pending chatroom creation requests)
CREATE TABLE public.chatroom_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💬',
  status public.chatroom_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT title_length CHECK (char_length(title) <= 100),
  CONSTRAINT description_length CHECK (char_length(description) <= 500),
  CONSTRAINT emoji_length CHECK (char_length(emoji) <= 10)
);

-- Chatrooms table (approved chatrooms)
CREATE TABLE public.chatrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL UNIQUE REFERENCES public.chatroom_requests(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💬',
  access_type public.chatroom_access_type NOT NULL DEFAULT 'open',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) <= 100),
  CONSTRAINT description_length CHECK (char_length(description) <= 500),
  CONSTRAINT emoji_length CHECK (char_length(emoji) <= 10)
);

-- Chatroom moderators table (many-to-many relationship)
CREATE TABLE public.chatroom_moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatroom_id UUID NOT NULL REFERENCES public.chatrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chatroom_id, user_id)
);

-- Chatroom members table
CREATE TABLE public.chatroom_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatroom_id UUID NOT NULL REFERENCES public.chatrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chatroom_id, user_id)
);

-- Chatroom join requests table
CREATE TABLE public.chatroom_join_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatroom_id UUID NOT NULL REFERENCES public.chatrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT,
  status public.chatroom_request_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT message_length CHECK (char_length(message) <= 300)
);

-- Chatroom messages table
CREATE TABLE public.chatroom_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chatroom_id UUID NOT NULL REFERENCES public.chatrooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  parent_message_id UUID REFERENCES public.chatroom_messages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT content_length CHECK (char_length(content) <= 1000)
);

-- Indexes
CREATE INDEX idx_chatroom_requests_requested_by ON public.chatroom_requests(requested_by);
CREATE INDEX idx_chatroom_requests_status ON public.chatroom_requests(status);
CREATE INDEX idx_chatroom_requests_created_at ON public.chatroom_requests(created_at DESC);

CREATE INDEX idx_chatrooms_created_by ON public.chatrooms(created_by);
CREATE INDEX idx_chatrooms_created_at ON public.chatrooms(created_at DESC);
CREATE INDEX idx_chatrooms_access_type ON public.chatrooms(access_type);
CREATE INDEX idx_chatrooms_search ON public.chatrooms USING GIN(
  to_tsvector('english', title || ' ' || description)
);

CREATE INDEX idx_chatroom_moderators_chatroom_id ON public.chatroom_moderators(chatroom_id);
CREATE INDEX idx_chatroom_moderators_user_id ON public.chatroom_moderators(user_id);

CREATE INDEX idx_chatroom_members_chatroom_id ON public.chatroom_members(chatroom_id);
CREATE INDEX idx_chatroom_members_user_id ON public.chatroom_members(user_id);

CREATE INDEX idx_chatroom_join_requests_chatroom_id ON public.chatroom_join_requests(chatroom_id);
CREATE INDEX idx_chatroom_join_requests_user_id ON public.chatroom_join_requests(user_id);
CREATE INDEX idx_chatroom_join_requests_status ON public.chatroom_join_requests(status);

CREATE INDEX idx_chatroom_messages_chatroom_id ON public.chatroom_messages(chatroom_id);
CREATE INDEX idx_chatroom_messages_user_id ON public.chatroom_messages(user_id);
CREATE INDEX idx_chatroom_messages_created_at ON public.chatroom_messages(chatroom_id, created_at DESC);
CREATE INDEX idx_chatroom_messages_parent_message_id ON public.chatroom_messages(parent_message_id);
CREATE INDEX idx_chatroom_messages_search ON public.chatroom_messages USING GIN(
  to_tsvector('english', content)
);

-- Enable RLS
ALTER TABLE public.chatroom_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatroom_moderators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatroom_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatroom_messages ENABLE ROW LEVEL SECURITY;

-- RLS: chatroom_requests
CREATE POLICY "Users can view their own chatroom requests" ON public.chatroom_requests
  FOR SELECT USING (auth.uid() = requested_by);

CREATE POLICY "Admins can view all chatroom requests" ON public.chatroom_requests
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can create chatroom requests" ON public.chatroom_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Admins can update chatroom requests" ON public.chatroom_requests
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: chatrooms
CREATE POLICY "Chatrooms are viewable by everyone" ON public.chatrooms
  FOR SELECT USING (true);

CREATE POLICY "Only system can create chatrooms (via function)" ON public.chatrooms
  FOR INSERT WITH CHECK (false); -- Only created via approve_chatroom_request function

CREATE POLICY "Moderators can update their chatrooms" ON public.chatrooms
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = id AND user_id = auth.uid()
    )
  );

-- RLS: chatroom_moderators
CREATE POLICY "Moderators are viewable by everyone" ON public.chatroom_moderators
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage moderators" ON public.chatroom_moderators
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can remove moderators" ON public.chatroom_moderators
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS: chatroom_members
CREATE POLICY "Members are viewable by everyone" ON public.chatroom_members
  FOR SELECT USING (true);

CREATE POLICY "Users can join open chatrooms" ON public.chatroom_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chatrooms
      WHERE id = chatroom_id AND access_type = 'open'
    )
  );

CREATE POLICY "Moderators can add members to their chatrooms" ON public.chatroom_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = chatroom_members.chatroom_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can leave chatrooms" ON public.chatroom_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Moderators can remove members from their chatrooms" ON public.chatroom_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = chatroom_members.chatroom_id AND user_id = auth.uid()
    )
  );

-- RLS: chatroom_join_requests
CREATE POLICY "Users can view their own join requests" ON public.chatroom_join_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Moderators can view join requests for their chatrooms" ON public.chatroom_join_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = chatroom_join_requests.chatroom_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create join requests" ON public.chatroom_join_requests
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chatrooms
      WHERE id = chatroom_id AND access_type = 'request_to_join'
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.chatroom_members
      WHERE chatroom_id = chatroom_join_requests.chatroom_id AND user_id = auth.uid()
    ) AND
    NOT EXISTS (
      SELECT 1 FROM public.chatroom_join_requests
      WHERE chatroom_id = chatroom_join_requests.chatroom_id
        AND user_id = auth.uid()
        AND status = 'pending'
    )
  );

CREATE POLICY "Moderators can update join requests for their chatrooms" ON public.chatroom_join_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = chatroom_join_requests.chatroom_id AND user_id = auth.uid()
    )
  );

-- RLS: chatroom_messages
CREATE POLICY "Members can view messages in their chatrooms" ON public.chatroom_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chatroom_members
      WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
    ) AND deleted_at IS NULL
  );

CREATE POLICY "Members can send messages to their chatrooms" ON public.chatroom_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chatroom_members
      WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.chatroom_messages
  FOR UPDATE
  USING (
    auth.uid() = user_id AND deleted_at IS NULL
  )
  WITH CHECK (
    auth.uid() = user_id AND deleted_at IS NULL
  );

CREATE POLICY "Users can delete their own messages" ON public.chatroom_messages
  FOR UPDATE
  USING (
    auth.uid() = user_id AND deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.chatroom_members
      WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chatroom_members
      WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Moderators can delete messages in their chatrooms" ON public.chatroom_messages
  FOR UPDATE
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION public.approve_chatroom_request(
  p_request_id UUID,
  p_moderator_ids UUID[] DEFAULT ARRAY[]::UUID[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_chatroom_id UUID;
  v_requested_by UUID;
  v_title TEXT;
  v_description TEXT;
  v_emoji TEXT;
  v_moderator_id UUID;
BEGIN
  SELECT requested_by, title, description, emoji
  INTO v_requested_by, v_title, v_description, v_emoji
  FROM public.chatroom_requests
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chatroom request not found or already processed';
  END IF;

  INSERT INTO public.chatrooms (request_id, title, description, emoji, created_by)
  VALUES (p_request_id, v_title, v_description, v_emoji, v_requested_by)
  RETURNING id INTO v_chatroom_id;

  IF array_length(p_moderator_ids, 1) IS NULL OR array_length(p_moderator_ids, 1) = 0 THEN
    INSERT INTO public.chatroom_moderators (chatroom_id, user_id, added_by)
    VALUES (v_chatroom_id, v_requested_by, auth.uid());
  ELSE
    FOREACH v_moderator_id IN ARRAY p_moderator_ids
    LOOP
      INSERT INTO public.chatroom_moderators (chatroom_id, user_id, added_by)
      VALUES (v_chatroom_id, v_moderator_id, auth.uid())
      ON CONFLICT (chatroom_id, user_id) DO NOTHING;
    END LOOP;
  END IF;

  INSERT INTO public.chatroom_members (chatroom_id, user_id)
  VALUES (v_chatroom_id, v_requested_by)
  ON CONFLICT (chatroom_id, user_id) DO NOTHING;

  UPDATE public.chatroom_requests
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_request_id;

  RETURN v_chatroom_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_chatroom_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.chatroom_requests
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chatroom request not found or already processed';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_join_request(p_join_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_chatroom_id UUID;
  v_user_id UUID;
BEGIN
  SELECT chatroom_id, user_id
  INTO v_chatroom_id, v_user_id
  FROM public.chatroom_join_requests
  WHERE id = p_join_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Join request not found or already processed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.chatroom_moderators
    WHERE chatroom_id = v_chatroom_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only moderators can approve join requests';
  END IF;

  INSERT INTO public.chatroom_members (chatroom_id, user_id)
  VALUES (v_chatroom_id, v_user_id)
  ON CONFLICT (chatroom_id, user_id) DO NOTHING;

  UPDATE public.chatroom_join_requests
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_join_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_join_request(p_join_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_chatroom_id UUID;
BEGIN
  SELECT chatroom_id
  INTO v_chatroom_id
  FROM public.chatroom_join_requests
  WHERE id = p_join_request_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Join request not found or already processed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.chatroom_moderators
    WHERE chatroom_id = v_chatroom_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Only moderators can reject join requests';
  END IF;

  UPDATE public.chatroom_join_requests
  SET status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_join_request_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_chatroom_moderator(p_chatroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chatroom_moderators
    WHERE chatroom_id = p_chatroom_id AND user_id = p_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_chatroom_member(p_chatroom_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.chatroom_members
    WHERE chatroom_id = p_chatroom_id AND user_id = p_user_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.search_chatroom_messages(
  p_chatroom_id UUID,
  p_search_query TEXT
)
RETURNS TABLE (
  id UUID,
  chatroom_id UUID,
  user_id UUID,
  content TEXT,
  images TEXT[],
  parent_message_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.chatroom_id,
    m.user_id,
    m.content,
    m.images,
    m.parent_message_id,
    m.created_at,
    m.updated_at,
    m.deleted_at
  FROM public.chatroom_messages m
  WHERE m.chatroom_id = p_chatroom_id
    AND m.deleted_at IS NULL
    AND (
      to_tsvector('english', m.content) @@ plainto_tsquery('english', p_search_query)
      OR m.content ILIKE '%' || p_search_query || '%'
    )
  ORDER BY m.created_at DESC
  LIMIT 50;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_chatroom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers
CREATE TRIGGER update_chatrooms_updated_at
  BEFORE UPDATE ON public.chatrooms
  FOR EACH ROW EXECUTE FUNCTION public.update_chatroom_updated_at();

CREATE TRIGGER update_chatroom_messages_updated_at
  BEFORE UPDATE ON public.chatroom_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_chatroom_updated_at();

