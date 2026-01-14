import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

const GlobalSearch = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchUsers = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(5);

      if (!error && data) {
        setResults(data);
      }
      setLoading(false);
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSelectUser = (username: string) => {
    navigate(`/user/${username}`);
    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn-sketch p-2 hover-wiggle"
        title="Search users"
      >
        <Search size={20} strokeWidth={2.5} />
      </button>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 md:w-80 sketch-border bg-card shadow-sketch z-50 animate-bounce-in">
          <div className="p-3">
            <div className="flex items-center gap-2 sketch-border-sm bg-background px-3 py-2">
              <Search size={16} className="text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="flex-1 bg-transparent font-comic text-sm focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Results */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center font-comic text-sm text-muted-foreground">
                Searching...
              </div>
            ) : query && results.length === 0 ? (
              <div className="p-4 text-center font-comic text-sm text-muted-foreground">
                No users found for "{query}"
              </div>
            ) : results.length > 0 ? (
              <div className="pb-2">
                {results.map((profile) => (
                  <button
                    key={profile.user_id}
                    onClick={() => profile.username && handleSelectUser(profile.username)}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary/50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 sketch-border-sm bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User size={16} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-comic text-sm font-bold truncate">
                        @{profile.username || 'anonymous'}
                      </p>
                      {profile.display_name && (
                        <p className="font-comic text-xs text-muted-foreground truncate">
                          {profile.display_name}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : !query ? (
              <div className="p-4 text-center font-comic text-xs text-muted-foreground">
                Type a username to search
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
