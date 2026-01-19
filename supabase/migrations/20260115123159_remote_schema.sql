drop extension if exists "pg_net";

drop policy "Members can update or delete messages" on "public"."chatroom_messages";

drop policy "Members can view messages in their chatrooms" on "public"."chatroom_messages";


  create policy "Members can update or soft-delete messages"
  on "public"."chatroom_messages"
  as permissive
  for update
  to public
using ((((auth.uid() = user_id) AND (EXISTS ( SELECT 1
   FROM public.chatroom_members
  WHERE ((chatroom_members.chatroom_id = chatroom_messages.chatroom_id) AND (chatroom_members.user_id = auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM public.chatroom_moderators
  WHERE ((chatroom_moderators.chatroom_id = chatroom_messages.chatroom_id) AND (chatroom_moderators.user_id = auth.uid()))))))
with check (((auth.uid() = user_id) OR ((EXISTS ( SELECT 1
   FROM public.chatroom_moderators
  WHERE ((chatroom_moderators.chatroom_id = chatroom_messages.chatroom_id) AND (chatroom_moderators.user_id = auth.uid())))) AND (deleted_at IS NOT NULL))));



  create policy "Members can view messages in their chatrooms"
  on "public"."chatroom_messages"
  as permissive
  for select
  to public
using ((((EXISTS ( SELECT 1
   FROM public.chatroom_members
  WHERE ((chatroom_members.chatroom_id = chatroom_messages.chatroom_id) AND (chatroom_members.user_id = auth.uid())))) AND (deleted_at IS NULL)) OR (auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.chatroom_moderators
  WHERE ((chatroom_moderators.chatroom_id = chatroom_messages.chatroom_id) AND (chatroom_moderators.user_id = auth.uid()))))));



