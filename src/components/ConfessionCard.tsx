import { useState } from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Confession } from '@/hooks/useConfessions';
import ConfessionCommentsModal from './ConfessionCommentsModal';

interface ConfessionCardProps {
  confession: Confession;
  onLike: (confessionId: string) => void;
  index?: number;
}

const ConfessionCard = ({
  confession,
  onLike,
  index = 0,
}: ConfessionCardProps) => {
  const [showCommentsModal, setShowCommentsModal] = useState(false);

  const variantStyles = [
    'sticky-note',
    'sticky-note-pink sketch-border',
    'sticky-note-blue sketch-border',
    'bg-foreground text-background p-4 sketch-border',
  ];

  const rotations = ['rotate-[-2deg]', 'rotate-[1deg]', 'rotate-[-1deg]', 'rotate-[2deg]'];
  const variantIndex = index % variantStyles.length;
  const variant = variantStyles[variantIndex];
  const rotation = rotations[index % rotations.length];
  const isChalk = variantIndex === 3;

  const timeAgo = formatDistanceToNow(new Date(confession.created_at), { addSuffix: true });

  return (
    <>
      <article 
        className={`${variant} ${rotation} hover:shadow-sketch-lg transition-all hover:scale-105 group h-fit`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
            isChalk ? 'bg-background text-foreground' : 'bg-foreground/10'
          }`}>
            👻
          </div>
          <span className={`text-xs font-comic ${isChalk ? 'text-background/70' : 'text-muted-foreground'}`}>
            {confession.author_name} • {timeAgo}
          </span>
        </div>

        {/* Title */}
        <h3 className={`font-hand text-lg md:text-xl font-bold mb-2 ${
          isChalk ? 'text-background' : 'text-foreground'
        }`}>
          {confession.title}
        </h3>

        {/* Description */}
        <p className={`font-hand text-base md:text-lg leading-relaxed mb-4 whitespace-pre-wrap break-words ${
          isChalk ? 'text-background' : 'text-foreground'
        }`}>
          {confession.description}
        </p>

        {/* Actions */}
        <div className={`flex items-center gap-4 text-sm font-comic pt-3 border-t border-dashed ${
          isChalk ? 'border-background/30' : 'border-foreground/30'
        }`}>
          <button 
            onClick={() => onLike(confession.id)}
            className={`flex items-center gap-1 hover:scale-110 transition-transform ${
              confession.user_has_liked ? 'text-accent' : ''
            }`}
          >
            <Heart 
              size={16} 
              strokeWidth={2.5}
              fill={confession.user_has_liked ? 'currentColor' : 'none'}
            />
            <span>{confession.likes_count}</span>
          </button>
          <button 
            onClick={() => setShowCommentsModal(true)}
            className="flex items-center gap-1 hover:scale-110 transition-transform hover:text-primary"
          >
            <MessageCircle size={16} strokeWidth={2.5} />
            <span>{confession.comments_count}</span>
          </button>
        </div>
      </article>

      {/* Comments Modal */}
      <ConfessionCommentsModal
        confession={confession}
        isOpen={showCommentsModal}
        onClose={() => setShowCommentsModal(false)}
        onLike={onLike}
      />
    </>
  );
};

export default ConfessionCard;
