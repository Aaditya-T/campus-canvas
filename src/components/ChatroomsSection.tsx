import ChatroomCard from './ChatroomCard';
import { Plus, Search } from 'lucide-react';

const chatrooms = [
  {
    name: "Night Owls Club",
    description: "For those who study at 3am and question their life choices together",
    members: 234,
    messages: 1.2,
    isActive: true,
    emoji: "🦉",
    color: "blue" as const,
  },
  {
    name: "Meme Central",
    description: "Post memes, get memes, become the meme. No normie stuff allowed.",
    members: 567,
    messages: 4.8,
    isActive: true,
    emoji: "😂",
    color: "yellow" as const,
  },
  {
    name: "Study Buddies",
    description: "Find study partners, share notes, cry about exams together",
    members: 189,
    messages: 892,
    emoji: "📚",
    color: "green" as const,
  },
  {
    name: "Relationship Drama",
    description: "Vent about your situationship. We won't judge (much)",
    members: 423,
    messages: 3.1,
    isActive: true,
    emoji: "💔",
    color: "pink" as const,
  },
  {
    name: "Foodie Corner",
    description: "Best cheap eats, cafeteria reviews, and midnight snack recommendations",
    members: 312,
    messages: 1.5,
    emoji: "🍜",
    color: "yellow" as const,
  },
  {
    name: "Random Chaos",
    description: "Literally anything goes. Brain dump central.",
    members: 789,
    messages: 6.7,
    isActive: true,
    emoji: "🌀",
    color: "blue" as const,
  },
];

const ChatroomsSection = () => {
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
          
          <button className="btn-sketch-accent py-2 px-4 text-lg flex items-center gap-2 shrink-0">
            <Plus size={20} strokeWidth={2.5} />
            Create Room
          </button>
        </div>

        {/* Search */}
        <div className="sketch-border bg-card p-3 mb-8 flex items-center gap-3 max-w-md">
          <Search size={20} strokeWidth={2.5} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Find your vibe..."
            className="flex-1 bg-transparent font-comic placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        {/* Chatrooms Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {chatrooms.map((room, index) => (
            <div
              key={room.name}
              className={index % 2 === 0 ? 'tilt-1' : 'tilt-2'}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <ChatroomCard {...room} />
            </div>
          ))}
        </div>

        {/* View All */}
        <div className="text-center mt-8">
          <button className="btn-sketch text-xl">
            Explore all rooms →
          </button>
        </div>
      </div>
    </section>
  );
};

export default ChatroomsSection;
