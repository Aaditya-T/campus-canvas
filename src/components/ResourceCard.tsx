import { FileText, Download, Eye, Heart, Calendar } from 'lucide-react';

interface ResourceCardProps {
  title: string;
  branch: string;
  semester: string;
  type: string;
  author: string;
  downloads: number;
  likes: number;
  uploadedAt: string;
}

const ResourceCard = ({ title, branch, semester, type, author, downloads, likes, uploadedAt }: ResourceCardProps) => {
  const typeColors: Record<string, string> = {
    'PYQ': 'bg-accent-red/20 text-accent-red',
    'Notes': 'bg-accent-blue/20 text-accent-blue',
    'Book': 'bg-accent-yellow/20 text-ink',
    'Slides': 'bg-neon-green/20 text-ink',
  };

  return (
    <div className="sketch-border bg-paper p-4 hover:rotate-0 transition-all duration-300 group" style={{ transform: `rotate(${Math.random() * 2 - 1}deg)` }}>
      {/* File Icon */}
      <div className="flex items-start gap-3">
        <div className="w-12 h-14 sketch-border bg-accent-yellow/10 flex items-center justify-center flex-shrink-0">
          <FileText className="w-6 h-6 text-ink" strokeWidth={1.5} />
        </div>
        
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 className="font-hand text-lg text-ink truncate group-hover:text-accent-blue transition-colors">
            {title}
          </h4>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`px-2 py-0.5 text-xs font-comic rounded-sm ${typeColors[type] || 'bg-muted text-ink'}`}>
              {type}
            </span>
            <span className="px-2 py-0.5 text-xs font-comic bg-ink/10 text-ink rounded-sm">
              {branch}
            </span>
            <span className="px-2 py-0.5 text-xs font-comic bg-ink/10 text-ink rounded-sm">
              Sem {semester}
            </span>
          </div>
          
          {/* Author & Date */}
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-comic">
            <span>by {author}</span>
            <span>•</span>
            <Calendar className="w-3 h-3" />
            <span>{uploadedAt}</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t-2 border-dashed border-ink/20">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 text-sm font-comic text-muted-foreground hover:text-accent-red transition-colors">
            <Heart className="w-4 h-4" />
            <span>{likes}</span>
          </button>
          <button className="flex items-center gap-1 text-sm font-comic text-muted-foreground hover:text-accent-blue transition-colors">
            <Eye className="w-4 h-4" />
            <span>Preview</span>
          </button>
        </div>
        
        <button className="btn-sketch px-3 py-1.5 text-sm flex items-center gap-1.5 bg-accent-blue/10 hover:bg-accent-blue/20">
          <Download className="w-4 h-4" />
          <span>{downloads}</span>
        </button>
      </div>
    </div>
  );
};

export default ResourceCard;
