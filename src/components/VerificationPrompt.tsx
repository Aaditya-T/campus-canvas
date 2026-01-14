import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Shield, Camera } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const VerificationPrompt = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Show prompt if user is logged in, profile is loaded, and they haven't submitted verification
    if (!loading && user && profile && profile.status === 'pending' && !profile.submitted_at) {
      // Check if we've shown this prompt before (using sessionStorage)
      const hasSeenPrompt = sessionStorage.getItem('verification-prompt-shown');
      if (!hasSeenPrompt) {
        setIsOpen(true);
        sessionStorage.setItem('verification-prompt-shown', 'true');
      }
    }
  }, [user, profile, loading]);

  const handleVerifyNow = () => {
    setIsOpen(false);
    navigate('/verification');
  };

  const handleDismiss = () => {
    setIsOpen(false);
  };

  if (!user || !profile || profile.status !== 'pending' || profile.submitted_at) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md sketch-border bg-card">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 sketch-border bg-primary/20 rounded-full flex items-center justify-center">
              <Shield size={24} className="text-primary" />
            </div>
            <DialogTitle className="font-hand text-2xl">
              Verify Your Account! 🛡️
            </DialogTitle>
          </div>
          <DialogDescription className="font-comic text-base text-foreground/80 pt-2">
            <p className="mb-4">
              Welcome to Campus Chaos! To keep our community safe and prevent spam, we need to verify your student status.
            </p>
            <p className="mb-4">
              <strong>What you'll need:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 text-sm">
              <li>Your student ID card <span className="text-muted-foreground">OR</span> admission slip</li>
              <li>A live selfie (we'll use your camera 📸)</li>
            </ul>
            <p className="text-sm mb-4">
              <strong>🔒 Privacy First:</strong> All documents are reviewed by admins and permanently deleted after verification. We never store your personal documents!
            </p>
            <p className="text-sm text-muted-foreground">
              This only takes a few minutes and you'll have full access to all the chaos! 🎉
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleVerifyNow}
            className="flex-1 btn-sketch-primary py-3 text-lg flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            Verify Now
          </button>
          <button
            onClick={handleDismiss}
            className="btn-sketch py-3 px-6 text-lg"
          >
            Later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationPrompt;

