import PostCard from './PostCard';
import { PenTool, TrendingUp, Clock, Flame } from 'lucide-react';

const posts = [
  {
    author: "midnight_coder",
    content: "Just pulled an all-nighter for a project that's due in 3 hours. Send help. And coffee. Mostly coffee. ☕️💀",
    timestamp: "2 mins ago",
    likes: 42,
    comments: 8,
    tags: ["engineering", "help", "nocturnal"]
  },
  {
    author: "library_ghost",
    content: "Found the BEST study spot on campus - 4th floor library, back corner near the broken AC. It's freezing but nobody goes there. You're welcome 📚",
    timestamp: "15 mins ago",
    likes: 127,
    comments: 23,
    tags: ["protip", "studyspots"]
  },
  {
    author: "ramen_enthusiast",
    content: "The new cafeteria ramen is actually fire?? Since when do they know seasoning??? Am I dreaming????",
    timestamp: "1 hour ago",
    likes: 89,
    comments: 31,
    tags: ["food", "blessed", "finally"]
  },
  {
    author: "procrastination_pro",
    content: "POV: You have 3 assignments due tomorrow and you're reading random posts on this app instead. We're all in this together fam 🫡",
    timestamp: "2 hours ago",
    likes: 234,
    comments: 56,
    tags: ["relatable", "crying"]
  },
  {
    author: "campus_cat",
    content: "Spotted the orange tabby near the science building again! He let me pet him for like 2 whole seconds before running away. Progress! 🐱",
    timestamp: "3 hours ago",
    likes: 312,
    comments: 47,
    tags: ["campuscat", "blessed", "furry"]
  },
];

const PostsFeed = () => {
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
        <div className="sketch-border bg-card p-4 mb-8 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 sketch-border bg-accent/20 flex items-center justify-center shrink-0">
            <PenTool size={24} strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder="What's on your mind? Spill the tea... ☕"
            className="flex-1 w-full bg-transparent text-lg font-comic placeholder:text-muted-foreground focus:outline-none"
          />
          <button className="btn-sketch-primary py-2 px-6 text-xl shrink-0">
            Post it!
          </button>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {posts.map((post, index) => (
            <PostCard
              key={index}
              {...post}
              tilt={index}
            />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <button className="btn-sketch text-xl">
            Load more chaos ↓
          </button>
        </div>
      </div>
    </section>
  );
};

export default PostsFeed;
