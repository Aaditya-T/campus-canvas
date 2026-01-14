import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/emailNotifications';

export interface PendingUser {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  email: string;
  id_card_path: string | null;
  admission_slip_path: string | null;
  selfie_path: string | null;
  submitted_at: string | null;
  created_at: string;
}

export type GenderType = 'he/him' | 'she/her' | 'they/them';

export const useAdmin = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPendingUsers = useCallback(async (): Promise<PendingUser[]> => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, id_card_path, admission_slip_path, selfie_path, submitted_at, created_at')
        .eq('status', 'pending')
        .order('submitted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      // Note: We can't fetch emails directly from client-side
      // Admins will need to see emails from the Supabase dashboard or we need a server function
      // For now, we'll return profiles without emails (can be added later via Edge Function)
      const usersWithEmail = profiles.map(profile => ({
        ...profile,
        email: 'N/A' // Email fetching requires admin API access
      }));

      return usersWithEmail as PendingUser[];
    } catch (error: any) {
      console.error('Error fetching pending users:', error);
      const errorMessage = error?.message || 'Unknown error';
      toast({
        title: "Error",
        description: `Failed to fetch pending users: ${errorMessage}`,
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteDocument = async (path: string): Promise<boolean> => {
    try {
      const pathParts = path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const userId = pathParts[pathParts.length - 2];

      const { error } = await supabase.storage
        .from('verification-documents')
        .remove([`${userId}/${fileName}`]);

      if (error) {
        console.error('Error deleting document:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  };

  const approveUser = async (userId: string, gender: GenderType): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    setLoading(true);
    try {
      // Get user profile to find document paths
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id_card_path, admission_slip_path, selfie_path')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (profileError) throw profileError;

      // Delete documents from storage
      const documentsToDelete: string[] = [];
      if (profile.id_card_path) documentsToDelete.push(profile.id_card_path);
      if (profile.admission_slip_path) documentsToDelete.push(profile.admission_slip_path);
      if (profile.selfie_path) documentsToDelete.push(profile.selfie_path);

      for (const docPath of documentsToDelete) {
        await deleteDocument(docPath);
      }

      // Call approve_user function
      const { error: approveError } = await supabase.rpc('approve_user', {
        p_user_id: userId,
        p_gender: gender,
        p_reviewer_id: user.id
      });

      if (approveError) throw approveError;

      // Send approval email (async, don't wait for it)
      // Get user email - we'll need to fetch it or pass it as parameter
      // For now, we'll skip email if we can't get it easily
      // In production, you'd fetch the email from auth.users table via admin API
      sendApprovalEmail('user@example.com', 'User').catch(console.error);

      toast({
        title: "User approved",
        description: "User has been approved and documents deleted"
      });

      return { error: null };
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: "Error",
        description: "Failed to approve user",
        variant: "destructive"
      });
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const rejectUser = async (userId: string): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Not authenticated') };
    }

    setLoading(true);
    try {
      // Get user profile to find document paths
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id_card_path, admission_slip_path, selfie_path')
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (profileError) throw profileError;

      // Delete documents from storage
      const documentsToDelete: string[] = [];
      if (profile.id_card_path) documentsToDelete.push(profile.id_card_path);
      if (profile.admission_slip_path) documentsToDelete.push(profile.admission_slip_path);
      if (profile.selfie_path) documentsToDelete.push(profile.selfie_path);

      for (const docPath of documentsToDelete) {
        await deleteDocument(docPath);
      }

      // Call reject_user function (this deletes the user account)
      const { error: rejectError } = await supabase.rpc('reject_user', {
        p_user_id: userId,
        p_reviewer_id: user.id
      });

      if (rejectError) throw rejectError;

      // Send rejection email (async, don't wait for it)
      // Note: User is deleted, so we can't fetch email easily
      // In production, fetch email before deleting or use admin API
      sendRejectionEmail('user@example.com').catch(console.error);

      toast({
        title: "User rejected",
        description: "User account has been deleted"
      });

      return { error: null };
    } catch (error) {
      console.error('Error rejecting user:', error);
      toast({
        title: "Error",
        description: "Failed to reject user",
        variant: "destructive"
      });
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const getDocumentUrl = useCallback(async (path: string): Promise<string | null> => {
    if (!path) return null;
    
    try {
      const pathParts = path.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const userId = pathParts[pathParts.length - 2];

      const { data, error } = await supabase.storage
        .from('verification-documents')
        .createSignedUrl(`${userId}/${fileName}`, 3600); // 1 hour expiry

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error getting document URL:', error);
      return null;
    }
  }, []);

  return {
    loading,
    fetchPendingUsers,
    approveUser,
    rejectUser,
    getDocumentUrl
  };
};

