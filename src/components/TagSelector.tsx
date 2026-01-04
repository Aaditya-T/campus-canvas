import { useState } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export const PREDEFINED_TAGS = [
  { value: 'rant', label: '😤 Rant', color: 'bg-accent/30' },
  { value: 'meme', label: '😂 Meme', color: 'bg-secondary/50' },
  { value: 'help', label: '🆘 Help', color: 'bg-destructive/30' },
  { value: 'study', label: '📚 Study', color: 'bg-primary/30' },
  { value: 'food', label: '🍕 Food', color: 'bg-neon/30' },
  { value: 'events', label: '🎉 Events', color: 'bg-accent/20' },
  { value: 'clubs', label: '🎭 Clubs', color: 'bg-secondary/30' },
  { value: 'hostel', label: '🏠 Hostel', color: 'bg-primary/20' },
  { value: 'placement', label: '💼 Placement', color: 'bg-neon/20' },
  { value: 'exam', label: '📝 Exam', color: 'bg-destructive/20' },
  { value: 'dating', label: '💕 Dating', color: 'bg-accent/40' },
  { value: 'random', label: '🎲 Random', color: 'bg-secondary/40' },
] as const;

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  maxTags?: number;
  compact?: boolean;
}

const TagSelector = ({ selectedTags, onTagsChange, maxTags = 3, compact = false }: TagSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleTag = (tagValue: string) => {
    if (selectedTags.includes(tagValue)) {
      onTagsChange(selectedTags.filter(t => t !== tagValue));
    } else if (selectedTags.length < maxTags) {
      onTagsChange([...selectedTags, tagValue]);
    }
  };

  const getTagInfo = (value: string) => {
    return PREDEFINED_TAGS.find(t => t.value === value);
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {PREDEFINED_TAGS.map((tag) => (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggleTag(tag.value)}
            className={`px-2 py-1 text-xs font-comic sketch-border-sm transition-all ${
              selectedTags.includes(tag.value)
                ? `${tag.color} border-foreground/50`
                : 'bg-background hover:bg-muted'
            } ${selectedTags.length >= maxTags && !selectedTags.includes(tag.value) ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={selectedTags.length >= maxTags && !selectedTags.includes(tag.value)}
          >
            {tag.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Selected Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedTags.map((tagValue) => {
          const tag = getTagInfo(tagValue);
          return tag ? (
            <span
              key={tagValue}
              className={`inline-flex items-center gap-1 px-2 py-1 text-sm font-comic sketch-border-sm ${tag.color}`}
            >
              {tag.label}
              <button
                type="button"
                onClick={() => toggleTag(tagValue)}
                className="hover:text-accent"
              >
                <X size={12} strokeWidth={3} />
              </button>
            </span>
          ) : null;
        })}
      </div>

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 sketch-border-sm bg-secondary/30 hover:bg-secondary/50 transition-colors font-comic text-sm w-full justify-between"
      >
        <span>
          {selectedTags.length === 0 
            ? 'Add tags...' 
            : `${selectedTags.length}/${maxTags} tags selected`}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 sketch-border bg-card p-2 max-h-48 overflow-y-auto">
          {PREDEFINED_TAGS.map((tag) => (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggleTag(tag.value)}
              disabled={selectedTags.length >= maxTags && !selectedTags.includes(tag.value)}
              className={`w-full flex items-center justify-between px-3 py-2 font-comic text-sm hover:bg-muted transition-colors ${
                selectedTags.length >= maxTags && !selectedTags.includes(tag.value) 
                  ? 'opacity-50 cursor-not-allowed' 
                  : ''
              }`}
            >
              <span className={`px-2 py-0.5 sketch-border-sm ${tag.color}`}>
                {tag.label}
              </span>
              {selectedTags.includes(tag.value) && (
                <Check size={16} className="text-primary" strokeWidth={3} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagSelector;
