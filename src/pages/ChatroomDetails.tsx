import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Loader2,
  Settings,
  Users,
  UserPlus,
  LogOut,
  Shield,
  ImagePlus,
  X,
  Reply,
  Search,
  MessageSquare,
  ChevronDown,
} from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useChatrooms } from '@/hooks/useChatrooms';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ModeratorPanel from '@/components/ModeratorPanel';
import { supabase } from '@/integrations/supabase/client';
import { compressImageIfNeeded } from '@/lib/imageCompression';
import { useToast } from '@/hooks/use-toast';

const MESSAGES_PER_PAGE = 30;
const MAX_MESSAGE_LENGTH = 1000;
const MAX_IMAGES = 5;

const ChatroomDetails = () => {
  const { chatroomId } = useParams<{ chatroomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const {
    fetchChatroom,
    fetchMessages,
    sendMessage,
    deleteMessage,
    joinChatroom,
    requestToJoinChatroom,
    leaveChatroom,
    loading,
  } = useChatrooms();

  const [chatroom, setChatroom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageContent, setMessageContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [joinRequestMessage, setJoinRequestMessage] = useState('');
  const [showModeratorPanel, setShowModeratorPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Scroll to bottom function - scrolls only the chat container
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setIsAtBottom(true);
      setShowScrollToBottom(false);
    }
  };

  // Load initial chatroom and messages
  useEffect(() => {
    if (!chatroomId) return;

    const loadChatroom = async () => {
      const room = await fetchChatroom(chatroomId);
      if (!room) {
        navigate('/chatrooms');
        return;
      }
      setChatroom(room);

      // Load initial messages if user is a member
      if (room.is_member) {
        const msgs = await fetchMessages(chatroomId, MESSAGES_PER_PAGE);
        setMessages(msgs.reverse()); // Reverse to show oldest first
        setHasMoreMessages(msgs.length === MESSAGES_PER_PAGE);
        // Scroll to bottom after initial load (only once)
        setTimeout(() => {
          if (messagesEndRef.current && messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            setIsAtBottom(true);
            setShowScrollToBottom(false);
          }
        }, 100);
      }
    };

    loadChatroom();
  }, [chatroomId, user, fetchChatroom, fetchMessages]);

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!chatroomId || !user || !chatroom?.is_member) return;

    const channel = supabase
      .channel(`chatroom:${chatroomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatroom_messages',
          filter: `chatroom_id=eq.${chatroomId}`,
        },
        async (payload) => {
          const { data: messageData, error } = await supabase
            .from('chatroom_messages')
            .select('*')
            .eq('id', payload.new.id)
            .single();

          if (error || !messageData || messageData.deleted_at) return;

          // Fetch user profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('user_id, username, display_name, avatar_url')
            .eq('user_id', messageData.user_id)
            .maybeSingle();

          // Fetch parent message if it's a reply
          let parentMessage = null;
          if (messageData.parent_message_id) {
            const { data: parentData } = await supabase
              .from('chatroom_messages')
              .select('*, user_id')
              .eq('id', messageData.parent_message_id)
              .single();

            if (parentData) {
              const { data: parentProfile } = await supabase
                .from('profiles')
                .select('user_id, username, display_name, avatar_url')
                .eq('user_id', parentData.user_id)
                .maybeSingle();

              parentMessage = {
                ...parentData,
                user_profile: parentProfile || null,
              };
            }
          }

          const newMessage = {
            ...messageData,
            user_profile: profileData || null,
            parent_message: parentMessage,
          };

          setMessages((prev) => [...prev, newMessage]);

          // Auto-scroll if user is at bottom, otherwise show scroll button
          if (isAtBottom) {
            // User is at bottom, auto-scroll to show new message
            setTimeout(() => {
              if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTo({
                  top: messagesContainerRef.current.scrollHeight,
                  behavior: 'smooth'
                });
              }
            }, 100);
          } else {
            // User is not at bottom, show scroll button
            setShowScrollToBottom(true);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chatroom_messages',
          filter: `chatroom_id=eq.${chatroomId}`,
        },
        (payload) => {
          if (payload.new.deleted_at) {
            setMessages((prev) => prev.filter((msg) => msg.id !== payload.new.id));
          } else {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === payload.new.id ? { ...msg, ...payload.new } : msg))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatroomId, user, chatroom?.is_member, isAtBottom]);

  // Handle scroll to detect if user is at bottom
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
    setIsAtBottom(isNearBottom);
    setShowScrollToBottom(!isNearBottom);

    // Load more messages when scrolling to top
    if (container.scrollTop === 0 && hasMoreMessages && !loadingMoreMessages) {
      loadMoreMessages();
    }
  }, [hasMoreMessages, loadingMoreMessages]);

  // Load more messages (pagination)
  const loadMoreMessages = async () => {
    if (!chatroomId || loadingMoreMessages || !hasMoreMessages) return;

    setLoadingMoreMessages(true);
    try {
      const oldestMessage = messages[0];
      const { data: olderMessages, error } = await supabase
        .from('chatroom_messages')
        .select('*')
        .eq('chatroom_id', chatroomId)
        .is('deleted_at', null)
        .lt('created_at', oldestMessage?.created_at || new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (error) throw error;

      if (olderMessages && olderMessages.length > 0) {
        // Fetch profiles for new messages
        const userIds = [...new Set(olderMessages.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });

        // Fetch parent messages for replies
        const parentIds = olderMessages
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

        const enrichedMessages = olderMessages.map((msg) => ({
          ...msg,
          user_profile: profilesMap[msg.user_id] || null,
          parent_message: msg.parent_message_id ? parentMessagesMap[msg.parent_message_id] || null : null,
        }));

        const previousScrollHeight = messagesContainerRef.current?.scrollHeight || 0;

        setMessages((prev) => [...enrichedMessages.reverse(), ...prev]);
        setHasMoreMessages(olderMessages.length === MESSAGES_PER_PAGE);

        // Maintain scroll position
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  // Handle image upload
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user || selectedImages.length >= MAX_IMAGES) return;

    const remainingSlots = MAX_IMAGES - selectedImages.length;
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setUploadingImages(true);

    try {
      const uploadedUrls: string[] = [];

      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid file',
            description: `${file.name} is not an image`,
            variant: 'destructive',
          });
          continue;
        }

        const compressedBlob = await compressImageIfNeeded(file);
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, compressedBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('post-images').getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length > 0) {
        setSelectedImages([...selectedImages, ...uploadedUrls]);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: 'Upload error',
        description: 'Something went wrong while uploading',
        variant: 'destructive',
      });
    } finally {
      setUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!messageContent.trim() && selectedImages.length === 0) || !chatroomId || !chatroom?.is_member) return;

    const content = messageContent.trim() || '';
    const images = selectedImages;

    // Use a custom function to send message with images and reply
    try {
      const { error } = await supabase.from('chatroom_messages').insert({
        chatroom_id: chatroomId,
        user_id: user!.id,
        content,
        images: images.length > 0 ? images : null,
        parent_message_id: replyingTo?.id || null,
      });

      if (error) throw error;

      setMessageContent('');
      setSelectedImages([]);
      setReplyingTo(null);

      // Auto-scroll to bottom after sending message (only in chat container)
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
          setIsAtBottom(true);
          setShowScrollToBottom(false);
        }
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: `Failed to send message: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  // Search messages
  const handleSearch = async () => {
    if (!searchQuery.trim() || !chatroomId) return;

    try {
      const { data, error } = await supabase.rpc('search_chatroom_messages', {
        p_chatroom_id: chatroomId,
        p_search_query: searchQuery.trim(),
      });

      if (error) throw error;

      // Fetch profiles for search results
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });

        const enrichedResults = data.map((msg: any) => ({
          ...msg,
          user_profile: profilesMap[msg.user_id] || null,
        }));

        setSearchResults(enrichedResults);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      console.error('Error searching messages:', error);
      toast({
        title: 'Search error',
        description: `Failed to search: ${error?.message || 'Unknown error'}`,
        variant: 'destructive',
      });
    }
  };

  const handleJoin = async () => {
    if (!chatroomId) return;

    if (chatroom?.access_type === 'open') {
      const { error } = await joinChatroom(chatroomId);
      if (!error) {
        const updated = await fetchChatroom(chatroomId);
        setChatroom(updated);
        if (updated?.is_member) {
          const msgs = await fetchMessages(chatroomId, MESSAGES_PER_PAGE);
          setMessages(msgs.reverse());
          setTimeout(() => {
            if (messagesEndRef.current && messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
              setIsAtBottom(true);
              setShowScrollToBottom(false);
            }
          }, 100);
        }
      }
    } else {
      setShowJoinRequestModal(true);
    }
  };

  const handleRequestToJoin = async () => {
    if (!chatroomId) return;

    const { error } = await requestToJoinChatroom(chatroomId, joinRequestMessage.trim() || undefined);
    if (!error) {
      setShowJoinRequestModal(false);
      setJoinRequestMessage('');
      const updated = await fetchChatroom(chatroomId);
      setChatroom(updated);
    }
  };

  const handleLeave = async () => {
    if (!chatroomId) return;

    const { error } = await leaveChatroom(chatroomId);
    if (!error) {
      navigate('/chatrooms');
    }
  };

  if (!chatroom) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <Loader2 size={40} className="animate-spin mx-auto mb-4 text-primary" />
              <p className="font-comic text-muted-foreground">Loading chatroom...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="pt-20 pb-16 flex-1 flex flex-col min-h-0">
        <div className="container mx-auto px-4 flex-1 flex flex-col max-w-6xl min-h-0">
          {/* Header */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/chatrooms')}
              className="flex items-center gap-2 font-comic text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft size={16} />
              Back to chatrooms
            </button>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="text-5xl">{chatroom.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="font-hand text-3xl md:text-4xl marker-underline">{chatroom.title}</h1>
                    {chatroom.is_moderator && (
                      <Shield size={20} className="text-primary" title="You are a moderator" />
                    )}
                  </div>
                  <p className="font-comic text-muted-foreground mb-2">{chatroom.description}</p>
                  <div className="flex items-center gap-4 font-comic text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users size={16} />
                      {chatroom.member_count || 0} members
                    </span>
                    <span>{chatroom.message_count || 0} messages</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chatroom.is_moderator && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowModeratorPanel(true)}
                    className="font-comic"
                  >
                    <Settings size={16} className="mr-2" />
                    Manage
                  </Button>
                )}
                {chatroom.is_member && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSearch(!showSearch)}
                    className="font-comic"
                  >
                    <Search size={16} className="mr-2" />
                    Search
                  </Button>
                )}
                {chatroom.is_member ? (
                  <Button variant="outline" size="sm" onClick={handleLeave} className="font-comic">
                    <LogOut size={16} className="mr-2" />
                    Leave
                  </Button>
                ) : chatroom.has_pending_join_request ? (
                  <Button variant="outline" size="sm" disabled className="font-comic">
                    Request Pending
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleJoin} className="font-comic btn-sketch-accent">
                    <UserPlus size={16} className="mr-2" />
                    {chatroom.access_type === 'open' ? 'Join' : 'Request to Join'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && chatroom.is_member && (
            <div className="mb-4 sketch-border bg-card p-3">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search messages..."
                  className="font-comic flex-1"
                />
                <Button onClick={handleSearch} className="font-comic">
                  <Search size={16} />
                </Button>
                <Button variant="outline" onClick={() => setShowSearch(false)} className="font-comic">
                  <X size={16} />
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-2 sketch-border-sm bg-background hover:bg-accent cursor-pointer"
                      onClick={() => {
                        // Scroll to message (would need message refs for this)
                        setShowSearch(false);
                      }}
                    >
                      <p className="font-comic text-sm">
                        <span className="font-medium">
                          {result.user_profile?.display_name || result.user_profile?.username || 'Anonymous'}:
                        </span>{' '}
                        {result.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages Container - Fixed height with scroll */}
          {chatroom.is_member ? (
            <div className="flex-1 flex flex-col sketch-border bg-card min-h-0 max-h-[calc(100vh-12rem)] relative">
              {/* Scroll to Bottom Button */}
              {showScrollToBottom && (
                <button
                  onClick={scrollToBottom}
                  className="absolute bottom-20 right-4 z-10 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors sketch-border-sm"
                  title="Scroll to bottom"
                >
                  <ChevronDown size={20} />
                </button>
              )}

              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
                style={{ maxHeight: '100%' }}
              >
                {loadingMoreMessages && (
                  <div className="text-center py-2">
                    <Loader2 size={20} className="animate-spin mx-auto text-primary" />
                  </div>
                )}
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={48} className="mx-auto mb-2 text-muted-foreground" />
                    <p className="font-hand text-2xl mb-2">💬</p>
                    <p className="font-comic text-muted-foreground">No messages yet. Be the first to say something!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                    const isCurrentUser = message.user_id === user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-sm font-bold shrink-0">
                          {message.user_profile?.display_name?.charAt(0).toUpperCase() ||
                            message.user_profile?.username?.charAt(0).toUpperCase() ||
                            '?'}
                        </div>

                        {/* Message Content */}
                        <div className={`flex-1 max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                          {/* Reply Preview */}
                          {message.parent_message && (
                            <div
                              className={`mb-1 p-2 sketch-border-sm bg-muted/50 text-xs font-comic ${
                                isCurrentUser ? 'text-right' : ''
                              }`}
                            >
                              <span className="font-medium">
                                Replying to {message.parent_message.user_profile?.display_name ||
                                  message.parent_message.user_profile?.username ||
                                  'Anonymous'}
                              </span>
                              <p className="text-muted-foreground line-clamp-1 mt-1">
                                {message.parent_message.content}
                              </p>
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`p-3 sketch-border-sm ${
                              isCurrentUser
                                ? 'bg-primary text-primary-foreground ml-auto'
                                : 'bg-muted'
                            } rounded-lg`}
                          >
                            {/* User Name */}
                            <div className={`flex items-center gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                              <span className={`font-comic text-sm font-medium ${isCurrentUser ? 'text-primary-foreground' : ''}`}>
                                {message.user_profile?.display_name || message.user_profile?.username || 'Anonymous'}
                              </span>
                              <span className={`font-comic text-xs ${isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {new Date(message.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {/* Message Content */}
                            {message.content && (
                              <p className={`font-comic text-sm whitespace-pre-wrap ${isCurrentUser ? 'text-primary-foreground' : ''}`}>
                                {message.content}
                              </p>
                            )}

                            {/* Images */}
                            {message.images && message.images.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {message.images.map((img: string, idx: number) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`Attachment ${idx + 1}`}
                                    className="w-full h-32 object-cover sketch-border-sm rounded cursor-pointer hover:opacity-90"
                                    onClick={() => window.open(img, '_blank')}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Actions */}
                            <div className={`flex items-center gap-2 mt-2 ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                              {!isCurrentUser && (
                                <button
                                  onClick={() => setReplyingTo(message)}
                                  className="text-xs font-comic text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  <Reply size={12} />
                                  Reply
                                </button>
                              )}
                              {(chatroom.is_moderator || isCurrentUser) && (
                                <button
                                  onClick={() => deleteMessage(message.id)}
                                  className="text-xs font-comic text-destructive hover:text-destructive/80"
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply Preview */}
              {replyingTo && (
                <div className="px-4 py-2 border-t-2 border-dashed border-foreground/30 bg-muted/30 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-comic text-xs text-muted-foreground">
                      Replying to <span className="font-medium">{replyingTo.user_profile?.display_name || replyingTo.user_profile?.username || 'Anonymous'}</span>
                    </p>
                    <p className="font-comic text-xs text-muted-foreground line-clamp-1">{replyingTo.content}</p>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-dashed border-foreground/30">
                {/* Image Previews */}
                {selectedImages.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {selectedImages.map((url, index) => (
                      <div key={index} className="relative w-20 h-20 sketch-border-sm overflow-hidden group">
                        <img src={url} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== index))}
                          className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    placeholder="Type your message..."
                    className="font-comic min-h-[60px] resize-none flex-1"
                    maxLength={MAX_MESSAGE_LENGTH}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages || selectedImages.length >= MAX_IMAGES}
                      className="font-comic"
                      title="Add images"
                    >
                      {uploadingImages ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <ImagePlus size={20} />
                      )}
                    </Button>
                    <Button
                      type="submit"
                      disabled={(!messageContent.trim() && selectedImages.length === 0) || loading}
                      className="font-comic btn-sketch-accent"
                    >
                      <Send size={20} />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-comic text-xs text-muted-foreground">
                    {messageContent.length}/{MAX_MESSAGE_LENGTH} characters
                    {selectedImages.length > 0 && ` • ${selectedImages.length}/${MAX_IMAGES} images`}
                  </p>
                  <p className="font-comic text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line
                  </p>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center py-12 sketch-border bg-card">
              <p className="font-hand text-2xl mb-4">🔒</p>
              <p className="font-comic text-lg text-muted-foreground mb-4">
                {chatroom.access_type === 'open'
                  ? 'Join this chatroom to see messages'
                  : 'Request to join this chatroom to see messages'}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      {/* Join Request Modal */}
      <Dialog open={showJoinRequestModal} onOpenChange={setShowJoinRequestModal}>
        <DialogContent className="sketch-border">
          <DialogHeader>
            <DialogTitle className="font-hand text-2xl marker-underline">Request to Join</DialogTitle>
            <DialogDescription className="font-comic">
              Send a request to join this chatroom. You can include an optional message.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label htmlFor="join-message" className="font-comic text-sm font-medium block mb-2">
                Message (optional)
              </label>
              <Textarea
                id="join-message"
                value={joinRequestMessage}
                onChange={(e) => setJoinRequestMessage(e.target.value)}
                placeholder="Why do you want to join this chatroom?"
                className="font-comic min-h-[100px]"
                maxLength={300}
              />
              <p className="font-comic text-xs text-muted-foreground mt-1">{joinRequestMessage.length}/300 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJoinRequestModal(false)} className="font-comic">
              Cancel
            </Button>
            <Button onClick={handleRequestToJoin} className="font-comic btn-sketch-accent">
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Moderator Panel */}
      {showModeratorPanel && chatroom && (
        <ModeratorPanel
          chatroom={chatroom}
          onClose={() => setShowModeratorPanel(false)}
          onUpdate={async (updates) => {
            if (updates) {
              setChatroom((prev) => (prev ? { ...prev, ...updates } : prev));
            }
            const updated = await fetchChatroom(chatroomId!);
            setChatroom(updated);
          }}
        />
      )}
    </div>
  );
};

export default ChatroomDetails;
