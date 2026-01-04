import { useState } from 'react';
import { Flame, TrendingUp, Clock, Tag, User, Filter, X, ChevronDown } from 'lucide-react';
import { PREDEFINED_TAGS } from './TagSelector';

export type SortType = 'hot' | 'trending' | 'new';

interface FeedFiltersProps {
  sortBy: SortType;
  onSortChange: (sort: SortType) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  filterUsername: string;
  onUsernameChange: (username: string) => void;
}

const FeedFilters = ({
  sortBy,
  onSortChange,
  selectedTags,
  onTagsChange,
  filterUsername,
  onUsernameChange
}: FeedFiltersProps) => {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showUserFilter, setShowUserFilter] = useState(false);

  const sortOptions: { key: SortType; label: string; icon: typeof Flame }[] = [
    { key: 'hot', label: 'Hot', icon: Flame },
    { key: 'trending', label: 'Trending', icon: TrendingUp },
    { key: 'new', label: 'New', icon: Clock },
  ];

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const hasActiveFilters = selectedTags.length > 0 || filterUsername;

  const clearAllFilters = () => {
    onTagsChange([]);
    onUsernameChange('');
  };

  return (
    <div className="space-y-3">
      {/* Sort Buttons Row */}
      <div className="flex flex-wrap gap-2 items-center">
        {sortOptions.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => onSortChange(key)}
            className={`py-2 px-3 md:px-4 text-sm md:text-lg flex items-center gap-1 transition-all ${
              sortBy === key ? 'btn-sketch-primary' : 'btn-sketch'
            }`}
          >
            <Icon size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        <div className="h-6 w-px bg-foreground/20 hidden sm:block" />

        {/* Tag Filter Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTagDropdown(!showTagDropdown);
              setShowUserFilter(false);
            }}
            className={`py-2 px-3 md:px-4 text-sm md:text-lg flex items-center gap-1 ${
              selectedTags.length > 0 ? 'btn-sketch-primary' : 'btn-sketch'
            }`}
          >
            <Tag size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">Tags</span>
            {selectedTags.length > 0 && (
              <span className="bg-accent text-accent-foreground text-xs px-1.5 rounded-full">
                {selectedTags.length}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showTagDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showTagDropdown && (
            <div className="absolute z-30 top-full left-0 mt-2 sketch-border bg-card p-2 min-w-[200px] max-h-64 overflow-y-auto">
              <div className="font-comic text-xs text-muted-foreground mb-2 px-2">
                Filter by tags
              </div>
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag.value}
                  onClick={() => toggleTag(tag.value)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 font-comic text-sm hover:bg-muted transition-colors rounded ${
                    selectedTags.includes(tag.value) ? 'bg-muted' : ''
                  }`}
                >
                  <span className={`w-4 h-4 sketch-border-sm flex items-center justify-center text-xs ${
                    selectedTags.includes(tag.value) ? 'bg-primary text-primary-foreground' : 'bg-background'
                  }`}>
                    {selectedTags.includes(tag.value) && '✓'}
                  </span>
                  <span className={`px-1.5 py-0.5 text-xs ${tag.color} sketch-border-sm`}>
                    {tag.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Filter Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserFilter(!showUserFilter);
              setShowTagDropdown(false);
            }}
            className={`py-2 px-3 md:px-4 text-sm md:text-lg flex items-center gap-1 ${
              filterUsername ? 'btn-sketch-primary' : 'btn-sketch'
            }`}
          >
            <User size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">User</span>
            {filterUsername && (
              <span className="max-w-[60px] truncate text-xs">@{filterUsername}</span>
            )}
          </button>

          {showUserFilter && (
            <div className="absolute z-30 top-full right-0 sm:left-0 mt-2 sketch-border bg-card p-3 min-w-[220px]">
              <div className="font-comic text-xs text-muted-foreground mb-2">
                Filter by username
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={filterUsername}
                  onChange={(e) => onUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="username"
                  className="flex-1 sketch-border-sm bg-background px-2 py-1.5 font-comic text-sm focus:outline-none"
                />
                {filterUsername && (
                  <button
                    onClick={() => onUsernameChange('')}
                    className="p-1.5 hover:bg-accent/20 rounded"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-comic text-xs text-muted-foreground flex items-center gap-1">
            <Filter size={12} /> Active filters:
          </span>
          
          {selectedTags.map((tagValue) => {
            const tag = PREDEFINED_TAGS.find(t => t.value === tagValue);
            return tag ? (
              <button
                key={tagValue}
                onClick={() => toggleTag(tagValue)}
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-comic sketch-border-sm ${tag.color} hover:opacity-80`}
              >
                {tag.label}
                <X size={10} strokeWidth={3} />
              </button>
            ) : null;
          })}

          {filterUsername && (
            <button
              onClick={() => onUsernameChange('')}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-comic sketch-border-sm bg-primary/20 hover:opacity-80"
            >
              @{filterUsername}
              <X size={10} strokeWidth={3} />
            </button>
          )}

          <button
            onClick={clearAllFilters}
            className="text-xs font-comic text-muted-foreground hover:text-foreground underline ml-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
};

export default FeedFilters;
