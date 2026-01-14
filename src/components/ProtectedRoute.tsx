import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireApproved?: boolean;
}

const ProtectedRoute = ({ children, requireApproved = true }: ProtectedRouteProps) => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      if (requireApproved && profile?.status === 'pending') {
        // Check if they've submitted documents
        if (!profile.submitted_at) {
          navigate('/verification');
          return;
        }
        // They've submitted, allow them to view but show pending message
        // (they'll see a banner on pages)
      }

      if (profile?.status === 'rejected') {
        navigate('/auth');
      }
    }
  }, [user, profile, loading, navigate, requireApproved]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  if (requireApproved && profile?.status === 'pending' && !profile.submitted_at) {
    return null; // Will redirect
  }

  return <>{children}</>;
};

export default ProtectedRoute;

