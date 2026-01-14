import { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, Loader2, Image as ImageIcon, User } from 'lucide-react';
import { useAdmin, PendingUser, GenderType } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface AdminUserReviewProps {
  user: PendingUser;
  onBack: () => void;
  onApproved: () => void;
  onRejected: () => void;
}

const AdminUserReview = ({ user, onBack, onApproved, onRejected }: AdminUserReviewProps) => {
  const [selectedGender, setSelectedGender] = useState<GenderType | ''>('');
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);
  const [admissionSlipUrl, setAdmissionSlipUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { approveUser, rejectUser, getDocumentUrl } = useAdmin();
  const { toast } = useToast();

  useEffect(() => {
    // Only load documents once when user changes, not on every render
    let isMounted = true;
    
    const loadDocuments = async () => {
      setLoadingDocs(true);
      try {
        if (user.id_card_path) {
          const url = await getDocumentUrl(user.id_card_path);
          if (isMounted) setIdCardUrl(url);
        }
        if (user.admission_slip_path) {
          const url = await getDocumentUrl(user.admission_slip_path);
          if (isMounted) setAdmissionSlipUrl(url);
        }
        if (user.selfie_path) {
          const url = await getDocumentUrl(user.selfie_path);
          if (isMounted) setSelfieUrl(url);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
        if (isMounted) {
          toast({
            title: "Error",
            description: "Failed to load documents",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) {
          setLoadingDocs(false);
        }
      }
    };

    loadDocuments();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, user.id_card_path, user.admission_slip_path, user.selfie_path]); // Only depend on user ID and document paths - getDocumentUrl is memoized

  const handleApprove = async () => {
    if (!selectedGender) {
      toast({
        title: "Gender required",
        description: "Please select a gender before approving",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    const { error } = await approveUser(user.user_id, selectedGender as GenderType);
    setIsProcessing(false);

    if (!error) {
      onApproved();
      onBack();
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    const { error } = await rejectUser(user.user_id);
    setIsProcessing(false);

    if (!error) {
      onRejected();
      onBack();
    }
    setShowRejectDialog(false);
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-comic text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft size={16} />
            Back to dashboard
          </button>
          <h1 className="font-hand text-3xl md:text-4xl marker-underline">
            Review User Verification
          </h1>
        </div>

        {/* User Info */}
        <div className="sketch-border bg-card p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 sketch-border-sm bg-secondary flex items-center justify-center text-2xl font-bold">
              {user.display_name?.charAt(0).toUpperCase() || user.username?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="flex-1">
              <h2 className="font-hand text-2xl mb-1">
                {user.display_name || user.username || 'Anonymous'}
              </h2>
              {user.username && (
                <p className="font-comic text-sm text-muted-foreground mb-1">
                  @{user.username}
                </p>
              )}
              <p className="font-comic text-sm text-muted-foreground">
                {user.email}
              </p>
              {user.submitted_at && (
                <p className="font-comic text-xs text-muted-foreground mt-2">
                  Submitted: {new Date(user.submitted_at).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="sketch-border bg-card p-6 mb-6">
          <h3 className="font-hand text-xl mb-4">Verification Documents</h3>
          
          {loadingDocs ? (
            <div className="text-center py-8">
              <Loader2 size={32} className="animate-spin mx-auto mb-2 text-primary" />
              <p className="font-comic text-sm text-muted-foreground">Loading documents...</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {/* ID Card */}
              {idCardUrl && (
                <div>
                  <label className="font-comic text-sm font-bold mb-2 block">ID Card</label>
                  <div className="sketch-border-sm overflow-hidden">
                    <img
                      src={idCardUrl}
                      alt="ID Card"
                      className="w-full h-64 object-contain bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Admission Slip */}
              {admissionSlipUrl && (
                <div>
                  <label className="font-comic text-sm font-bold mb-2 block">Admission Slip</label>
                  <div className="sketch-border-sm overflow-hidden">
                    <img
                      src={admissionSlipUrl}
                      alt="Admission Slip"
                      className="w-full h-64 object-contain bg-background"
                    />
                  </div>
                </div>
              )}

              {/* Selfie */}
              {selfieUrl && (
                <div className={idCardUrl || admissionSlipUrl ? '' : 'md:col-span-2'}>
                  <label className="font-comic text-sm font-bold mb-2 block">Selfie</label>
                  <div className="sketch-border-sm overflow-hidden">
                    <img
                      src={selfieUrl}
                      alt="Selfie"
                      className="w-full h-64 object-contain bg-background"
                    />
                  </div>
                </div>
              )}

              {!idCardUrl && !admissionSlipUrl && !selfieUrl && (
                <div className="col-span-2 text-center py-8">
                  <ImageIcon size={48} className="mx-auto mb-2 text-muted-foreground" />
                  <p className="font-comic text-muted-foreground">No documents available</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Gender Selection */}
        <div className="sketch-border bg-card p-6 mb-6">
          <label className="font-comic font-bold text-lg mb-3 block">
            Assign Gender *
          </label>
          <Select
            value={selectedGender}
            onValueChange={(value) => setSelectedGender(value as GenderType)}
          >
            <SelectTrigger className="w-full md:w-64">
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="he/him">He/Him</SelectItem>
              <SelectItem value="she/her">She/Her</SelectItem>
              <SelectItem value="they/them">They/Them</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button
            onClick={handleApprove}
            disabled={isProcessing || !selectedGender}
            className="flex-1 btn-sketch-primary py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Check size={20} />
                Approve User
              </>
            )}
          </button>
          <button
            onClick={() => setShowRejectDialog(true)}
            disabled={isProcessing}
            className="flex-1 btn-sketch-destructive py-3 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <X size={20} />
            Reject User
          </button>
        </div>

        {/* Reject Confirmation Dialog */}
        <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject User?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user account and all associated data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleReject}
                className="bg-destructive text-destructive-foreground"
              >
                Reject & Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default AdminUserReview;

