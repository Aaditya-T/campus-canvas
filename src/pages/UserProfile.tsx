import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Loader2, MessageCircle, Heart } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import PostCard from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Post, Profile } from '@/hooks/usePosts';

interface UserProfileData extends Profile {
  bio: string | null;
  created_at: string;
  user_id: string;
}

const POSTS_PER_PAGE = 6;

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState({ posts: 0, likes: 0 });

  const fetchPosts = async (profileData: UserProfileData, pageNum: number, append: boolean = false) => {
    const from = pageNum * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', profileData.user_id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (postsError || !postsData) {
      return;
    }

    // Check if there are more posts
    setHasMore(postsData.length === POSTS_PER_PAGE);

    if (postsData.length > 0) {
      const postIds = postsData.map(p => p.id);
      
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id')
        .in('post_id', postIds);

      const { data: commentsData } = await supabase
        .from('post_comments')
        .select('post_id')
        .in('post_id', postIds);

      let userLikes: string[] = [];
      if (user) {
        const { data: userLikesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postIds);
        userLikes = userLikesData?.map(l => l.post_id) || [];
      }

      const likesCount: Record<string, number> = {};
      const commentsCount: Record<string, number> = {};
      
      likesData?.forEach(like => {
        likesCount[like.post_id] = (likesCount[like.post_id] || 0) + 1;
      });
      
      commentsData?.forEach(comment => {
        commentsCount[comment.post_id] = (commentsCount[comment.post_id] || 0) + 1;
      });

      const enrichedPosts: Post[] = postsData.map(post => ({
        id: post.id,
        user_id: post.user_id,
        content: post.content,
        tags: post.tags || [],
        images: post.images || [],
        created_at: post.created_at,
        updated_at: post.updated_at,
        profile: {
          username: profileData.username,
          display_name: profileData.display_name,
          avatar_url: profileData.avatar_url
        },
        likes_count: likesCount[post.id] || 0,
        comments_count: commentsCount[post.id] || 0,
        user_has_liked: userLikes.includes(post.id)
      }));

      if (append) {
        setPosts(prev => [...prev, ...enrichedPosts]);
      } else {
        setPosts(enrichedPosts);
      }
    } else if (!append) {
      setPosts([]);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!username) return;

      setLoading(true);
      setPage(0);

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (profileError || !profileData) {
        setLoading(false);
        return;
      }

      const profileInfo: UserProfileData = {
        username: profileData.username,
        display_name: profileData.display_name,
        avatar_url: profileData.avatar_url,
        bio: profileData.bio,
        created_at: profileData.created_at,
        user_id: profileData.user_id
      };

      setProfile(profileInfo);

      // Get total stats
      const { count: totalPosts } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileData.user_id);

      const { data: allPostIds } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', profileData.user_id);

      let totalLikes = 0;
      if (allPostIds && allPostIds.length > 0) {
        const { count } = await supabase
          .from('post_likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', allPostIds.map(p => p.id));
        totalLikes = count || 0;
      }

      setStats({ posts: totalPosts || 0, likes: totalLikes });

      await fetchPosts(profileInfo, 0);
      setLoading(false);
    };

    fetchProfile();
  }, [username, user]);

  const loadMore = async () => {
    if (!profile || loadingMore) return;
    
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchPosts(profile, nextPage, true);
    setPage(nextPage);
    setLoadingMore(false);
  };

  const handleLike = async (postId: string) => {
    if (!user) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.user_has_liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }

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

  const handleDelete = async (postId: string) => {
    if (!user) return;

    await supabase.from('posts').delete().eq('id', postId).eq('user_id', user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h1 className="font-hand text-4xl mb-4">User not found 🤷</h1>
            <p className="font-comic text-muted-foreground mb-6">
              This user doesn't exist or has been deleted.
            </p>
            <button onClick={() => navigate(-1)} className="btn-sketch">
              Go back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.user_id;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <button 
            onClick={() => navigate(-1)}
            className="btn-sketch py-2 px-4 mb-6 text-base flex items-center gap-2"
          >
            <ArrowLeft size={18} strokeWidth={2.5} />
            Back
          </button>

          {/* Profile Header */}
          <div className="sketch-border bg-card p-4 md:p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 md:gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 md:w-32 md:h-32 sketch-border bg-secondary flex items-center justify-center text-handwritten-3xl font-bold overflow-hidden shrink-0">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.display_name || profile.username || 'User'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  profile.username?.charAt(0).toUpperCase() || '?'
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="font-hand text-3xl md:text-4xl mb-1">
                  {profile.display_name || profile.username || 'Anonymous'}
                </h1>
                <p className="font-comic text-muted-foreground mb-3">
                  @{profile.username || 'anonymous'}
                </p>

                {profile.bio && (
                  <p className="font-comic text-foreground/80 mb-4 max-w-md">
                    {profile.bio}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-4 justify-center sm:justify-start mb-4">
                  <div className="sketch-border-sm bg-secondary/30 px-3 py-2 text-center">
                    <div className="font-hand text-xl">{stats.posts}</div>
                    <div className="font-comic text-xs text-muted-foreground">Posts</div>
                  </div>
                  <div className="sketch-border-sm bg-accent/20 px-3 py-2 text-center">
                    <div className="font-hand text-xl flex items-center justify-center gap-1">
                      <Heart size={16} /> {stats.likes}
                    </div>
                    <div className="font-comic text-xs text-muted-foreground">Likes received</div>
                  </div>
                  <div className="sketch-border-sm bg-muted px-3 py-2 text-center">
                    <div className="font-comic text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} />
                      Joined {format(new Date(profile.created_at), 'MMM yyyy')}
                    </div>
                  </div>
                </div>

                {isOwnProfile && (
                  <Link to="/profile" className="btn-sketch text-sm inline-block">
                    ✏️ Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div>
            <h2 className="font-hand text-2xl mb-4 flex items-center gap-2">
              <MessageCircle size={24} strokeWidth={2.5} />
              Posts by @{profile.username}
            </h2>

            {posts.length === 0 ? (
              <div className="sketch-border bg-card p-8 text-center">
                <p className="font-hand text-2xl mb-2">🦗 No posts yet</p>
                <p className="font-comic text-muted-foreground">
                  This user hasn't posted anything yet.
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-6 items-start">
                  {posts.map((post, index) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      tilt={index}
                      onLike={handleLike}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
                
                {hasMore && (
                  <div className="text-center mt-6">
                    <button 
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="btn-sketch py-2 px-6 flex items-center gap-2 mx-auto"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Loading...
                        </>
                      ) : (
                        'Load more posts ↓'
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserProfile;
