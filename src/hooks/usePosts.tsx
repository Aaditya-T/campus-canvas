import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { SortType } from '@/components/FeedFilters';

export interface Profile {
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  images: string[];
  created_at: string;
  updated_at: string;
  profile: Profile | null;
  likes_count: number;
  comments_count: number;
  user_has_liked: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: Profile | null;
}

interface FetchPostsOptions {
  sortBy?: SortType;
  filterTags?: string[];
  filterUsername?: string;
}

export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchPosts = useCallback(async (options: FetchPostsOptions = {}) => {
    const { sortBy = 'new', filterTags = [], filterUsername = '' } = options;
    setLoading(true);
    
    // Build query
    let query = supabase.from('posts').select('*');

    // Filter by tags if any
    if (filterTags.length > 0) {
      query = query.overlaps('tags', filterTags);
    }

    // Order based on sort type
    if (sortBy === 'new') {
      query = query.order('created_at', { ascending: false });
    } else {
      // For hot/trending we'll sort after fetching based on engagement
      query = query.order('created_at', { ascending: false });
    }

    const { data: postsData, error: postsError } = await query;

    if (postsError) {
      console.error('Error fetching posts:', postsError);
      setLoading(false);
      return;
    }

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    
    // Fetch profiles for these users
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap: Record<string, Profile & { username: string | null }> = {};
    profilesData?.forEach(p => {
      profilesMap[p.user_id] = {
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url
      };
    });

    // Filter by username if specified
    let filteredPostsData = postsData;
    if (filterUsername) {
      const matchingUserIds = Object.entries(profilesMap)
        .filter(([_, profile]) => profile.username?.toLowerCase().includes(filterUsername.toLowerCase()))
        .map(([userId]) => userId);
      filteredPostsData = postsData.filter(p => matchingUserIds.includes(p.user_id));
    }

    if (filteredPostsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const postIds = filteredPostsData.map(p => p.id);

    // Fetch likes counts
    const { data: likesData } = await supabase
      .from('post_likes')
      .select('post_id')
      .in('post_id', postIds);

    // Fetch comments counts
    const { data: commentsData } = await supabase
      .from('post_comments')
      .select('post_id')
      .in('post_id', postIds);

    // Fetch user's likes if logged in
    let userLikes: string[] = [];
    if (user) {
      const { data: userLikesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', postIds);
      userLikes = userLikesData?.map(l => l.post_id) || [];
    }

    // Count likes and comments per post
    const likesCount: Record<string, number> = {};
    const commentsCount: Record<string, number> = {};
    
    likesData?.forEach(like => {
      likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
    });
    
    commentsData?.forEach(comment => {
      commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
    });

    // Combine data
    let enrichedPosts: Post[] = filteredPostsData.map(post => ({
      id: post.id,
      user_id: post.user_id,
      content: post.content,
      tags: post.tags || [],
      images: post.images || [],
      created_at: post.created_at,
      updated_at: post.updated_at,
      profile: profilesMap[post.user_id] || null,
      likes_count: likesCount[post.id] || 0,
      comments_count: commentsCount[post.id] || 0,
      user_has_liked: userLikes.includes(post.id)
    }));

    // Sort by engagement for hot/trending
    if (sortBy === 'hot') {
      enrichedPosts.sort((a, b) => {
        const scoreA = a.likes_count * 2 + a.comments_count * 3;
        const scoreB = b.likes_count * 2 + b.comments_count * 3;
        return scoreB - scoreA;
      });
    } else if (sortBy === 'trending') {
      // Trending: engagement within last 24h weighted higher
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      enrichedPosts.sort((a, b) => {
        const ageA = (now - new Date(a.created_at).getTime()) / dayMs;
        const ageB = (now - new Date(b.created_at).getTime()) / dayMs;
        const scoreA = (a.likes_count + a.comments_count * 2) / Math.max(ageA, 0.1);
        const scoreB = (b.likes_count + b.comments_count * 2) / Math.max(ageB, 0.1);
        return scoreB - scoreA;
      });
    }

    setPosts(enrichedPosts);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (content: string, tags: string[] = [], images: string[] = []) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please login to create a post",
        variant: "destructive"
      });
      return { error: new Error('Not authenticated') };
    }

    // Check rate limit (10 posts per minute)
    const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
      p_user_id: user.id,
      p_action_type: 'create_post',
      p_max_requests: 10,
      p_window_seconds: 60
    });

    if (!rateLimitOk) {
      toast({
        title: "Slow down!",
        description: "You're posting too fast. Wait a bit.",
        variant: "destructive"
      });
      return { error: new Error('Rate limited') };
    }

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        content: content.trim(),
        tags,
        images
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
      return { error };
    }

    toast({
      title: "Posted!",
      description: "Your thoughts are now out there 🎉"
    });

    await fetchPosts();
    return { error: null };
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please login to like posts",
        variant: "destructive"
      });
      return;
    }

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.user_has_liked) {
      // Unlike
      await supabase
        .from('post_likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', user.id);
    } else {
      // Check rate limit (30 likes per minute)
      const { data: rateLimitOk } = await supabase.rpc('check_rate_limit', {
        p_user_id: user.id,
        p_action_type: 'like_post',
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
        .from('post_likes')
        .insert({
          post_id: postId,
          user_id: user.id
        });
    }

    // Optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          user_has_liked: !p.user_has_liked,
          likes_count: p.user_has_liked ? p.likes_count - 1 : p.likes_count + 1
        };
      }
      return p;
    }));
  };

  const deletePost = async (postId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
      toast({
        title: "Deleted",
        description: "Post removed"
      });
    }
  };

  return {
    posts,
    loading,
    createPost,
    toggleLike,
    deletePost,
    refreshPosts: fetchPosts
  };
};

export const useComments = (postId: string) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchComments = useCallback(async () => {
    setLoading(true);
    
    const { data: commentsData, error } = await supabase
      .from('post_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error || !commentsData) {
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    
    // Fetch profiles
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, username, display_name, avatar_url')
      .in('user_id', userIds);

    const profilesMap: Record<string, Profile> = {};
    profilesData?.forEach(p => {
      profilesMap[p.user_id] = {
        username: p.username,
        display_name: p.display_name,
        avatar_url: p.avatar_url
      };
    });

    const enrichedComments: Comment[] = commentsData.map(comment => ({
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      created_at: comment.created_at,
      profile: profilesMap[comment.user_id] || null
    }));

    setComments(enrichedComments);
    setLoading(false);
  }, [postId]);

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
      p_action_type: 'create_comment',
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
      .from('post_comments')
      .insert({
        post_id: postId,
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
      .from('post_comments')
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
