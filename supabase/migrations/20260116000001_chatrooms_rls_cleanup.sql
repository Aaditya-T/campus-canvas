-- Remove overlapping UPDATE policies on chatroom_messages

DROP POLICY IF EXISTS "Users can update their own messages" ON public.chatroom_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.chatroom_messages;
DROP POLICY IF EXISTS "Moderators can delete messages in their chatrooms" ON public.chatroom_messages;

-- Single UPDATE policy that allows:
-- - owners to edit their own non-deleted messages
-- - owners to soft-delete their own messages
-- - moderators to soft-delete messages in their chatrooms
CREATE POLICY "Members can update or delete messages" ON public.chatroom_messages
  FOR UPDATE
  USING (
    deleted_at IS NULL AND (
      (auth.uid() = user_id AND EXISTS (
        SELECT 1 FROM public.chatroom_members
        WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
      ))
      OR
      EXISTS (
        SELECT 1 FROM public.chatroom_moderators
        WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM public.chatroom_members
      WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
    ))
    OR
    (
      EXISTS (
        SELECT 1 FROM public.chatroom_moderators
        WHERE chatroom_id = chatroom_messages.chatroom_id AND user_id = auth.uid()
      )
      AND deleted_at IS NOT NULL
    )
  );

