import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommentsModal from '@/components/CommentsModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Post } from '@/hooks/usePosts';

const PostPage = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!postId) return;

      setLoading(true);

      // Fetch post
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (postError || !postData) {
        setLoading(false);
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username, display_name, avatar_url')
        .eq('user_id', postData.user_id)
        .maybeSingle();

      // Fetch likes count
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      // Fetch comments count
      const { count: commentsCount } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      // Check if user liked
      let userHasLiked = false;
      if (user) {
        const { data: userLike } = await supabase
          .from('post_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();
        userHasLiked = !!userLike;
      }

      setPost({
        id: postData.id,
        user_id: postData.user_id,
        content: postData.content,
        tags: postData.tags || [],
        images: postData.images || [],
        created_at: postData.created_at,
        updated_at: postData.updated_at,
        profile: profileData || null,
        likes_count: likesCount || 0,
        comments_count: commentsCount || 0,
        user_has_liked: userHasLiked
      });

      setLoading(false);
    };

    fetchPost();
  }, [postId, user]);

  const handleLike = async (postId: string) => {
    if (!user || !post) return;

    if (post.user_has_liked) {
      await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
    }

    setPost(prev => prev ? {
      ...prev,
      user_has_liked: !prev.user_has_liked,
      likes_count: prev.user_has_liked ? prev.likes_count - 1 : prev.likes_count + 1
    } : null);
  };

  const handleClose = () => {
    setShowModal(false);
    navigate('/feed');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-24 pb-16 px-4">
          <div className="container mx-auto max-w-2xl text-center">
            <h1 className="font-hand text-4xl mb-4">Post not found 🤷</h1>
            <p className="font-comic text-muted-foreground mb-6">
              This post doesn't exist or has been deleted.
            </p>
            <button onClick={() => navigate('/feed')} className="btn-sketch">
              <ArrowLeft size={18} className="inline mr-2" />
              Back to Feed
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-2xl text-center">
          <p className="font-comic text-muted-foreground mb-4">Opening post...</p>
        </div>
      </main>
      <Footer />
      
      <CommentsModal
        post={post}
        isOpen={showModal}
        onClose={handleClose}
        onLike={handleLike}
      />
    </div>
  );
};

export default PostPage;
