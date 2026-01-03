import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, TrendingUp, Clock, Flame, Loader2 } from 'lucide-react';
import PostCard from './PostCard';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';

const PostsFeed = () => {
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const { posts, loading, createPost, toggleLike, deletePost } = usePosts();
  const { user } = useAuth();

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    
    setIsPosting(true);
    const { error } = await createPost(newPostContent);
    if (!error) {
      setNewPostContent('');
    }
    setIsPosting(false);
  };

  return (
    <section id="feed" className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="inline-block bg-secondary px-3 py-1 sketch-border-sm text-handwritten-sm tilt-2 mb-2">
              📝 Fresh takes
            </span>
            <h2 className="text-handwritten-3xl md:text-handwritten-4xl font-bold marker-underline-blue">
              The Feed
            </h2>
          </div>
          
          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button className="btn-sketch-primary py-2 px-4 text-lg flex items-center gap-1">
              <Flame size={18} strokeWidth={2.5} />
              Hot
            </button>
            <button className="btn-sketch py-2 px-4 text-lg flex items-center gap-1">
              <TrendingUp size={18} strokeWidth={2.5} />
              Trending
            </button>
            <button className="btn-sketch py-2 px-4 text-lg flex items-center gap-1">
              <Clock size={18} strokeWidth={2.5} />
              New
            </button>
          </div>
        </div>

        {/* Create Post CTA */}
        {user ? (
          <div className="sketch-border bg-card p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-12 h-12 sketch-border bg-accent/20 flex items-center justify-center shrink-0">
              <PenTool size={24} strokeWidth={2.5} />
            </div>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind? Spill the tea... ☕"
              className="flex-1 w-full bg-transparent text-lg font-comic placeholder:text-muted-foreground focus:outline-none resize-none min-h-[60px]"
              rows={2}
            />
            <button 
              onClick={handleCreatePost}
              disabled={isPosting || !newPostContent.trim()}
              className="btn-sketch-primary py-2 px-6 text-xl shrink-0 disabled:opacity-50 flex items-center gap-2"
            >
              {isPosting ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Posting...
                </>
              ) : (
                'Post it!'
              )}
            </button>
          </div>
        ) : (
          <div className="sketch-border bg-card p-6 mb-8 text-center">
            <p className="font-comic text-lg text-muted-foreground mb-3">
              Want to share your thoughts? 🤔
            </p>
            <Link to="/auth" className="btn-sketch-primary py-2 px-6 text-lg inline-block">
              ✏️ Login to Post
            </Link>
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={48} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="font-comic text-lg text-muted-foreground">Loading the chaos...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 sketch-border bg-card">
            <p className="font-hand text-3xl mb-4">🦗 *cricket sounds*</p>
            <p className="font-comic text-lg text-muted-foreground mb-4">
              No posts yet. Be the first to break the silence!
            </p>
            {!user && (
              <Link to="/auth" className="btn-sketch-primary py-2 px-6 text-lg inline-block">
                ✏️ Login to Post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                tilt={index}
                onLike={toggleLike}
                onDelete={deletePost}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {posts.length > 0 && (
          <div className="text-center mt-8">
            <button className="btn-sketch text-xl">
              Load more chaos ↓
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PostsFeed;
