import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Shield, Search } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, PendingUser } from '@/hooks/useAdmin';
import AdminUserReview from '@/components/AdminUserReview';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAdmin } = useAuth();
  const { loading, fetchPendingUsers } = useAdmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!isAdmin) {
      navigate('/');
      return;
    }

    // Only fetch once when component mounts or when user/isAdmin changes
    let isMounted = true;
    
    const loadUsers = async () => {
      const users = await fetchPendingUsers();
      if (isMounted) {
        setPendingUsers(users);
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [user?.id, isAdmin]); // Only depend on user.id and isAdmin, not the whole user object

  const filteredUsers = pendingUsers.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.display_name?.toLowerCase().includes(query)
    );
  });

  if (selectedUser) {
    return (
      <AdminUserReview
        user={selectedUser}
        onBack={() => setSelectedUser(null)}
        onApproved={() => {
          fetchPendingUsers().then(setPendingUsers);
        }}
        onRejected={() => {
          fetchPendingUsers().then(setPendingUsers);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Shield size={32} className="text-primary" />
              <h1 className="font-hand text-3xl md:text-4xl marker-underline">
                Admin Dashboard
              </h1>
            </div>
            <p className="font-comic text-muted-foreground">
              Review and approve pending user verifications
            </p>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, email, or name..."
                className="w-full bg-background sketch-border-sm pl-10 pr-4 py-2 font-comic text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Pending Users List */}
          {loading ? (
            <div className="text-center py-12">
              <Loader2 size={40} className="animate-spin mx-auto mb-4 text-primary" />
              <p className="font-comic text-muted-foreground">Loading pending users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 sketch-border bg-card">
              <p className="font-hand text-2xl mb-4">🎉</p>
              <p className="font-comic text-lg text-muted-foreground">
                {searchQuery ? "No users match your search" : "No pending verifications"}
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredUsers.map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  onClick={() => setSelectedUser(pendingUser)}
                  className="sketch-border bg-card p-4 md:p-6 hover:shadow-sketch transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-hand text-xl md:text-2xl">
                          {pendingUser.display_name || pendingUser.username || 'Anonymous'}
                        </h3>
                        {pendingUser.username && (
                          <span className="font-comic text-sm text-muted-foreground">
                            @{pendingUser.username}
                          </span>
                        )}
                      </div>
                      <p className="font-comic text-sm text-muted-foreground mb-2">
                        {pendingUser.email}
                      </p>
                      {pendingUser.submitted_at && (
                        <p className="font-comic text-xs text-muted-foreground">
                          Submitted: {new Date(pendingUser.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {(pendingUser.id_card_path || pendingUser.admission_slip_path) && (
                        <span className="text-xs font-comic px-2 py-1 sketch-border-sm bg-accent/20">
                          ID Doc
                        </span>
                      )}
                      {pendingUser.selfie_path && (
                        <span className="text-xs font-comic px-2 py-1 sketch-border-sm bg-primary/20">
                          Selfie
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

