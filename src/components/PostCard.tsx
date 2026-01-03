import { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, X, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post, useComments } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';

interface PostCardProps {
  post: Post;
  tilt?: number;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

const PostCard = ({ post, tilt = 1, onLike, onDelete }: PostCardProps) => {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(post.id);
  const { user } = useAuth();
  
  const tiltClass = tilt % 2 === 0 ? 'tilt-2' : 'tilt-1';
  const isOwner = user?.id === post.user_id;
  
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await addComment(newComment);
    if (!error) {
      setNewComment('');
    }
  };

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true });
  
  return (
    <article className={`sketch-border bg-card p-5 notebook-lines ${tiltClass} hover:shadow-sketch transition-all hover:-translate-y-1 group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-handwritten-lg font-bold overflow-hidden">
            {post.profile?.avatar_url ? (
              <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              post.profile?.username?.charAt(0).toUpperCase() || '?'
            )}
          </div>
          <div>
            <h3 className="text-handwritten-base font-bold">
              @{post.profile?.username || 'anonymous'}
            </h3>
            <p className="text-xs text-muted-foreground font-comic">{timeAgo}</p>
          </div>
        </div>
        {isOwner && (
          <button 
            onClick={() => onDelete(post.id)}
            className="p-1 hover:bg-accent/20 rounded-sm text-accent"
          >
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="font-comic text-base mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span 
              key={tag} 
              className="text-xs font-comic px-2 py-1 bg-accent/20 sketch-border-sm hover:bg-accent/30 cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t-2 border-dashed border-foreground/30">
        <button 
          onClick={() => onLike(post.id)}
          className={`flex items-center gap-1 transition-colors group/btn ${
            post.user_has_liked ? 'text-accent' : 'hover:text-accent'
          }`}
        >
          <Heart 
            size={18} 
            strokeWidth={2.5} 
            className="group-hover/btn:animate-wiggle"
            fill={post.user_has_liked ? 'currentColor' : 'none'}
          />
          <span className="text-sm font-comic">{post.likes_count}</span>
        </button>
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 hover:text-primary transition-colors group/btn"
        >
          <MessageCircle 
            size={18} 
            strokeWidth={2.5}
            className="group-hover/btn:animate-wiggle"
          />
          <span className="text-sm font-comic">{post.comments_count}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-neon transition-colors ml-auto group/btn">
          <Share2 
            size={18} 
            strokeWidth={2.5}
            className="group-hover/btn:animate-wiggle"
          />
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t-2 border-dashed border-foreground/30 space-y-3">
          {/* Add Comment */}
          {user && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-background sketch-border-sm px-3 py-2 font-comic text-sm focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              />
              <button 
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="btn-sketch-primary p-2 disabled:opacity-50"
              >
                <Send size={16} strokeWidth={2.5} />
              </button>
            </div>
          )}

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-4 font-comic text-muted-foreground">
              Loading comments...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 font-comic text-muted-foreground">
              No comments yet. Be the first!
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-2 p-2 bg-background/50 rounded">
                  <div className="w-6 h-6 sketch-border-sm bg-secondary flex items-center justify-center text-xs font-bold shrink-0">
                    {comment.profile?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-comic text-xs font-bold">
                        @{comment.profile?.username || 'anonymous'}
                      </span>
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
                    <p className="font-comic text-sm mt-1">{comment.content}</p>
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
