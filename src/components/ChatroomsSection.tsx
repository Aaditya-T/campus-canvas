import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatroomCard from './ChatroomCard';
import CreateChatroomRequestModal from './CreateChatroomRequestModal';
import { Plus, Search, Loader2 } from 'lucide-react';
import { useChatrooms } from '@/hooks/useChatrooms';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';

const ChatroomsSection = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { fetchChatrooms, loading } = useChatrooms();
  const [chatrooms, setChatrooms] = useState<any[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const loadChatrooms = async () => {
      const rooms = await fetchChatrooms();
      setChatrooms(rooms);
    };
    loadChatrooms();
  }, [fetchChatrooms]);

  const filteredChatrooms = chatrooms.filter((room) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      room.title.toLowerCase().includes(query) ||
      room.description.toLowerCase().includes(query) ||
      room.emoji.includes(query)
    );
  });

  const getColor = (index: number): 'yellow' | 'blue' | 'pink' | 'green' => {
    const colors: ('yellow' | 'blue' | 'pink' | 'green')[] = ['yellow', 'blue', 'pink', 'green'];
    return colors[index % colors.length];
  };

  const handleCreateClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCardClick = (chatroomId: string) => {
    navigate(`/chatrooms/${chatroomId}`);
  };

  return (
    <section id="chatrooms" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="inline-block bg-accent text-accent-foreground px-3 py-1 sketch-border-sm text-handwritten-sm tilt-1 mb-2">
              💬 Real talk
            </span>
            <h2 className="text-handwritten-3xl md:text-handwritten-4xl font-bold marker-underline">
              Chatrooms
            </h2>
            <p className="font-comic text-muted-foreground mt-2">
              Comic-style group chats. Jump in, say hi, make friends (or enemies, no judgment)
            </p>
          </div>
          
          <button onClick={handleCreateClick} className="btn-sketch-accent py-2 px-4 text-lg flex items-center gap-2 shrink-0">
            <Plus size={20} strokeWidth={2.5} />
            Create Room
          </button>
        </div>

        {/* Search */}
        <div className="sketch-border bg-card p-3 mb-8 flex items-center gap-3 max-w-md">
          <Search size={20} strokeWidth={2.5} className="text-muted-foreground" />
          <Input
            type="text"
            placeholder="Find your vibe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent font-comic placeholder:text-muted-foreground border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>

        {/* Chatrooms Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 size={40} className="animate-spin mx-auto mb-4 text-primary" />
            <p className="font-comic text-muted-foreground">Loading chatrooms...</p>
          </div>
        ) : filteredChatrooms.length === 0 ? (
          <div className="text-center py-12 sketch-border bg-card">
            <p className="font-hand text-2xl mb-4">💬</p>
            <p className="font-comic text-lg text-muted-foreground">
              {searchQuery ? 'No chatrooms match your search' : 'No chatrooms yet. Be the first to create one!'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChatrooms.map((room, index) => (
              <div
                key={room.id}
                className={index % 2 === 0 ? 'tilt-1' : 'tilt-2'}
                style={{ animationDelay: `${index * 100}ms` }}
                onClick={() => handleCardClick(room.id)}
              >
                <ChatroomCard
                  name={room.title}
                  description={room.description}
                  members={room.member_count || 0}
                  messages={room.message_count || 0}
                  isActive={room.message_count > 0}
                  emoji={room.emoji}
                  color={getColor(index)}
                />
              </div>
            ))}
          </div>
        )}

        <CreateChatroomRequestModal
          open={showCreateModal}
          onOpenChange={setShowCreateModal}
          onSuccess={() => {
            fetchChatrooms().then(setChatrooms);
          }}
        />
      </div>
    </section>
  );
};

export default ChatroomsSection;
