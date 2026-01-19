-- Fix chatroom UPDATE policy to include WITH CHECK clause
-- Without WITH CHECK, PostgreSQL RLS blocks the update even if USING passes

DROP POLICY IF EXISTS "Moderators can update their chatrooms" ON public.chatrooms;

CREATE POLICY "Moderators can update their chatrooms" ON public.chatrooms
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = id AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chatroom_moderators
      WHERE chatroom_id = id AND user_id = auth.uid()
    )
  );

