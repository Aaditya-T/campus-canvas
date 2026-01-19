import { useState, useEffect } from 'react';
import { X, Check, XCircle, Users, Settings, Trash2, UserMinus, Loader2 } from 'lucide-react';
import { useChatrooms, type ChatroomAccessType } from '@/hooks/useChatrooms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

interface ModeratorPanelProps {
  chatroom: any;
  onClose: () => void;
  onUpdate: (updates?: {
    title?: string;
    description?: string;
    emoji?: string;
    access_type?: ChatroomAccessType;
  }) => void;
}

const ModeratorPanel = ({ chatroom, onClose, onUpdate }: ModeratorPanelProps) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'members' | 'requests'>('settings');
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState<string | null>(null);
  const [showDeleteMessageDialog, setShowDeleteMessageDialog] = useState<string | null>(null);

  // Settings state
  const [title, setTitle] = useState(chatroom.title);
  const [description, setDescription] = useState(chatroom.description);
  const [emoji, setEmoji] = useState(chatroom.emoji);
  const [accessType, setAccessType] = useState(chatroom.access_type);
  const [savingSettings, setSavingSettings] = useState(false);

  const {
    fetchJoinRequests,
    approveJoinRequest,
    rejectJoinRequest,
    fetchModerators,
    removeMember,
    updateChatroom,
    loading: chatroomsLoading,
  } = useChatrooms();

  useEffect(() => {
    if (activeTab === 'requests') {
      loadJoinRequests();
    } else if (activeTab === 'members') {
      loadMembers();
    }
  }, [activeTab, chatroom.id]);

  const loadJoinRequests = async () => {
    setLoadingRequests(true);
    try {
      const requests = await fetchJoinRequests(chatroom.id);
      setJoinRequests(requests);
    } finally {
      setLoadingRequests(false);
    }
  };

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('chatroom_members')
        .select('*')
        .eq('chatroom_id', chatroom.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch profiles for all unique user IDs
        const userIds = [...new Set(data.map((m: any) => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });

        setMembers(
          data.map((m: any) => ({
            ...m,
            user_profile: profilesMap[m.user_id] || null,
          }))
        );
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const { error } = await approveJoinRequest(requestId);
    if (!error) {
      await loadJoinRequests();
      onUpdate();
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const { error } = await rejectJoinRequest(requestId);
    if (!error) {
      await loadJoinRequests();
    }
  };

  const handleRemoveMember = async (userId: string) => {
    const { error } = await removeMember(chatroom.id, userId);
    if (!error) {
      setShowDeleteMemberDialog(null);
      await loadMembers();
      onUpdate();
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const updates = {
      title: title.trim(),
      description: description.trim(),
      emoji: emoji || '💬',
      access_type: accessType,
    };
    const { error } = await updateChatroom(chatroom.id, updates);
    setSavingSettings(false);
    if (!error) {
      onUpdate(updates);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sketch-border max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-hand text-2xl marker-underline flex items-center gap-2">
            <Settings size={24} />
            Moderator Panel
          </DialogTitle>
          <DialogDescription className="font-comic">
            Manage your chatroom settings, members, and join requests
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b-2 border-dashed border-foreground/30">
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 font-comic text-sm ${
              activeTab === 'settings'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 font-comic text-sm ${
              activeTab === 'members'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 font-comic text-sm ${
              activeTab === 'requests'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Join Requests
            {joinRequests.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {joinRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="emoji" className="font-comic text-sm font-medium block mb-2">
                Emoji
              </label>
              <Input
                id="emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                maxLength={10}
                className="font-comic text-2xl text-center"
              />
            </div>

            <div>
              <label htmlFor="title" className="font-comic text-sm font-medium block mb-2">
                Title
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className="font-comic"
              />
              <p className="font-comic text-xs text-muted-foreground mt-1">{title.length}/100 characters</p>
            </div>

            <div>
              <label htmlFor="description" className="font-comic text-sm font-medium block mb-2">
                Description
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="font-comic min-h-[100px]"
              />
              <p className="font-comic text-xs text-muted-foreground mt-1">{description.length}/500 characters</p>
            </div>

            <div>
              <label htmlFor="access-type" className="font-comic text-sm font-medium block mb-2">
                Access Type
              </label>
              <Select value={accessType} onValueChange={(value: any) => setAccessType(value)}>
                <SelectTrigger id="access-type" className="font-comic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open for All</SelectItem>
                  <SelectItem value="request_to_join">Request to Join</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} className="font-comic">
                Cancel
              </Button>
              <Button onClick={handleSaveSettings} disabled={savingSettings} className="font-comic btn-sketch-accent">
                {savingSettings ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div>
            {loadingMembers ? (
              <div className="text-center py-12">
                <Loader2 size={32} className="animate-spin mx-auto mb-2 text-primary" />
                <p className="font-comic text-sm text-muted-foreground">Loading members...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto mb-2 text-muted-foreground" />
                <p className="font-comic text-muted-foreground">No members found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 sketch-border-sm bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-sm font-bold">
                        {member.user_profile?.display_name?.charAt(0).toUpperCase() ||
                          member.user_profile?.username?.charAt(0).toUpperCase() ||
                          '?'}
                      </div>
                      <div>
                        <p className="font-comic text-sm font-medium">
                          {member.user_profile?.display_name || member.user_profile?.username || 'Anonymous'}
                        </p>
                        {member.user_profile?.username && (
                          <p className="font-comic text-xs text-muted-foreground">@{member.user_profile.username}</p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteMemberDialog(member.user_id)}
                      className="font-comic text-destructive hover:text-destructive"
                    >
                      <UserMinus size={16} className="mr-2" />
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Join Requests Tab */}
        {activeTab === 'requests' && (
          <div>
            {loadingRequests ? (
              <div className="text-center py-12">
                <Loader2 size={32} className="animate-spin mx-auto mb-2 text-primary" />
                <p className="font-comic text-sm text-muted-foreground">Loading requests...</p>
              </div>
            ) : joinRequests.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="mx-auto mb-2 text-muted-foreground" />
                <p className="font-comic text-muted-foreground">No pending join requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <div key={request.id} className="sketch-border-sm bg-background p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-sm font-bold">
                          {request.user_profile?.display_name?.charAt(0).toUpperCase() ||
                            request.user_profile?.username?.charAt(0).toUpperCase() ||
                            '?'}
                        </div>
                        <div>
                          <p className="font-comic text-sm font-medium">
                            {request.user_profile?.display_name || request.user_profile?.username || 'Anonymous'}
                          </p>
                          {request.user_profile?.username && (
                            <p className="font-comic text-xs text-muted-foreground">
                              @{request.user_profile.username}
                            </p>
                          )}
                          <p className="font-comic text-xs text-muted-foreground mt-1">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {request.message && (
                      <p className="font-comic text-sm text-muted-foreground mb-3 pl-13">{request.message}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveRequest(request.id)}
                        className="font-comic btn-sketch-primary flex-1"
                      >
                        <Check size={16} className="mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectRequest(request.id)}
                        className="font-comic btn-sketch-destructive flex-1"
                      >
                        <XCircle size={16} className="mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Member Confirmation */}
        <AlertDialog open={!!showDeleteMemberDialog} onOpenChange={() => setShowDeleteMemberDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove the user from the chatroom. They can request to join again if the chatroom allows it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => showDeleteMemberDialog && handleRemoveMember(showDeleteMemberDialog)}
                className="bg-destructive text-destructive-foreground"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default ModeratorPanel;

