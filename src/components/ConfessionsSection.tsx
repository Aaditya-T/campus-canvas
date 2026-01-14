import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import ConfessionCard from './ConfessionCard';
import { Eye, EyeOff, Send, Search, Loader2 } from 'lucide-react';
import { useConfessions } from '@/hooks/useConfessions';
import { useAuth } from '@/hooks/useAuth';
import { 
  CONFESSION_TITLE_MAX_LENGTH, 
  CONFESSION_DESCRIPTION_MAX_LENGTH, 
  CONFESSION_DESCRIPTION_MAX_WORDS,
  getCharacterCountColor, 
  isOverLimit,
  isOverWordLimit,
  getWordCount
} from '@/lib/constants';

const ConfessionsSection = () => {
  const [newConfessionTitle, setNewConfessionTitle] = useState('');
  const [newConfessionDescription, setNewConfessionDescription] = useState('');
  const [newConfessionAuthorName, setNewConfessionAuthorName] = useState('anonymous');
  const [isPosting, setIsPosting] = useState(false);
  const [showConfessionForm, setShowConfessionForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'new' | 'hot' | 'trending'>('new');

  const { confessions, loading, loadingMore, hasMore, createConfession, toggleLike, loadMoreConfessions, refreshConfessions } = useConfessions();
  const { user } = useAuth();

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refetch when search or sort changes
  useEffect(() => {
    refreshConfessions({ searchQuery: debouncedSearchQuery, sortBy });
  }, [debouncedSearchQuery, sortBy, refreshConfessions]);

  const handleCreateConfession = async () => {
    if (!newConfessionTitle.trim() || !newConfessionDescription.trim()) return;
    if (isOverLimit(newConfessionTitle.length, CONFESSION_TITLE_MAX_LENGTH)) return;
    if (isOverLimit(newConfessionDescription.length, CONFESSION_DESCRIPTION_MAX_LENGTH)) return;
    if (isOverWordLimit(newConfessionDescription, CONFESSION_DESCRIPTION_MAX_WORDS)) return;
    
    setIsPosting(true);
    const { error } = await createConfession(
      newConfessionTitle.trim(),
      newConfessionDescription.trim(),
      newConfessionAuthorName.trim() || 'anonymous'
    );
    if (!error) {
      setNewConfessionTitle('');
      setNewConfessionDescription('');
      setNewConfessionAuthorName('anonymous');
      setShowConfessionForm(false);
    }
    setIsPosting(false);
  };

  const handleTitleChange = (value: string) => {
    if (value.length <= CONFESSION_TITLE_MAX_LENGTH + 20) {
      setNewConfessionTitle(value);
    }
  };

  const handleDescriptionChange = (value: string) => {
    if (value.length <= CONFESSION_DESCRIPTION_MAX_LENGTH + 50) {
      setNewConfessionDescription(value);
    }
  };

  return (
    <section id="confessions" className="py-8 md:py-16">
      <div className="container mx-auto px-3 md:px-4">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-12">
          <span className="inline-block bg-neon/30 px-2 md:px-3 py-1 sketch-border-sm text-handwritten-sm tilt-3 mb-2">
            🤫 Shhh...
          </span>
          <h2 className="text-handwritten-2xl md:text-handwritten-4xl font-bold marker-underline-red mb-3 md:mb-4">
            Anonymous Confessions
          </h2>
          <p className="font-comic text-sm md:text-base text-muted-foreground max-w-xl mx-auto px-2">
            Spill your secrets into the void. No names, no judgment, just pure unfiltered honesty.
            Like a digital bathroom wall, but classier (barely).
          </p>
        </div>

        {/* Search and Sort */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row gap-3 md:gap-4 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search confessions..."
              className="w-full bg-background sketch-border-sm pl-10 pr-4 py-2 font-comic text-sm focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('new')}
              className={`btn-sketch py-2 px-3 md:px-4 text-xs md:text-sm ${sortBy === 'new' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              New
            </button>
            <button
              onClick={() => setSortBy('hot')}
              className={`btn-sketch py-2 px-3 md:px-4 text-xs md:text-sm ${sortBy === 'hot' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Hot
            </button>
            <button
              onClick={() => setSortBy('trending')}
              className={`btn-sketch py-2 px-3 md:px-4 text-xs md:text-sm ${sortBy === 'trending' ? 'bg-primary text-primary-foreground' : ''}`}
            >
              Trending
            </button>
          </div>
        </div>

        {/* Submit Confession */}
        {user ? (
          <div className="sketch-border bg-card p-4 md:p-6 mb-6 md:mb-12 max-w-2xl mx-auto tilt-1">
            {!showConfessionForm ? (
              <button
                onClick={() => setShowConfessionForm(true)}
                className="w-full flex items-center gap-3 text-left"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 sketch-border bg-accent/20 flex items-center justify-center shrink-0">
                  <EyeOff size={20} strokeWidth={2.5} />
                </div>
                <span className="flex-1 font-comic text-sm md:text-lg text-muted-foreground">
                  Got something to confess? Spill it here... 🤐
                </span>
              </button>
            ) : (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <EyeOff size={20} strokeWidth={2.5} />
                  <span className="text-handwritten-base md:text-handwritten-lg font-bold">Create Confession</span>
                </div>

                {/* Title Input */}
                <div>
                  <input
                    type="text"
                    value={newConfessionTitle}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Title (required)"
                    className={`w-full bg-transparent text-sm md:text-base font-comic placeholder:text-muted-foreground focus:outline-none sketch-border-sm p-2 md:p-3 ${
                      isOverLimit(newConfessionTitle.length, CONFESSION_TITLE_MAX_LENGTH) ? 'border-destructive' : ''
                    }`}
                    autoFocus
                  />
                  <div className="flex justify-end mt-1">
                    <span className={`text-xs font-comic ${getCharacterCountColor(newConfessionTitle.length, CONFESSION_TITLE_MAX_LENGTH)}`}>
                      {CONFESSION_TITLE_MAX_LENGTH - newConfessionTitle.length} characters left
                    </span>
                  </div>
                </div>

                {/* Description Textarea */}
                <div>
                  <textarea
                    value={newConfessionDescription}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    placeholder="Get it off your chest... we won't tell anyone 🤐"
                    className={`w-full bg-transparent text-sm md:text-base font-comic placeholder:text-muted-foreground focus:outline-none resize-none min-h-[120px] sketch-border-sm p-2 md:p-3 ${
                      isOverLimit(newConfessionDescription.length, CONFESSION_DESCRIPTION_MAX_LENGTH) || 
                      isOverWordLimit(newConfessionDescription, CONFESSION_DESCRIPTION_MAX_WORDS) 
                        ? 'border-destructive' : ''
                    }`}
                    rows={5}
                  />
                  <div className="flex justify-between mt-1">
                    <span className={`text-xs font-comic ${
                      isOverWordLimit(newConfessionDescription, CONFESSION_DESCRIPTION_MAX_WORDS) 
                        ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {getWordCount(newConfessionDescription)} / {CONFESSION_DESCRIPTION_MAX_WORDS} words
                    </span>
                    <span className={`text-xs font-comic ${getCharacterCountColor(newConfessionDescription.length, CONFESSION_DESCRIPTION_MAX_LENGTH)}`}>
                      {CONFESSION_DESCRIPTION_MAX_LENGTH - newConfessionDescription.length} characters left
                    </span>
                  </div>
                </div>

                {/* Author Name Input */}
                <div>
                  <input
                    type="text"
                    value={newConfessionAuthorName}
                    onChange={(e) => setNewConfessionAuthorName(e.target.value.trim() || 'anonymous')}
                    placeholder="Your name (optional, defaults to 'anonymous')"
                    className="w-full bg-transparent text-sm md:text-base font-comic placeholder:text-muted-foreground focus:outline-none sketch-border-sm p-2 md:p-3"
                    maxLength={50}
                  />
                  <p className="text-xs text-muted-foreground font-comic flex items-center gap-1 mt-1">
                    <Eye size={12} /> 100% anonymous. Promise.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowConfessionForm(false);
                      setNewConfessionTitle('');
                      setNewConfessionDescription('');
                      setNewConfessionAuthorName('anonymous');
                    }}
                    className="btn-sketch py-2 px-4 text-sm md:text-base"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleCreateConfession}
                    disabled={
                      isPosting || 
                      !newConfessionTitle.trim() || 
                      !newConfessionDescription.trim() ||
                      isOverLimit(newConfessionTitle.length, CONFESSION_TITLE_MAX_LENGTH) ||
                      isOverLimit(newConfessionDescription.length, CONFESSION_DESCRIPTION_MAX_LENGTH) ||
                      isOverWordLimit(newConfessionDescription, CONFESSION_DESCRIPTION_MAX_WORDS)
                    }
                    className="btn-sketch-destructive py-2 px-4 md:px-6 text-sm md:text-xl shrink-0 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isPosting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send size={18} strokeWidth={2.5} />
                        Confess
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="sketch-border bg-card p-4 md:p-6 mb-6 md:mb-12 max-w-2xl mx-auto text-center">
            <p className="font-comic text-sm md:text-lg text-muted-foreground mb-3">
              Want to share your secrets? 🤔
            </p>
            <Link to="/auth" className="btn-sketch-destructive py-2 px-4 md:px-6 text-sm md:text-lg inline-block">
              ✏️ Login to Confess
            </Link>
          </div>
        )}

        {/* Confessions Grid */}
        {loading ? (
          <div className="text-center py-12 md:py-16">
            <Loader2 size={40} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="font-comic text-base md:text-lg text-muted-foreground">Loading confessions...</p>
          </div>
        ) : confessions.length === 0 ? (
          <div className="text-center py-12 md:py-16 sketch-border bg-card">
            <p className="font-hand text-2xl md:text-3xl mb-4">🦗 *cricket sounds*</p>
            <p className="font-comic text-base md:text-lg text-muted-foreground mb-4">
              {searchQuery
                ? "No confessions match your search. Try different keywords!"
                : "No confessions yet. Be the first to break the silence!"}
            </p>
            {!user && (
              <Link to="/auth" className="btn-sketch-destructive py-2 px-6 text-base md:text-lg inline-block">
                ✏️ Login to Confess
              </Link>
            )}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 md:gap-6">
          {confessions.map((confession, index) => (
              <div key={confession.id} className="break-inside-avoid mb-4 md:mb-6">
                <ConfessionCard
                  confession={confession}
                  onLike={toggleLike}
                  index={index}
                />
            </div>
          ))}
        </div>
        )}

        {/* Load More */}
        {confessions.length > 0 && hasMore && (
          <div className="text-center mt-6 md:mt-8">
            <button 
              onClick={loadMoreConfessions}
              disabled={loadingMore}
              className="btn-sketch text-base md:text-xl disabled:opacity-50 flex items-center gap-2 mx-auto"
            >
              {loadingMore ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Loading...
                </>
              ) : (
                'More secrets 👀'
              )}
          </button>
        </div>
        )}
      </div>
    </section>
  );
};

export default ConfessionsSection;

