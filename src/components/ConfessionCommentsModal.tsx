import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, Heart, MessageCircle, Check, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Confession, useConfessionComments } from '@/hooks/useConfessions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CONFESSION_COMMENT_MAX_LENGTH, getCharacterCountColor, isOverLimit } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ConfessionCommentsModalProps {
  confession: Confession;
  isOpen: boolean;
  onClose: () => void;
  onLike: (confessionId: string) => void;
}

const ConfessionCommentsModal = ({ confession, isOpen, onClose, onLike }: ConfessionCommentsModalProps) => {
  const [newComment, setNewComment] = useState('');
  const [copied, setCopied] = useState(false);
  const { comments, loading: commentsLoading, addComment, deleteComment } = useConfessionComments(confession.id);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddComment = async () => {
    if (!newComment.trim() || isOverLimit(newComment.length, CONFESSION_COMMENT_MAX_LENGTH)) return;
    const { error } = await addComment(newComment);
    if (!error) {
      setNewComment('');
    }
  };

  const handleCommentChange = (value: string) => {
    if (value.length <= CONFESSION_COMMENT_MAX_LENGTH + 50) {
      setNewComment(value);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/confessions#${confession.id}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with your friends"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Failed to copy",
        description: "Please copy the URL manually",
        variant: "destructive"
      });
    }
  };

  const timeAgo = formatDistanceToNow(new Date(confession.created_at), { addSuffix: true });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 sketch-border bg-card">
        <DialogHeader className="p-4 border-b-2 border-dashed border-foreground/30">
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-lg">
              👻
            </div>
            <div>
              <p className="text-handwritten-base font-bold">
                {confession.author_name}
              </p>
              <p className="text-xs text-muted-foreground font-comic">{timeAgo}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Confession Content */}
          <div className="p-4 border-b-2 border-dashed border-foreground/30">
            <h3 className="font-hand text-lg md:text-xl font-bold mb-2">
              {confession.title}
            </h3>
            <p className="font-comic text-sm md:text-base mb-3 leading-relaxed whitespace-pre-wrap break-words">
              {confession.description}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t-2 border-dashed border-foreground/30">
              <button 
                onClick={() => onLike(confession.id)}
                className={`flex items-center gap-1 transition-colors ${
                  confession.user_has_liked ? 'text-accent' : 'hover:text-accent'
                }`}
              >
                <Heart 
                  size={18} 
                  strokeWidth={2.5} 
                  fill={confession.user_has_liked ? 'currentColor' : 'none'}
                />
                <span className="text-sm font-comic">{confession.likes_count}</span>
              </button>
              <div className="flex items-center gap-1 text-primary">
                <MessageCircle size={18} strokeWidth={2.5} />
                <span className="text-sm font-comic">{comments.length}</span>
              </div>
              <button 
                onClick={handleShare}
                className="flex items-center gap-1 hover:text-neon transition-colors ml-auto"
              >
                {copied ? (
                  <Check size={18} strokeWidth={2.5} className="text-neon" />
                ) : (
                  <Copy size={18} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="p-4">
            <h3 className="font-comic font-bold text-sm mb-3">
              Comments ({comments.length})
            </h3>

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {commentsLoading ? (
                <div className="text-center py-4 font-comic text-muted-foreground text-sm">
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-6 font-comic text-muted-foreground text-sm">
                  No comments yet. Be the first to comment! 💬
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 p-2 bg-background/50 rounded sketch-border-sm">
                    <Link 
                      to={`/user/${comment.profile?.username}`}
                      className="w-7 h-7 sketch-border-sm bg-secondary flex items-center justify-center text-xs font-bold shrink-0 hover:opacity-80 overflow-hidden"
                    >
                      {comment.profile?.avatar_url ? (
                        <img src={comment.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        comment.profile?.username?.charAt(0).toUpperCase() || '?'
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link 
                          to={`/user/${comment.profile?.username}`}
                          className="font-comic text-xs font-bold hover:underline"
                        >
                          @{comment.profile?.username || 'anonymous'}
                        </Link>
                        <span className="text-xs text-muted-foreground font-comic">
                          {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                        </span>
                        {comment.user_owns && (
                          <button 
                            onClick={() => deleteComment(comment.id)}
                            className="ml-auto text-accent hover:text-accent/80"
                          >
                            <X size={12} strokeWidth={3} />
                          </button>
                        )}
                      </div>
                      <p className="font-comic text-sm mt-1 break-words">{comment.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Add Comment - Fixed at bottom */}
        {user ? (
          <div className="p-4 border-t-2 border-dashed border-foreground/30 bg-card">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => handleCommentChange(e.target.value)}
                  placeholder="Write a comment..."
                  className={`w-full bg-background sketch-border-sm px-3 py-2 pr-16 font-comic text-sm focus:outline-none ${
                    isOverLimit(newComment.length, CONFESSION_COMMENT_MAX_LENGTH) ? 'border-destructive' : ''
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-comic ${
                  getCharacterCountColor(newComment.length, CONFESSION_COMMENT_MAX_LENGTH)
                }`}>
                  {CONFESSION_COMMENT_MAX_LENGTH - newComment.length}
                </span>
              </div>
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || isOverLimit(newComment.length, CONFESSION_COMMENT_MAX_LENGTH)}
                className="btn-sketch-primary p-2 disabled:opacity-50"
              >
                <Send size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 border-t-2 border-dashed border-foreground/30 bg-card text-center">
            <Link to="/auth" className="font-comic text-sm text-primary hover:underline">
              Login to comment
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConfessionCommentsModal;

