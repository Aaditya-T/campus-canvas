import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Confession {
  id: string;
  title: string;
  description: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export interface Profile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ConfessionComment {
  id: string;
  confession_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  profile: Profile | null;
  user_owns: boolean; // For delete button visibility
}

interface FetchConfessionsOptions {
  searchQuery?: string;
  sortBy?: 'new' | 'hot' | 'trending';
}

const CONFESSIONS_PER_PAGE = 20;

export const useConfessions = () => {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchConfessions = useCallback(async (options: FetchConfessionsOptions = {}, append = false, pageOverride?: number) => {
    const { searchQuery = '', sortBy = 'new' } = options;
    const page = pageOverride !== undefined ? pageOverride : (append ? currentPage + 1 : 0);
    const offset = page * CONFESSIONS_PER_PAGE;
    
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setCurrentPage(0);
    }
    
    let query = supabase.from('confessions').select('*', { count: 'exact' });

    // Search functionality
    if (searchQuery.trim()) {
      // Use full-text search function
      const { data: searchResults, error: searchError } = await supabase.rpc('search_confessions', {
        search_query: searchQuery.trim()
      });

      if (searchError) {
        console.error('Error searching confessions:', searchError);
        // Fallback to regular query if search fails
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      } else if (searchResults && searchResults.length > 0) {
        const confessionIds = searchResults.map(r => r.id);
        query = query.in('id', confessionIds);
      } else {
        // No results from search
        setConfessions([]);
        setLoading(false);
        return;
      }
    }

    // Order based on sort type
    if (sortBy === 'new') {
      query = query.order('created_at', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + CONFESSIONS_PER_PAGE - 1);

    const { data: confessionsData, error: confessionsError, count } = await query;

    if (confessionsError) {
      console.error('Error fetching confessions:', confessionsError);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    if (!confessionsData || confessionsData.length === 0) {
      if (append) {
        setHasMore(false);
        setLoadingMore(false);
      } else {
        setConfessions([]);
        setHasMore(false);
        setLoading(false);
      }
      return;
    }

    // Check if there are more confessions
    const totalFetched = offset + confessionsData.length;
    setHasMore(totalFetched < (count || 0));
    if (append) {
      setCurrentPage(page);
    }

    const confessionIds = confessionsData.map(c => c.id);

    // Fetch likes counts
    const { data: likesData } = await supabase
      .from('confession_likes')
      .select('confession_id')
      .in('confession_id', confessionIds);

    // Fetch comments counts
    const { data: commentsData } = await supabase
      .from('confession_comments')
      .select('confession_id')
      .in('confession_id', confessionIds);

    // Fetch user's likes if logged in
    let userLikes: string[] = [];
    if (user) {
      const { data: userLikesData } = await supabase
        .from('confession_likes')
        .select('confession_id')
        .eq('user_id', user.id)
        .in('confession_id', confessionIds);
      userLikes = userLikesData?.map(l => l.confession_id) || [];
    }

    // Count likes and comments per confession
    const likesCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};
    
    likesData?.forEach(like => {
      likesCount[like.confession_id] = (likesCount[like.confession_id] || 0) + 1;
    });
    
    commentsData?.forEach(comment => {
      commentsCount[comment.confession_id] = (commentsCount[comment.confession_id] || 0) + 1;
    });

    // Combine data
    let enrichedConfessions: Confession[] = confessionsData.map(confession => ({
      id: confession.id,
      title: confession.title,
      description: confession.description,
      author_name: confession.author_name,
      created_at: confession.created_at,
      updated_at: confession.updated_at,
      likes_count: likesCount[confession.id] || 0,
      comments_count: commentsCount[confession.id] || 0,
      user_has_liked: userLikes.includes(confession.id)
    }));

    // Sort by engagement for hot/trending
    if (sortBy === 'hot') {
      enrichedConfessions.sort((a, b) => {
        const scoreA = a.likes_count * 2 + a.comments_count * 3;
        const scoreB = b.likes_count * 2 + b.comments_count * 3;
        return scoreB - scoreA;
      });
    } else if (sortBy === 'trending') {
      // Trending: engagement within last 24h weighted higher
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      enrichedConfessions.sort((a, b) => {
        const ageA = (now - new Date(a.created_at).getTime()) / dayMs;
        const ageB = (now - new Date(b.created_at).getTime()) / dayMs;
        const scoreA = (a.likes_count + a.comments_count * 2) / Math.max(ageA, 0.1);
        const scoreB = (b.likes_count + b.comments_count * 2) / Math.max(ageB, 0.1);
        return scoreB - scoreA;
      });
    }

    if (append) {
      setConfessions(prev => [...prev, ...enrichedConfessions]);
      setLoadingMore(false);
    } else {
      setConfessions(enrichedConfessions);
      setLoading(false);
      setCurrentPage(0);
    }
  }, [user, currentPage]);

  const [filterOptions, setFilterOptions] = useState<FetchConfessionsOptions>({ searchQuery: '', sortBy: 'new' });

  useEffect(() => {
    const options = { searchQuery: '', sortBy: 'new' };
    setFilterOptions(options);
    fetchConfessions(options, false, 0);
  }, []); // Initial load

  const loadMoreConfessions = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchConfessions(filterOptions, true);
    }
  }, [fetchConfessions, loadingMore, hasMore, filterOptions]);

  const createConfession = async (title: string, description: string, authorName: string = 'anonymous') => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please login to create a confession",
        variant: "destructive"
      });
      return { error: new Error('Not authenticated') };
    }

    // Check if user is approved
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('user_id', user.id)
      .single();

    if (profile?.status !== 'approved') {
      toast({
        title: "Account pending",
        description: "Please wait for your account to be approved before posting",
        variant: "destructive"
      });
      return { error: new Error('Account not approved') };
    }

    // Check rate limit (5 confessions per hour)
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action_type: 'create_confession',
      p_max_requests: 5,
      p_window_seconds: 3600
    });

    if (!rateLimitOk) {
      toast({
        title: "Slow down!",
        description: "You're creating confessions too fast. Wait a bit.",
        variant: "destructive"
      });
      return { error: new Error('Rate limited') };
    }

    const { error } = await supabase
      .from('confessions')
      .insert({
        title: title.trim(),
        description: description.trim(),
        author_name: authorName.trim() || 'anonymous'
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create confession",
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Confession posted!",
      description: "Your secret is safe with us 🤫"
    });

    await fetchConfessions();
    return { error: null };
  };

  const toggleLike = async (confessionId: string) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please login to like confessions",
        variant: "destructive"
      });
      return;
    }

    const confession = confessions.find(c => c.id === confessionId);
    if (!confession) return;

    if (confession.user_has_liked) {
      // Unlike
      await supabase
        .from('confession_likes')
        .delete()
        .eq('confession_id', confessionId)
        .eq('user_id', user.id);
    } else {
      // Check rate limit (30 likes per minute)
      const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_action_type: 'like_confession',
        p_max_requests: 30,
        p_window_seconds: 60
      });

      if (!rateLimitOk) {
        toast({
          title: "Slow down!",
          description: "You're liking too fast.",
          variant: "destructive"
        });
        return;
      }

      await supabase
        .from('confession_likes')
        .insert({
          confession_id: confessionId,
          user_id: user.id
        });
    }

    // Optimistic update
    setConfessions(prev => prev.map(c => {
      if (c.id === confessionId) {
        return {
          ...c,
          user_has_liked: !c.user_has_liked,
          likes_count: c.user_has_liked ? c.likes_count - 1 : c.likes_count + 1
        };
      }
      return c;
    }));
  };

  const refreshConfessions = useCallback((options: FetchConfessionsOptions) => {
    setFilterOptions(options);
    fetchConfessions(options, false, 0);
  }, [fetchConfessions]);

  return {
    confessions,
    loading,
    loadingMore,
    hasMore,
    createConfession,
    toggleLike,
    loadMoreConfessions,
    refreshConfessions
  };
};

export const useConfessionComments = (confessionId: string) => {
  const [comments, setComments] = useState<ConfessionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    
    const { data: commentsData, error } = await supabase
      .from('confession_comments')
      .select('id, confession_id, content, user_id, created_at, updated_at')
      .eq('confession_id', confessionId)
      .order('created_at', { ascending: true });

    if (error || !commentsData) {
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    
    // Fetch profiles for these users (only approved users)
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds)
      .eq('status', 'approved');

    const profilesMap: Record<string, Profile> = {};
    profilesData?.forEach(p => {
      profilesMap[p.user_id] = {
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url
      };
    });

    // Check ownership for each comment (only if user is logged in)
    const ownershipMap: Record<string, boolean> = {};
    if (user) {
      commentsData.forEach(comment => {
        ownershipMap[comment.id] = comment.user_id === user.id;
      });
    }

    const enrichedComments: ConfessionComment[] = commentsData.map(comment => ({
      id: comment.id,
      confession_id: comment.confession_id,
      content: comment.content,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      profile: profilesMap[comment.user_id] || null,
      user_owns: ownershipMap[comment.id] || false
    }));

    setComments(enrichedComments);
    setLoading(false);
  }, [confessionId, user]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = async (content: string) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please login to comment",
        variant: "destructive"
      });
      return { error: new Error('Not authenticated') };
    }

    // Check rate limit (20 comments per minute)
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action_type: 'create_confession_comment',
      p_max_requests: 20,
      p_window_seconds: 60
    });

    if (!rateLimitOk) {
      toast({
        title: "Slow down!",
        description: "You're commenting too fast.",
        variant: "destructive"
      });
      return { error: new Error('Rate limited') };
    }

    const { error } = await supabase
      .from('confession_comments')
      .insert({
        confession_id: confessionId,
        user_id: user.id,
        content: content.trim()
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
      return { error };
    }

    await fetchComments();
    return { error: null };
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;

    await supabase
      .from('confession_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id);

    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return {
    comments,
    loading,
    addComment,
    deleteComment,
    refreshComments: fetchComments
  };
};

