import { useState } from 'react';
import { FileText, Download, Eye, Heart, Calendar, Loader2, Trash2 } from 'lucide-react';
import { useResources } from '@/hooks/useResources';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ResourceCardProps {
  id: string;
  title: string;
  branch: string;
  semester: string;
  type: string;
  author: string;
  downloads: number;
  likes: number;
  uploadedAt: string;
  isLiked?: boolean;
  userId: string;
  onDelete?: () => void;
}

const ResourceCard = ({
  id,
  title,
  branch,
  semester,
  type,
  author,
  downloads,
  likes,
  uploadedAt,
  isLiked: initialIsLiked,
  userId,
  onDelete,
}: ResourceCardProps) => {
  const [isLiked, setIsLiked] = useState(initialIsLiked || false);
  const [likesCount, setLikesCount] = useState(likes);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { toast } = useToast();
  const { likeResource, downloadResource, getResourcePreview, deleteResource } = useResources();

  const typeColors: Record<string, string> = {
    PYQ: 'bg-accent-red/20 text-accent-red',
    Notes: 'bg-accent-blue/20 text-accent-blue',
    Book: 'bg-accent-yellow/20 text-ink',
    Slides: 'bg-neon-green/20 text-ink',
  };

  const isOwner = user?.id === userId;

  const handleLike = async () => {
    if (!user) {
      toast({
        title: 'Not logged in',
        description: 'Please log in to like resources',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await likeResource(id);
    if (!error) {
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const { url, error } = await downloadResource(id);
      if (error || !url) {
        toast({
          title: 'Download failed',
          description: error?.message || 'Failed to generate download URL',
          variant: 'destructive',
        });
        return;
      }

      // Open download in new tab
      window.open(url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    setLoading(true);
    try {
      const { url, error } = await getResourcePreview(id);
      if (error || !url) {
        toast({
          title: 'Preview unavailable',
          description: error?.message || 'Preview only available for PDF files',
          variant: 'destructive',
        });
        return;
      }

      setPreviewUrl(url);
      setShowPreview(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    const { error } = await deleteResource(id);
    setLoading(false);
    setShowDeleteDialog(false);

    if (!error && onDelete) {
      onDelete();
    }
  };

  return (
    <>
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
            <button
              onClick={handleLike}
              disabled={loading}
              className={`flex items-center gap-1 text-sm font-comic transition-colors ${
                isLiked
                  ? 'text-accent-red hover:text-accent-red/80'
                  : 'text-muted-foreground hover:text-accent-red'
              } disabled:opacity-50`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center gap-1 text-sm font-comic text-muted-foreground hover:text-accent-blue transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span>Preview</span>
            </button>
            {isOwner && (
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1 text-sm font-comic text-destructive hover:text-destructive/80 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <button
            onClick={handleDownload}
            disabled={loading}
            className="btn-sketch px-3 py-1.5 text-sm flex items-center gap-1.5 bg-accent-blue/10 hover:bg-accent-blue/20 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>{downloads}</span>
          </button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="sketch-border max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-hand text-2xl marker-underline">{title}</DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="w-full h-[calc(90vh-8rem)]">
              <iframe
                src={previewUrl}
                className="w-full h-full border-2 border-dashed border-ink/30 rounded-sm"
                title="PDF Preview"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="sketch-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hand text-2xl">Delete Resource?</AlertDialogTitle>
            <AlertDialogDescription className="font-comic">
              Are you sure you want to delete "{title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-comic" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="font-comic bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ResourceCard;
