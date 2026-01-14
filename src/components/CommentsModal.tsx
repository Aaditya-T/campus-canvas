import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Send, ChevronLeft, ChevronRight, Heart, MessageCircle, Share2, Check, Copy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post, useComments } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { PREDEFINED_TAGS } from './TagSelector';
import { useToast } from '@/hooks/use-toast';
import { COMMENT_MAX_LENGTH, getCharacterCountColor, isOverLimit } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CommentsModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onLike: (postId: string) => void;
}

const CommentsModal = ({ post, isOpen, onClose, onLike }: CommentsModalProps) => {
  const [newComment, setNewComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(post.id);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAddComment = async () => {
    if (!newComment.trim() || isOverLimit(newComment.length, COMMENT_MAX_LENGTH)) return;
    const { error } = await addComment(newComment);
    if (!error) {
      setNewComment('');
    }
  };

  const handleCommentChange = (value: string) => {
    if (value.length <= COMMENT_MAX_LENGTH + 50) {
      setNewComment(value);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    
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

  const getTagInfo = (value: string) => {
    return PREDEFINED_TAGS.find(t => t.value === value);
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  const hasImages = post.images && post.images.length > 0;
  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % post.images.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + post.images.length) % post.images.length);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 sketch-border bg-card">
        <DialogHeader className="p-4 border-b-2 border-dashed border-foreground/30">
          <DialogTitle className="flex items-center gap-3">
            <Link 
              to={`/user/${post.profile?.username}`}
              className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-handwritten-lg font-bold overflow-hidden hover:opacity-80"
            >
              {post.profile?.avatar_url ? (
                <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                post.profile?.username?.charAt(0).toUpperCase() || '?'
              )}
            </Link>
            <div>
              <Link 
                to={`/user/${post.profile?.username}`}
                className="text-handwritten-base font-bold hover:underline"
              >
                @{post.profile?.username || 'anonymous'}
              </Link>
              <p className="text-xs text-muted-foreground font-comic">{timeAgo}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Post Content */}
          <div className="p-4 border-b-2 border-dashed border-foreground/30">
            <p className="font-comic text-sm md:text-base mb-3 leading-relaxed whitespace-pre-wrap break-words">
              {post.content}
            </p>

            {/* Images */}
            {hasImages && (
              <div className="relative mb-3 sketch-border overflow-hidden">
                <img 
                  src={post.images[currentImageIndex]} 
                  alt={`Post image ${currentImageIndex + 1}`}
                  className="w-full max-h-80 object-contain bg-background"
                />
                {post.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-1 top-1/2 -translate-y-1/2 bg-background/80 p-1 rounded-full hover:bg-background"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-background/80 p-1 rounded-full hover:bg-background"
                    >
                      <ChevronRight size={20} />
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                      {post.images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentImageIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            idx === currentImageIndex ? 'bg-primary' : 'bg-background/60'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tagValue) => {
                  const tag = getTagInfo(tagValue);
                  return (
                    <span
                      key={tagValue}
                      className={`text-xs font-comic px-1.5 py-0.5 sketch-border-sm ${
                        tag?.color || 'bg-accent/20'
                      }`}
                    >
                      {tag?.label || `#${tagValue}`}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 pt-3 border-t-2 border-dashed border-foreground/30">
              <button 
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-1 transition-colors ${
                  post.user_has_liked ? 'text-accent' : 'hover:text-accent'
                }`}
              >
                <Heart 
                  size={18} 
                  strokeWidth={2.5} 
                  fill={post.user_has_liked ? 'currentColor' : 'none'}
                />
                <span className="text-sm font-comic">{post.likes_count}</span>
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
                  <Share2 size={18} strokeWidth={2.5} />
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
                        {user?.id === comment.user_id && (
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
                    isOverLimit(newComment.length, COMMENT_MAX_LENGTH) ? 'border-destructive' : ''
                  }`}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-comic ${
                  getCharacterCountColor(newComment.length, COMMENT_MAX_LENGTH)
                }`}>
                  {COMMENT_MAX_LENGTH - newComment.length}
                </span>
              </div>
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim() || isOverLimit(newComment.length, COMMENT_MAX_LENGTH)}
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

export default CommentsModal;
