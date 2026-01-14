import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenTool, Loader2 } from 'lucide-react';
import PostCard from './PostCard';
import FeedFilters, { SortType } from './FeedFilters';
import ImageUpload from './ImageUpload';
import TagSelector from './TagSelector';
import { usePosts } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { POST_MAX_LENGTH, getCharacterCountColor, isOverLimit } from '@/lib/constants';

const PostsFeed = () => {
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [newPostTags, setNewPostTags] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  
  // Filter state
  const [sortBy, setSortBy] = useState<SortType>('hot');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterUsername, setFilterUsername] = useState('');
  
  const { posts, loading, createPost, toggleLike, deletePost, refreshPosts } = usePosts();
  const { user } = useAuth();

  // Refetch when filters change
  useEffect(() => {
    refreshPosts({ sortBy, filterTags, filterUsername });
  }, [sortBy, filterTags, filterUsername, refreshPosts]);

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || isOverLimit(newPostContent.length, POST_MAX_LENGTH)) return;
    
    setIsPosting(true);
    const { error } = await createPost(newPostContent, newPostTags, newPostImages);
    if (!error) {
      setNewPostContent('');
      setNewPostImages([]);
      setNewPostTags([]);
      setShowPostForm(false);
    }
    setIsPosting(false);
  };

  const handlePostContentChange = (value: string) => {
    if (value.length <= POST_MAX_LENGTH + 50) {
      setNewPostContent(value);
    }
  };

  const handleTagClickInPost = (tag: string) => {
    if (!filterTags.includes(tag)) {
      setFilterTags([...filterTags, tag]);
    }
  };

  const handleUserClickInPost = (username: string) => {
    setFilterUsername(username);
  };

  return (
    <section id="feed" className="py-8 md:py-16">
      <div className="container mx-auto px-3 md:px-4">
        {/* Section Header */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div>
            <span className="inline-block bg-secondary px-2 md:px-3 py-1 sketch-border-sm text-handwritten-sm tilt-2 mb-2">
              📝 Fresh takes
            </span>
            <h2 className="text-handwritten-2xl md:text-handwritten-4xl font-bold marker-underline-blue">
              The Feed
            </h2>
          </div>
          
          {/* Filters */}
          <FeedFilters
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedTags={filterTags}
            onTagsChange={setFilterTags}
            filterUsername={filterUsername}
            onUsernameChange={setFilterUsername}
          />
        </div>

        {/* Create Post CTA */}
        {user ? (
          <div className="sketch-border bg-card p-3 md:p-4 mb-6 md:mb-8">
            {!showPostForm ? (
              <button
                onClick={() => setShowPostForm(true)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 sketch-border bg-accent/20 flex items-center justify-center shrink-0">
                  <PenTool size={20} strokeWidth={2.5} />
                </div>
                <span className="flex-1 font-comic text-sm md:text-lg text-muted-foreground">
                  What's on your mind? Spill the tea... ☕
                </span>
              </button>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 md:w-12 md:h-12 sketch-border bg-accent/20 flex items-center justify-center shrink-0">
                    <PenTool size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newPostContent}
                      onChange={(e) => handlePostContentChange(e.target.value)}
                      placeholder="What's on your mind? Spill the tea... ☕"
                      className={`w-full bg-transparent text-sm md:text-lg font-comic placeholder:text-muted-foreground focus:outline-none resize-none min-h-[80px] ${
                        isOverLimit(newPostContent.length, POST_MAX_LENGTH) ? 'text-destructive' : ''
                      }`}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs font-comic ${getCharacterCountColor(newPostContent.length, POST_MAX_LENGTH)}`}>
                        {POST_MAX_LENGTH - newPostContent.length} characters left
                      </span>
                    </div>
                  </div>
                </div>

                {/* Image Upload */}
                <ImageUpload
                  images={newPostImages}
                  onImagesChange={setNewPostImages}
                />

                {/* Tag Selector */}
                <div>
                  <p className="font-comic text-xs text-muted-foreground mb-2">Add tags (optional):</p>
                  <TagSelector
                    selectedTags={newPostTags}
                    onTagsChange={setNewPostTags}
                    compact
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowPostForm(false);
                      setNewPostContent('');
                      setNewPostImages([]);
                      setNewPostTags([]);
                    }}
                    className="btn-sketch py-2 px-4 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreatePost}
                    disabled={isPosting || !newPostContent.trim() || isOverLimit(newPostContent.length, POST_MAX_LENGTH)}
                    className="btn-sketch-primary py-2 px-4 md:px-6 text-sm md:text-xl shrink-0 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      'Post it!'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sketch-border bg-card p-4 md:p-6 mb-6 md:mb-8 text-center">
            <p className="font-comic text-sm md:text-lg text-muted-foreground mb-3">
              Want to share your thoughts? 🤔
            </p>
            <Link to="/auth" className="btn-sketch-primary py-2 px-4 md:px-6 text-sm md:text-lg inline-block">
              ✏️ Login to Post
            </Link>
          </div>
        )}

        {/* Posts Grid */}
        {loading ? (
          <div className="text-center py-12 md:py-16">
            <Loader2 size={40} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="font-comic text-base md:text-lg text-muted-foreground">Loading the chaos...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 md:py-16 sketch-border bg-card">
            <p className="font-hand text-2xl md:text-3xl mb-4">🦗 *cricket sounds*</p>
            <p className="font-comic text-base md:text-lg text-muted-foreground mb-4">
              {filterTags.length > 0 || filterUsername
                ? "No posts match your filters. Try different ones!"
                : "No posts yet. Be the first to break the silence!"}
            </p>
            {!user && (
              <Link to="/auth" className="btn-sketch-primary py-2 px-6 text-base md:text-lg inline-block">
                ✏️ Login to Post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 md:gap-6 items-start">
            {posts.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                tilt={index}
                onLike={toggleLike}
                onDelete={deletePost}
                onTagClick={handleTagClickInPost}
                onUserClick={handleUserClickInPost}
              />
            ))}
          </div>
        )}

        {/* Load More */}
        {posts.length > 0 && (
          <div className="text-center mt-6 md:mt-8">
            <button className="btn-sketch text-base md:text-xl">
              Load more chaos ↓
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PostsFeed;
