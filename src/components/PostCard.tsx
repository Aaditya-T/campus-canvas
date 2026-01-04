import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Trash2, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post, useComments } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { PREDEFINED_TAGS } from './TagSelector';

interface PostCardProps {
  post: Post;
  tilt?: number;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onUserClick?: (username: string) => void;
}

const PostCard = ({ post, tilt = 1, onLike, onDelete, onTagClick, onUserClick }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(post.id);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const tiltClass = tilt % 2 === 0 ? 'tilt-2' : 'tilt-1';
  const isOwner = user?.id === post.user_id;
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await addComment(newComment);
    if (!error) {
      setNewComment('');
    }
  };

  const handleUserClick = () => {
    if (post.profile?.username) {
      if (onUserClick) {
        onUserClick(post.profile.username);
      } else {
        navigate(`/user/${post.profile.username}`);
      }
    }
  };

  const handleTagClick = (tag: string) => {
    if (onTagClick) {
      onTagClick(tag);
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
    <article className={`sketch-border bg-card p-4 md:p-5 notebook-lines ${tiltClass} hover:shadow-sketch transition-all hover:-translate-y-1 group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <button 
          onClick={handleUserClick}
          className="flex items-center gap-2 md:gap-3 text-left hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 sketch-border-sm bg-secondary flex items-center justify-center text-handwritten-base md:text-handwritten-lg font-bold overflow-hidden">
            {post.profile?.avatar_url ? (
              <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              post.profile?.username?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div>
            <h3 className="text-handwritten-sm md:text-handwritten-base font-bold hover:underline">
              @{post.profile?.username || 'anonymous'}
            </h3>
            <p className="text-xs text-muted-foreground font-comic">{timeAgo}</p>
          </div>
        </button>
        {isOwner && (
          <button 
            onClick={() => onDelete(post.id)}
            className="p-1 hover:bg-accent/20 rounded-sm text-accent"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="font-comic text-sm md:text-base mb-3 md:mb-4 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>

      {/* Images */}
      {hasImages && (
        <div className="relative mb-3 md:mb-4 sketch-border overflow-hidden">
          <img 
            src={post.images[currentImageIndex]} 
            alt={`Post image ${currentImageIndex + 1}`}
            className="w-full max-h-80 object-cover"
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
        <div className="flex flex-wrap gap-1.5 md:gap-2 mb-3 md:mb-4">
          {post.tags.map((tagValue) => {
            const tag = getTagInfo(tagValue);
            return (
              <button
                key={tagValue}
                onClick={() => handleTagClick(tagValue)}
                className={`text-xs font-comic px-1.5 md:px-2 py-0.5 md:py-1 sketch-border-sm hover:opacity-80 cursor-pointer ${
                  tag?.color || 'bg-accent/20'
                }`}
              >
                {tag?.label || `#${tagValue}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 md:gap-4 pt-2 md:pt-3 border-t-2 border-dashed border-foreground/30">
        <button 
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1 transition-colors group/btn ${
            post.user_has_liked ? 'text-accent' : 'hover:text-accent'
          }`}
        >
          <Heart 
            size={16} 
            strokeWidth={2.5} 
            className="group-hover/btn:animate-wiggle"
            fill={post.user_has_liked ? 'currentColor' : 'none'}
          />
          <span className="text-xs md:text-sm font-comic">{post.likes_count}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 hover:text-primary transition-colors group/btn"
        >
          <MessageCircle 
            size={16} 
            strokeWidth={2.5}
            className="group-hover/btn:animate-wiggle"
          />
          <span className="text-xs md:text-sm font-comic">{post.comments_count}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-neon transition-colors ml-auto group/btn">
          <Share2 
            size={16} 
            strokeWidth={2.5}
            className="group-hover/btn:animate-wiggle"
          />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t-2 border-dashed border-foreground/30 space-y-3">
          {/* Add Comment */}
          {user && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-background sketch-border-sm px-2 md:px-3 py-1.5 md:py-2 font-comic text-xs md:text-sm focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="btn-sketch-primary p-1.5 md:p-2 disabled:opacity-50"
              >
                <Send size={14} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-4 font-comic text-muted-foreground text-sm">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 font-comic text-muted-foreground text-sm">
              No comments yet. Be the first!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 p-2 bg-background/50 rounded">
                  <Link 
                    to={`/user/${comment.profile?.username}`}
                    className="w-5 h-5 md:w-6 md:h-6 sketch-border-sm bg-secondary flex items-center justify-center text-xs font-bold shrink-0 hover:opacity-80"
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
                    <p className="font-comic text-xs md:text-sm mt-1 break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

export default PostCard;
