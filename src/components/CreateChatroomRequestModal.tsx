import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useChatrooms } from '@/hooks/useChatrooms';
import { Loader2 } from 'lucide-react';

interface CreateChatroomRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const CreateChatroomRequestModal = ({ open, onOpenChange, onSuccess }: CreateChatroomRequestModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('💬');
  const { createChatroomRequest, loading } = useChatrooms();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return;
    }

    const { error } = await createChatroomRequest(title.trim(), description.trim(), emoji || '💬');

    if (!error) {
      setTitle('');
      setDescription('');
      setEmoji('💬');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sketch-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-hand text-2xl marker-underline">Create Chatroom Request</DialogTitle>
          <DialogDescription className="font-comic">
            Submit a request to create a new chatroom. An admin will review and approve it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="emoji" className="font-comic text-sm font-medium">
              Emoji
            </label>
            <Input
              id="emoji"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="💬"
              maxLength={10}
              className="font-comic text-2xl text-center"
            />
            <p className="font-comic text-xs text-muted-foreground">Choose an emoji to represent your chatroom</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="font-comic text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Night Owls Club"
              maxLength={100}
              className="font-comic"
              required
            />
            <p className="font-comic text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="font-comic text-sm font-medium">
              Description <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what your chatroom is about..."
              maxLength={500}
              className="font-comic min-h-[100px]"
              required
            />
            <p className="font-comic text-xs text-muted-foreground">{description.length}/500 characters</p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-comic"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="font-comic btn-sketch-accent" disabled={loading || !title.trim() || !description.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChatroomRequestModal;

