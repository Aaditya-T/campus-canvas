import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Trash2, ChevronLeft, ChevronRight, Filter, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { PREDEFINED_TAGS } from './TagSelector';
import CommentsModal from './CommentsModal';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PostCardProps {
  post: Post;
  tilt?: number;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
  onTagClick?: (tag: string) => void;
  onUserClick?: (username: string) => void;
}

const PostCard = ({ post, tilt = 1, onLike, onDelete, onTagClick, onUserClick }: PostCardProps) => {
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const tiltClass = tilt % 2 === 0 ? 'tilt-2' : 'tilt-1';
  const isOwner = user?.id === post.user_id;

  const handleFilterByUser = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.profile?.username && onUserClick) {
      onUserClick(post.profile.username);
    }
  };

  const handleGoToProfile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (post.profile?.username) {
      navigate(`/user/${post.profile.username}`);
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
    <>
      <article className={`sketch-border bg-card p-4 md:p-5 notebook-lines ${tiltClass} hover:shadow-sketch transition-all hover:-translate-y-1 group h-fit`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 sketch-border-sm bg-secondary flex items-center justify-center text-handwritten-base md:text-handwritten-lg font-bold overflow-hidden shrink-0">
              {post.profile?.avatar_url ? (
                <img src={post.profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                post.profile?.username?.charAt(0).toUpperCase() || '?'
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-handwritten-sm md:text-handwritten-base font-bold truncate">
                  @{post.profile?.username || 'anonymous'}
                </h3>
                {/* User action buttons */}
                <div className="flex items-center gap-0.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={handleFilterByUser}
                        className="p-1 hover:bg-secondary rounded-sm transition-colors"
                        title="Filter by this user"
                      >
                        <Filter size={12} strokeWidth={2.5} className="text-muted-foreground hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card sketch-border-sm">
                      <p className="font-comic text-xs">Filter by user</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button 
                        onClick={handleGoToProfile}
                        className="p-1 hover:bg-secondary rounded-sm transition-colors"
                        title="View profile"
                      >
                        <ExternalLink size={12} strokeWidth={2.5} className="text-muted-foreground hover:text-foreground" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="bg-card sketch-border-sm">
                      <p className="font-comic text-xs">View profile</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-comic">{timeAgo}</p>
            </div>
          </div>
          {isOwner && (
            <button 
              onClick={() => onDelete(post.id)}
              className="p-1 hover:bg-accent/20 rounded-sm text-accent shrink-0"
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
            onClick={() => setShowCommentsModal(true)}
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
      </article>

      {/* Comments Modal */}
      <CommentsModal
        post={post}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        onLike={onLike}
      />
    </>
  );
};

export default PostCard;
