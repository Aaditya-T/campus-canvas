import { Users, MessageCircle, Zap } from 'lucide-react';

interface ChatroomCardProps {
  name: string;
  description: string;
  members: number;
  messages: number;
  isActive?: boolean;
  emoji: string;
  color: 'yellow' | 'blue' | 'pink' | 'green';
}

const ChatroomCard = ({
  name,
  description,
  members,
  messages,
  isActive = false,
  emoji,
  color,
}: ChatroomCardProps) => {
  const colorClasses = {
    yellow: 'bg-secondary',
    blue: 'bg-accent/30',
    pink: 'bg-neon/20',
    green: 'bg-success/30',
  };

  return (
    <div className={`sketch-border ${colorClasses[color]} p-5 hover:shadow-sketch transition-all hover:-translate-y-1 cursor-pointer group`}>
      {/* Header with emoji */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-4xl">{emoji}</div>
        {isActive && (
          <div className="flex items-center gap-1 bg-success text-success-foreground px-2 py-1 text-xs font-comic sketch-border-sm animate-wiggle">
            <Zap size={12} strokeWidth={3} />
            LIVE
          </div>
        )}
      </div>

      {/* Name & Description */}
      <h3 className="text-handwritten-xl font-bold mb-2 group-hover:marker-underline transition-all">
        {name}
      </h3>
      <p className="font-comic text-sm text-muted-foreground mb-4 line-clamp-2">
        {description}
      </p>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm font-comic border-t-2 border-dashed border-foreground/30 pt-3">
        <span className="flex items-center gap-1">
          <Users size={16} strokeWidth={2.5} />
          {members}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle size={16} strokeWidth={2.5} />
          {messages}
        </span>
        <button className="ml-auto btn-sketch py-1 px-3 text-sm">
          Join →
        </button>
      </div>
    </div>
  );
};

export default ChatroomCard;
