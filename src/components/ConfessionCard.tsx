import { Heart, MessageCircle, Flag } from 'lucide-react';

interface ConfessionCardProps {
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  variant: 'yellow' | 'pink' | 'blue' | 'chalk';
}

const ConfessionCard = ({
  content,
  timestamp,
  likes,
  comments,
  variant,
}: ConfessionCardProps) => {
  const variantStyles = {
    yellow: 'sticky-note',
    pink: 'sticky-note-pink sketch-border',
    blue: 'sticky-note-blue sketch-border',
    chalk: 'bg-foreground text-background p-4 sketch-border',
  };

  const rotations = ['rotate-[-2deg]', 'rotate-[1deg]', 'rotate-[-1deg]', 'rotate-[2deg]'];
  const randomRotation = rotations[Math.floor(Math.random() * rotations.length)];

  return (
    <article 
      className={`${variantStyles[variant]} ${randomRotation} hover:shadow-sketch-lg transition-all hover:scale-105 cursor-pointer group`}
    >
      {/* Anonymous Badge */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${
          variant === 'chalk' ? 'bg-background text-foreground' : 'bg-foreground/10'
        }`}>
          👻
        </div>
        <span className={`text-xs font-comic ${variant === 'chalk' ? 'text-background/70' : 'text-muted-foreground'}`}>
          Anonymous • {timestamp}
        </span>
      </div>

      {/* Content */}
      <p className={`font-hand text-xl md:text-2xl leading-relaxed mb-4 ${
        variant === 'chalk' ? 'text-background' : 'text-foreground'
      }`}>
        "{content}"
      </p>

      {/* Actions */}
      <div className={`flex items-center gap-4 text-sm font-comic pt-3 border-t border-dashed ${
        variant === 'chalk' ? 'border-background/30' : 'border-foreground/30'
      }`}>
        <button className="flex items-center gap-1 hover:scale-110 transition-transform">
          <Heart size={16} strokeWidth={2.5} />
          <span>{likes}</span>
        </button>
        <button className="flex items-center gap-1 hover:scale-110 transition-transform">
          <MessageCircle size={16} strokeWidth={2.5} />
          <span>{comments}</span>
        </button>
        <button className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <Flag size={14} strokeWidth={2.5} />
        </button>
      </div>
    </article>
  );
};

export default ConfessionCard;
