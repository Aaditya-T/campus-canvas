import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Save, Loader2, ArrowLeft } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const { user, profile, updateProfile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [username, setUsername] = useState(profile?.username || '');
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Redirect if not logged in
  if (!loading && !user) {
    navigate('/auth');
    return null;
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      
      toast({
        title: "Avatar uploaded!",
        description: "Don't forget to save your profile"
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload avatar",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await updateProfile({
      username: username.trim() || null,
      display_name: displayName.trim() || null,
      bio: bio.trim() || null,
      avatar_url: avatarUrl || null
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message.includes('duplicate') 
          ? "This username is already taken" 
          : "Failed to update profile",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile updated!",
        description: "Your changes have been saved"
      });
    }

    setIsSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="btn-sketch py-2 px-4 mb-6 text-lg flex items-center gap-2"
          >
            <ArrowLeft size={20} strokeWidth={2.5} />
            Back
          </button>

          <div className="sketch-border bg-card p-6 md:p-8">
            <h1 className="font-hand text-4xl mb-8 marker-underline inline-block">
              ✏️ Edit Profile
            </h1>

            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div 
                className="relative w-32 h-32 sketch-border bg-secondary flex items-center justify-center cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-hand text-5xl">
                    {username?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
                <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploading ? (
                    <Loader2 size={32} className="animate-spin text-paper" />
                  ) : (
                    <Camera size={32} className="text-paper" strokeWidth={2.5} />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="font-comic text-sm text-muted-foreground mt-2">
                Click to upload avatar (max 2MB)
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div>
                <label className="font-comic text-sm text-ink/80 block mb-1">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full sketch-border bg-background px-4 py-3 font-comic focus:outline-none focus:border-primary"
                  placeholder="your_username"
                  maxLength={20}
                />
                <p className="font-comic text-xs text-muted-foreground mt-1">
                  Lowercase letters, numbers, and underscores only
                </p>
              </div>

              <div>
                <label className="font-comic text-sm text-ink/80 block mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full sketch-border bg-background px-4 py-3 font-comic focus:outline-none focus:border-primary"
                  placeholder="Your Display Name"
                  maxLength={50}
                />
              </div>

              <div>
                <label className="font-comic text-sm text-ink/80 block mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full sketch-border bg-background px-4 py-3 font-comic focus:outline-none focus:border-primary resize-none"
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={200}
                />
                <p className="font-comic text-xs text-muted-foreground mt-1">
                  {bio.length}/200 characters
                </p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="font-comic text-sm text-ink/80 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full sketch-border bg-muted px-4 py-3 font-comic text-muted-foreground cursor-not-allowed"
                />
              </div>

              {/* Verification Status */}
              {profile?.status && (
                <div>
                  <label className="font-comic text-sm text-ink/80 block mb-1">
                    Verification Status
                  </label>
                  <div className="flex items-center gap-2">
                    {profile.status === 'pending' && (
                      <span className="px-3 py-1 sketch-border-sm bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 font-comic text-sm">
                        ⏳ Pending Review
                      </span>
                    )}
                    {profile.status === 'approved' && (
                      <span className="px-3 py-1 sketch-border-sm bg-green-500/20 text-green-700 dark:text-green-400 font-comic text-sm">
                        ✓ Approved
                      </span>
                    )}
                    {profile.status === 'rejected' && (
                      <span className="px-3 py-1 sketch-border-sm bg-red-500/20 text-red-700 dark:text-red-400 font-comic text-sm">
                        ✗ Rejected
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Gender (read-only if approved) */}
              {profile?.gender && (
                <div>
                  <label className="font-comic text-sm text-ink/80 block mb-1">
                    Gender
                  </label>
                  <input
                    type="text"
                    value={profile.gender}
                    disabled
                    className="w-full sketch-border bg-muted px-4 py-3 font-comic text-muted-foreground cursor-not-allowed"
                  />
                </div>
              )}

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full btn-sketch-primary py-3 text-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={20} strokeWidth={2.5} />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
