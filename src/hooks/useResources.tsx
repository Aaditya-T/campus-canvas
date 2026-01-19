import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { validateFile } from '@/lib/fileValidation';

export type ResourceType = 'PYQ' | 'Notes' | 'Book' | 'Slides';
export type Branch = 
  | 'Computer Science'
  | 'Electronics'
  | 'Mechanical'
  | 'Civil'
  | 'Electrical'
  | 'Chemical'
  | 'Biotechnology'
  | 'Information Technology';

export interface Resource {
  id: string;
  user_id: string;
  title: string;
  branch: string;
  semester: string;
  type: ResourceType;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  downloads: number;
  created_at: string;
  updated_at: string;
  user_profile?: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
  likes_count?: number;
}

export interface FetchResourcesOptions {
  branch?: string;
  semester?: string;
  type?: ResourceType;
  searchQuery?: string;
  limit?: number;
  offset?: number;
}

export const useResources = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch resources with filters
  const fetchResources = useCallback(
    async (options: FetchResourcesOptions = {}): Promise<Resource[]> => {
      setLoading(true);
      try {
        let query = supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (options.branch) {
          query = query.eq('branch', options.branch);
        }
        if (options.semester) {
          query = query.eq('semester', options.semester);
        }
        if (options.type) {
          query = query.eq('type', options.type);
        }
        if (options.searchQuery) {
          query = query.ilike('title', `%${options.searchQuery}%`);
        }

        // Apply pagination
        if (options.limit) {
          query = query.limit(options.limit);
        }
        if (options.offset) {
          query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
        }

        const { data: resources, error } = await query;

        if (error) throw error;

        if (!resources || resources.length === 0) return [];

        // Fetch user profiles
        const userIds = [...new Set(resources.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap: Record<string, any> = {};
        profiles?.forEach((p) => {
          profilesMap[p.user_id] = p;
        });

        // Fetch like counts and user's likes
        const resourceIds = resources.map((r) => r.id);
        const { data: likes } = await supabase
          .from('resource_likes')
          .select('resource_id, user_id')
          .in('resource_id', resourceIds);

        const likesMap: Record<string, number> = {};
        const userLikesSet = new Set<string>();

        likes?.forEach((like) => {
          likesMap[like.resource_id] = (likesMap[like.resource_id] || 0) + 1;
          if (like.user_id === user?.id) {
            userLikesSet.add(like.resource_id);
          }
        });

        return resources.map((resource) => ({
          ...resource,
          user_profile: profilesMap[resource.user_id] || null,
          is_liked: userLikesSet.has(resource.id),
          likes_count: likesMap[resource.id] || 0,
        }));
      } catch (error: any) {
        console.error('Error fetching resources:', error);
        toast({
          title: 'Error',
          description: `Failed to fetch resources: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return [];
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Upload resource
  const uploadResource = useCallback(
    async (
      file: File,
      title: string,
      branch: string,
      semester: string,
      type: ResourceType
    ): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      // Validate file
      const validation = await validateFile(file);
      if (!validation.valid) {
        toast({
          title: 'Invalid file',
          description: validation.error || 'File validation failed',
          variant: 'destructive',
        });
        return { error: new Error(validation.error || 'File validation failed') };
      }

      // Check if user is approved
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('user_id', user.id)
        .single();

      if (profile?.status !== 'approved') {
        toast({
          title: 'Account pending',
          description: 'Please wait for your account to be approved before uploading resources',
          variant: 'destructive',
        });
        return { error: new Error('Account not approved') };
      }

      // Check rate limit
      const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_action_type: 'upload_resource',
        p_max_requests: 5,
        p_window_seconds: 60,
      });

      if (!rateLimitOk) {
        toast({
          title: 'Slow down!',
          description: "You're uploading too fast. Wait a bit.",
          variant: 'destructive',
        });
        return { error: new Error('Rate limited') };
      }

      setLoading(true);
      try {
        // Upload file to storage
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`;
        const filePath = `resources/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(filePath, file, {
            contentType: file.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Create database record
        const { error: insertError } = await supabase.from('resources').insert({
          user_id: user.id,
          title: title.trim(),
          branch,
          semester,
          type,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
        });

        if (insertError) {
          // Clean up uploaded file if DB insert fails
          await supabase.storage.from('resources').remove([filePath]);
          throw insertError;
        }

        toast({
          title: 'Resource uploaded!',
          description: 'Your resource has been shared successfully',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error uploading resource:', error);
        toast({
          title: 'Upload failed',
          description: `Failed to upload resource: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Download resource
  const downloadResource = useCallback(
    async (resourceId: string): Promise<{ url: string | null; error: Error | null }> => {
      try {
        // Get resource info
        const { data: resource, error: resourceError } = await supabase
          .from('resources')
          .select('file_path, file_name')
          .eq('id', resourceId)
          .single();

        if (resourceError || !resource) {
          return { url: null, error: new Error('Resource not found') };
        }

        // Generate signed URL (1 hour expiry)
        const { data, error: urlError } = await supabase.storage
          .from('resources')
          .createSignedUrl(resource.file_path, 3600);

        if (urlError || !data) {
          return { url: null, error: new Error('Failed to generate download URL') };
        }

        // Increment download count
        await supabase.rpc('increment_resource_downloads', {
          p_resource_id: resourceId,
        }).catch(console.error); // Don't fail if this fails

        return { url: data.signedUrl, error: null };
      } catch (error: any) {
        console.error('Error downloading resource:', error);
        return { url: null, error: error as Error };
      }
    },
    []
  );

  // Like/unlike resource
  const likeResource = useCallback(
    async (resourceId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      try {
        // Check if already liked
        const { data: existingLike } = await supabase
          .from('resource_likes')
          .select('id')
          .eq('resource_id', resourceId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingLike) {
          // Unlike
          const { error } = await supabase
            .from('resource_likes')
            .delete()
            .eq('resource_id', resourceId)
            .eq('user_id', user.id);

          if (error) throw error;
        } else {
          // Like
          const { error } = await supabase.from('resource_likes').insert({
            resource_id: resourceId,
            user_id: user.id,
          });

          if (error) throw error;
        }

        return { error: null };
      } catch (error: any) {
        console.error('Error toggling like:', error);
        return { error: error as Error };
      }
    },
    [user]
  );

  // Delete resource
  const deleteResource = useCallback(
    async (resourceId: string): Promise<{ error: Error | null }> => {
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      setLoading(true);
      try {
        // Get resource to find file path
        const { data: resource, error: resourceError } = await supabase
          .from('resources')
          .select('file_path, user_id')
          .eq('id', resourceId)
          .single();

        if (resourceError || !resource) {
          throw new Error('Resource not found');
        }

        // Check permissions
        const { data: isAdmin } = await supabase.rpc('is_admin', {
          p_user_id: user.id,
        });

        if (resource.user_id !== user.id && !isAdmin) {
          throw new Error('Not authorized to delete this resource');
        }

        // Delete file from storage
        const { error: deleteFileError } = await supabase.storage
          .from('resources')
          .remove([resource.file_path]);

        if (deleteFileError) {
          console.error('Error deleting file:', deleteFileError);
          // Continue with DB deletion even if file deletion fails
        }

        // Delete database record (cascades to likes)
        const { error: deleteError } = await supabase
          .from('resources')
          .delete()
          .eq('id', resourceId);

        if (deleteError) throw deleteError;

        toast({
          title: 'Resource deleted',
          description: 'The resource has been deleted successfully',
        });

        return { error: null };
      } catch (error: any) {
        console.error('Error deleting resource:', error);
        toast({
          title: 'Error',
          description: `Failed to delete resource: ${error?.message || 'Unknown error'}`,
          variant: 'destructive',
        });
        return { error: error as Error };
      } finally {
        setLoading(false);
      }
    },
    [user, toast]
  );

  // Get preview URL (for PDFs)
  const getResourcePreview = useCallback(
    async (resourceId: string): Promise<{ url: string | null; error: Error | null }> => {
      try {
        const { data: resource, error: resourceError } = await supabase
          .from('resources')
          .select('file_path, mime_type')
          .eq('id', resourceId)
          .single();

        if (resourceError || !resource) {
          return { url: null, error: new Error('Resource not found') };
        }

        // Only allow PDF previews
        if (resource.mime_type !== 'application/pdf') {
          return { url: null, error: new Error('Preview only available for PDF files') };
        }

        // Generate signed URL
        const { data, error: urlError } = await supabase.storage
          .from('resources')
          .createSignedUrl(resource.file_path, 3600);

        if (urlError || !data) {
          return { url: null, error: new Error('Failed to generate preview URL') };
        }

        return { url: data.signedUrl, error: null };
      } catch (error: any) {
        console.error('Error getting preview:', error);
        return { url: null, error: error as Error };
      }
    },
    []
  );

  return {
    loading,
    fetchResources,
    uploadResource,
    downloadResource,
    likeResource,
    deleteResource,
    getResourcePreview,
  };
};

