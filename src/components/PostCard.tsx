import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface PostCardProps {
  author: string;
  avatar?: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  tags?: string[];
  tilt?: number;
}

const PostCard = ({ 
  author, 
  content, 
  timestamp, 
  likes, 
  comments, 
  tags = [],
  tilt = 1 
}: PostCardProps) => {
  const tiltClass = tilt % 2 === 0 ? 'tilt-2' : 'tilt-1';
  
  return (
    <article className={`sketch-border bg-card p-5 notebook-lines ${tiltClass} hover:shadow-sketch transition-all hover:-translate-y-1 group`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sketch-border-sm bg-secondary flex items-center justify-center text-handwritten-lg font-bold">
            {author.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-handwritten-base font-bold">{author}</h3>
            <p className="text-xs text-muted-foreground font-comic">{timestamp}</p>
          </div>
        </div>
        <button className="p-1 hover:bg-muted rounded-sm">
          <MoreHorizontal size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Content */}
      <p className="font-comic text-base mb-4 leading-relaxed">{content}</p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
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
        <button className="flex items-center gap-1 hover:text-destructive transition-colors group/btn">
          <Heart 
            size={18} 
            strokeWidth={2.5} 
            className="group-hover/btn:animate-wiggle"
          />
          <span className="text-sm font-comic">{likes}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-accent transition-colors group/btn">
          <MessageCircle 
            size={18} 
            strokeWidth={2.5}
            className="group-hover/btn:animate-wiggle"
          />
          <span className="text-sm font-comic">{comments}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-success transition-colors ml-auto group/btn">
          <Share2 
            size={18} 
            strokeWidth={2.5}
            className="group-hover/btn:animate-wiggle"
          />
        </button>
      </div>
    </article>
  );
};

export default PostCard;
