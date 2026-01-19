import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export type ChatroomAccessType = 'open' | 'request_to_join';
export type ChatroomRequestStatus = 'pending' | 'approved' | 'rejected';

export interface ChatroomRequest {
  id: string;
  requested_by: string;
  title: string;
  description: string;
  emoji: string;
  status: ChatroomRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  requester_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface Chatroom {
  id: string;
  request_id: string;
  title: string;
  description: string;
  emoji: string;
  access_type: ChatroomAccessType;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
  message_count?: number;
  is_member?: boolean;
  is_moderator?: boolean;
  has_pending_join_request?: boolean;
  creator_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface ChatroomMessage {
  id: string;
  chatroom_id: string;
  user_id: string;
  content: string;
  images?: string[] | null;
  parent_message_id?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  parent_message?: ChatroomMessage | null;
}

export interface ChatroomJoinRequest {
  id: string;
  chatroom_id: string;
  user_id: string;
  message: string | null;
  status: ChatroomRequestStatus;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  user_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface ChatroomModerator {
  id: string;
  chatroom_id: string;
  user_id: string;
  added_by: string | null;
  created_at: string;
  user_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export const useChatrooms = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all approved chatrooms
  const fetchChatrooms = useCallback(async (): Promise<Chatroom[]> => {
    setLoading(true);
    try {
      const { data: chatrooms, error } = await supabase
        .from('chatrooms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get member counts, message counts, and creator profiles
      const creatorIds = [...new Set((chatrooms || []).map((c) => c.created_by))];
      const { data: creatorProfiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', creatorIds);

      const profilesMap: Record<string, any> = {};
      creatorProfiles?.forEach((p) => {
        profilesMap[p.user_id] = p;
      });

      // Get member counts and message counts
      const chatroomsWithStats = await Promise.all(
        (chatrooms || []).map(async (chatroom) => {
          const [memberCount, messageCount, isMember, isModerator, hasPendingRequest] = await Promise.all([
            supabase
              .from('chatroom_members')
              .select('id', { count: 'exact', head: true })
              .eq('chatroom_id', chatroom.id)
              .then(({ count }) => count || 0),
            supabase
              .from('chatroom_messages')
              .select('id', { count: 'exact', head: true })
              .eq('chatroom_id', chatroom.id)
              .is('deleted_at', null)
              .then(({ count }) => count || 0),
            user
              ? supabase
                  .from('chatroom_members')
                  .select('id')
                  .eq('chatroom_id', chatroom.id)
                  .eq('user_id', user.id)
                  .maybeSingle()
                  .then(({ data }) => !!data)
              : Promise.resolve(false),
            user
              ? supabase
                  .from('chatroom_moderators')
                  .select('id')
                  .eq('chatroom_id', chatroom.id)
                  .eq('user_id', user.id)
                  .maybeSingle()
                  .then(({ data }) => !!data)
              : Promise.resolve(false),
            user
              ? supabase
                  .from('chatroom_join_requests')
                  .select('id')
                  .eq('chatroom_id', chatroom.id)
                  .eq('user_id', user.id)
                  .eq('status', 'pending')
                  .maybeSingle()
                  .then(({ data }) => !!data)
              : Promise.resolve(false),
          ]);

          return {
            ...chatroom,
            member_count: memberCount,
            message_count: messageCount,
            is_member: isMember,
            is_moderator: isModerator,
            has_pending_join_request: hasPendingRequest,
            creator_profile: profilesMap[chatroom.created_by] || null,
          };
        })
      );

      return chatroomsWithStats;
    } catch (error: any) {
      console.error('Error fetching chatrooms:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch chatrooms: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Fetch pending chatroom requests (for admins)
  const fetchPendingRequests = useCallback(async (): Promise<ChatroomRequest[]> => {
    setLoading(true);
    try {
      const { data: requests, error } = await supabase
        .from('chatroom_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch requester profiles
      const requesterIds = [...new Set((requests || []).map((r) => r.requested_by))];
      const { data: requesterProfiles } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .in('user_id', requesterIds);

      const profilesMap: Record<string, any> = {};
      requesterProfiles?.forEach((p) => {
        profilesMap[p.user_id] = p;
      });

      return (requests || []).map((req) => ({
        ...req,
        requester_profile: profilesMap[req.requested_by] || null,
      }));
    } catch (error: any) {
      console.error('Error fetching pending requests:', error);
      toast({
        title: 'Error',
        description: `Failed to fetch pending requests: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create chatroom request
  const createChatroomRequest = useCallback(
    async (title: string, description: string, emoji: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase.from('chatroom_requests').insert({
          requested_by: user.id,
          title,
          description,
          emoji: emoji || '💬',
        });

        if (error) throw error;

        toast({
          title: 'Request submitted',
          description: 'Your chatroom request has been submitted for admin review',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error creating chatroom request:', error);
        toast({
          title: 'Error',
          description: `Failed to create request: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Approve chatroom request (admin only)
  const approveChatroomRequest = useCallback(
    async (
      requestId: string,
      moderatorIds: string[] = []
    ): Promise<{ error: Error | null; chatroomId?: string }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('approve_chatroom_request', {
          p_request_id: requestId,
          p_moderator_ids: moderatorIds,
        });

        if (error) throw error;

        toast({
          title: 'Chatroom approved',
          description: 'The chatroom has been created and is now live',
        });

        return { error: null, chatroomId: data };
      } catch (error: any) {
        console.error('Error approving chatroom request:', error);
        toast({
          title: 'Error',
          description: `Failed to approve request: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Reject chatroom request (admin only)
  const rejectChatroomRequest = useCallback(
    async (requestId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase.rpc('reject_chatroom_request', {
          p_request_id: requestId,
        });

        if (error) throw error;

        toast({
          title: 'Request rejected',
          description: 'The chatroom request has been rejected',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error rejecting chatroom request:', error);
        toast({
          title: 'Error',
          description: `Failed to reject request: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Join chatroom (for open chatrooms)
  const joinChatroom = useCallback(
    async (chatroomId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase.from('chatroom_members').insert({
          chatroom_id: chatroomId,
          user_id: user.id,
        });

        if (error) throw error;

        toast({
          title: 'Joined chatroom',
          description: 'You have successfully joined the chatroom',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error joining chatroom:', error);
        toast({
          title: 'Error',
          description: `Failed to join chatroom: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Request to join chatroom (for request_to_join chatrooms)
  const requestToJoinChatroom = useCallback(
    async (chatroomId: string, message?: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase.from('chatroom_join_requests').insert({
          chatroom_id: chatroomId,
          user_id: user.id,
          message: message || null,
        });

        if (error) throw error;

        toast({
          title: 'Join request sent',
          description: 'Your request to join has been sent to the moderators',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error requesting to join chatroom:', error);
        toast({
          title: 'Error',
          description: `Failed to send join request: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Leave chatroom
  const leaveChatroom = useCallback(
    async (chatroomId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase
          .from('chatroom_members')
          .delete()
          .eq('chatroom_id', chatroomId)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: 'Left chatroom',
          description: 'You have left the chatroom',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error leaving chatroom:', error);
        toast({
          title: 'Error',
          description: `Failed to leave chatroom: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Fetch chatroom details
  const fetchChatroom = useCallback(
    async (chatroomId: string): Promise<Chatroom | null> => {
      setLoading(true);
      try {
      const { data: chatroom, error } = await supabase
        .from('chatrooms')
        .select('*')
        .eq('id', chatroomId)
        .single();

        if (error) throw error;

        const [memberCount, messageCount, isMember, isModerator, hasPendingRequest, creatorProfile] = await Promise.all([
          supabase
            .from('chatroom_members')
            .select('id', { count: 'exact', head: true })
            .eq('chatroom_id', chatroomId)
            .then(({ count }) => count || 0),
          supabase
            .from('chatroom_messages')
            .select('id', { count: 'exact', head: true })
            .eq('chatroom_id', chatroomId)
            .is('deleted_at', null)
            .then(({ count }) => count || 0),
          user
            ? supabase
                .from('chatroom_members')
                .select('id')
                .eq('chatroom_id', chatroomId)
                .eq('user_id', user.id)
                .maybeSingle()
                .then(({ data }) => !!data)
            : Promise.resolve(false),
          user
            ? supabase
                .from('chatroom_moderators')
                .select('id')
                .eq('chatroom_id', chatroomId)
                .eq('user_id', user.id)
                .maybeSingle()
                .then(({ data }) => !!data)
            : Promise.resolve(false),
          user
            ? supabase
                .from('chatroom_join_requests')
                .select('id')
                .eq('chatroom_id', chatroomId)
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .maybeSingle()
                .then(({ data }) => !!data)
            : Promise.resolve(false),
          supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .eq('user_id', chatroom.created_by)
            .maybeSingle()
            .then(({ data }) => data || null),
        ]);

        return {
          ...chatroom,
          member_count: memberCount,
          message_count: messageCount,
          is_member: isMember,
          is_moderator: isModerator,
          has_pending_join_request: hasPendingRequest,
          creator_profile: creatorProfile,
        };
      } catch (error: any) {
        console.error('Error fetching chatroom:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch chatroom: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Fetch messages for a chatroom
  const fetchMessages = useCallback(
    async (chatroomId: string, limit: number = 50): Promise<ChatroomMessage[]> => {
      try {
        const { data: messages, error } = await supabase
          .from('chatroom_messages')
          .select('*')
          .eq('chatroom_id', chatroomId)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;

        if (!messages || messages.length === 0) return [];

        // Fetch profiles for all unique user IDs
        const userIds = [...new Set(messages.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });

        // Fetch parent messages for replies
        const parentIds = messages
          .filter((m) => m.parent_message_id)
          .map((m) => m.parent_message_id)
          .filter((id): id is string => !!id);

        let parentMessagesMap: Record<string, any> = {};
        if (parentIds.length > 0) {
          const { data: parentMessages } = await supabase
            .from('chatroom_messages')
            .select('*, user_id')
            .in('id', parentIds);

          if (parentMessages) {
            const parentUserIds = [...new Set(parentMessages.map((m) => m.user_id))];
            const { data: parentProfiles } = await supabase
              .from('profiles')
              .select('user_id, username, display_name, avatar_url')
              .in('user_id', parentUserIds);

            const parentProfilesMap: Record<string, any> = {};
            parentProfiles?.forEach((p) => {
              parentProfilesMap[p.user_id] = p;
            });

            parentMessages.forEach((pm) => {
              parentMessagesMap[pm.id] = {
                ...pm,
                user_profile: parentProfilesMap[pm.user_id] || null,
              };
            });
          }
        }

        return messages.map((msg) => ({
          ...msg,
          user_profile: profilesMap[msg.user_id] || null,
          parent_message: msg.parent_message_id ? parentMessagesMap[msg.parent_message_id] || null : null,
        }));
      } catch (error: any) {
        console.error('Error fetching messages:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch messages: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast]
  );

  // Send message
  const sendMessage = useCallback(
    async (chatroomId: string, content: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      try {
        const { error } = await supabase.from('chatroom_messages').insert({
          chatroom_id: chatroomId,
          user_id: user.id,
          content,
        });

        if (error) throw error;

        return { error: null };
      } catch (error: any) {
        console.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: `Failed to send message: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      }
    },
    [user, toast]
  );

  // Delete message (soft delete)
  const deleteMessage = useCallback(
    async (messageId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      try {
        const { error } = await supabase
          .from('chatroom_messages')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', messageId);

        if (error) throw error;

        toast({
          title: 'Message deleted',
          description: 'The message has been deleted',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error deleting message:', error);
        toast({
          title: 'Error',
          description: `Failed to delete message: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      }
    },
    [user, toast]
  );

  // Fetch join requests for a chatroom (moderators only)
  const fetchJoinRequests = useCallback(
    async (chatroomId: string): Promise<ChatroomJoinRequest[]> => {
      try {
        const { data: requests, error } = await supabase
          .from('chatroom_join_requests')
          .select('*')
          .eq('chatroom_id', chatroomId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch profiles for all unique user IDs
        const userIds = [...new Set((requests || []).map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });

        return (requests || []).map((req) => ({
          ...req,
          user_profile: profilesMap[req.user_id] || null,
        }));
      } catch (error: any) {
        console.error('Error fetching join requests:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch join requests: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast]
  );

  // Approve join request (moderators only)
  const approveJoinRequest = useCallback(
    async (joinRequestId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase.rpc('approve_join_request', {
          p_join_request_id: joinRequestId,
        });

        if (error) throw error;

        toast({
          title: 'Join request approved',
          description: 'The user has been added to the chatroom',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error approving join request:', error);
        toast({
          title: 'Error',
          description: `Failed to approve join request: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Reject join request (moderators only)
  const rejectJoinRequest = useCallback(
    async (joinRequestId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase.rpc('reject_join_request', {
          p_join_request_id: joinRequestId,
        });

        if (error) throw error;

        toast({
          title: 'Join request rejected',
          description: 'The join request has been rejected',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error rejecting join request:', error);
        toast({
          title: 'Error',
          description: `Failed to reject join request: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Fetch moderators for a chatroom
  const fetchModerators = useCallback(
    async (chatroomId: string): Promise<ChatroomModerator[]> => {
      try {
        const { data: moderators, error } = await supabase
          .from('chatroom_moderators')
          .select('*')
          .eq('chatroom_id', chatroomId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        // Fetch profiles for all unique user IDs
        const userIds = [...new Set((moderators || []).map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });

        return (moderators || []).map((mod) => ({
          ...mod,
          user_profile: profilesMap[mod.user_id] || null,
        }));
      } catch (error: any) {
        console.error('Error fetching moderators:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch moderators: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return [];
      }
    },
    [toast]
  );

  // Remove member from chatroom (moderators only)
  const removeMember = useCallback(
    async (chatroomId: string, userId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase
          .from('chatroom_members')
          .delete()
          .eq('chatroom_id', chatroomId)
          .eq('user_id', userId);

        if (error) throw error;

        toast({
          title: 'Member removed',
          description: 'The user has been removed from the chatroom',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error removing member:', error);
        toast({
          title: 'Error',
          description: `Failed to remove member: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Update chatroom settings (moderators only)
  const updateChatroom = useCallback(
    async (
      chatroomId: string,
      updates: { title?: string; description?: string; emoji?: string; access_type?: ChatroomAccessType }
    ): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        const { error } = await supabase
        .from('chatrooms')
        .update(updates)
        .eq('id', chatroomId)
        .select()
        .single();
      
        if (error) throw error;

        toast({
          title: 'Chatroom updated',
          description: 'The chatroom settings have been updated',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error updating chatroom:', error);
        toast({
          title: 'Error',
          description: `Failed to update chatroom: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  return {
    loading,
    fetchChatrooms,
    fetchPendingRequests,
    createChatroomRequest,
    approveChatroomRequest,
    rejectChatroomRequest,
    joinChatroom,
    requestToJoinChatroom,
    leaveChatroom,
    fetchChatroom,
    fetchMessages,
    sendMessage,
    deleteMessage,
    fetchJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    fetchModerators,
    removeMember,
    updateChatroom,
  };
};

