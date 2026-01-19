import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Loader2, Users } from 'lucide-react';
import { useChatrooms, ChatroomRequest } from '@/hooks/useChatrooms';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface AdminChatroomReviewProps {
  request: ChatroomRequest;
  onBack: () => void;
  onApproved: () => void;
  onRejected: () => void;
}

interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const AdminChatroomReview = ({ request, onBack, onApproved, onRejected }: AdminChatroomReviewProps) => {
  const [moderatorSearch, setModeratorSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [selectedModerators, setSelectedModerators] = useState<UserProfile[]>([]);
  const [requesterProfile, setRequesterProfile] = useState<UserProfile | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { approveChatroomRequest, rejectChatroomRequest } = useChatrooms();
  const { toast } = useToast();

  useEffect(() => {
    // Load requester profile
    const loadRequesterProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, user_id, username, display_name, avatar_url')
          .eq('user_id', request.requested_by)
          .maybeSingle();

        if (!error && data) {
          setRequesterProfile(data);
          // Default: add requester as moderator
          setSelectedModerators([data]);
        }
      } catch (error) {
        console.error('Error loading requester profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    loadRequesterProfile();
  }, [request.requested_by]);

  // Search for users to add as moderators
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (!error && data) {
        // Filter out already selected moderators
        const filtered = data.filter(
          (user) => !selectedModerators.some((mod) => mod.user_id === user.user_id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleSearchChange = (value: string) => {
    setModeratorSearch(value);
    searchUsers(value);
  };

  const addModerator = (user: UserProfile) => {
    if (!selectedModerators.some((mod) => mod.user_id === user.user_id)) {
      setSelectedModerators([...selectedModerators, user]);
    }
    setModeratorSearch('');
    setSearchResults([]);
  };

  const removeModerator = (userId: string) => {
    setSelectedModerators(selectedModerators.filter((mod) => mod.user_id !== userId));
  };

  const handleApprove = async () => {
    if (selectedModerators.length === 0) {
      toast({
        title: 'Moderator required',
        description: 'Please select at least one moderator for the chatroom',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    const moderatorIds = selectedModerators.map((mod) => mod.user_id);
    const { error } = await approveChatroomRequest(request.id, moderatorIds);
    setIsProcessing(false);

    if (!error) {
      onApproved();
      onBack();
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    const { error } = await rejectChatroomRequest(request.id);
    setIsProcessing(false);

    if (!error) {
      onRejected();
      onBack();
    }
    setShowRejectDialog(false);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-comic text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
          <h1 className="font-hand text-3xl md:text-4xl marker-underline">Review Chatroom Request</h1>
        </div>

        {/* Request Details */}
        <div className="sketch-border bg-card p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="text-5xl">{request.emoji}</div>
            <div className="flex-1">
              <h2 className="font-hand text-2xl mb-2">{request.title}</h2>
              <p className="font-comic text-muted-foreground mb-4">{request.description}</p>
              <p className="font-comic text-xs text-muted-foreground">
                Requested: {new Date(request.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Requester Info */}
        <div className="sketch-border bg-card p-6 mb-6">
          <h3 className="font-hand text-xl mb-4">Requested By</h3>
          {loadingProfile ? (
            <div className="flex items-center gap-2">
              <Loader2 size={20} className="animate-spin text-primary" />
              <span className="font-comic text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : requesterProfile ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sketch-border-sm bg-secondary flex items-center justify-center text-lg font-bold">
                {requesterProfile.display_name?.charAt(0).toUpperCase() ||
                  requesterProfile.username?.charAt(0).toUpperCase() ||
                  '?'}
              </div>
              <div>
                <p className="font-hand text-lg">
                  {requesterProfile.display_name || requesterProfile.username || 'Anonymous'}
                </p>
                {requesterProfile.username && (
                  <p className="font-comic text-sm text-muted-foreground">@{requesterProfile.username}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="font-comic text-sm text-muted-foreground">User profile not found</p>
          )}
        </div>

        {/* Moderator Selection */}
        <div className="sketch-border bg-card p-6 mb-6">
          <h3 className="font-hand text-xl mb-4">Select Moderators</h3>
          <p className="font-comic text-sm text-muted-foreground mb-4">
            Choose who can moderate this chatroom. The requester is selected by default.
          </p>

          {/* Search for moderators */}
          <div className="mb-4">
            <Input
              value={moderatorSearch}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search for users by username or name..."
              className="font-comic"
            />
            {searchResults.length > 0 && (
              <div className="mt-2 sketch-border-sm bg-background max-h-48 overflow-y-auto">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => addModerator(user)}
                    className="w-full p-3 hover:bg-accent text-left flex items-center gap-3 font-comic"
                  >
                    <div className="w-8 h-8 sketch-border-sm bg-secondary flex items-center justify-center text-xs font-bold">
                      {user.display_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {user.display_name || user.username || 'Anonymous'}
                      </p>
                      {user.username && <p className="text-xs text-muted-foreground">@{user.username}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected moderators */}
          <div className="space-y-2">
            <label className="font-comic text-sm font-medium">Selected Moderators:</label>
            {selectedModerators.length === 0 ? (
              <p className="font-comic text-sm text-muted-foreground">No moderators selected</p>
            ) : (
              <div className="space-y-2">
                {selectedModerators.map((mod) => (
                  <div
                    key={mod.id}
                    className="flex items-center justify-between p-3 sketch-border-sm bg-background"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-sm font-bold">
                        {mod.display_name?.charAt(0).toUpperCase() ||
                          mod.username?.charAt(0).toUpperCase() ||
                          '?'}
                      </div>
                      <div>
                        <p className="font-comic text-sm font-medium">
                          {mod.display_name || mod.username || 'Anonymous'}
                        </p>
                        {mod.username && (
                          <p className="font-comic text-xs text-muted-foreground">@{mod.username}</p>
                        )}
                      </div>
                    </div>
                    {selectedModerators.length > 1 && (
                      <button
                        onClick={() => removeModerator(mod.user_id)}
                        className="text-destructive hover:text-destructive/80 font-comic text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={handleApprove}
            disabled={isProcessing || selectedModerators.length === 0}
            className="flex-1 btn-sketch-primary py-3 text-lg disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Check size={20} className="mr-2" />
                Approve Chatroom
              </>
            )}
          </Button>
          <Button
            onClick={() => setShowRejectDialog(true)}
            disabled={isProcessing}
            variant="destructive"
            className="flex-1 btn-sketch-destructive py-3 text-lg disabled:opacity-50"
          >
            <X size={20} className="mr-2" />
            Reject Request
          </Button>
        </div>

        {/* Reject Confirmation Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Chatroom Request?</AlertDialogTitle>
              <AlertDialogDescription>
                This will reject the chatroom request. The requester will be notified. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground">
                Reject Request
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminChatroomReview;

