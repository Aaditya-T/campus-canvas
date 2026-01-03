import ConfessionCard from './ConfessionCard';
import { Eye, EyeOff, Send } from 'lucide-react';

const confessions = [
  {
    content: "I've been pretending to understand the lectures for 3 semesters now. Still have no idea what's going on but my poker face is elite.",
    timestamp: "10 mins ago",
    likes: 234,
    comments: 45,
    variant: "yellow" as const,
  },
  {
    content: "Fell asleep in class and snored so loud the professor stopped mid-sentence. I'm never sitting in the front row again.",
    timestamp: "25 mins ago",
    likes: 567,
    comments: 89,
    variant: "pink" as const,
  },
  {
    content: "I have a crush on the person who always takes the seat next to me in the library. We've never spoken but I think we're basically dating.",
    timestamp: "1 hour ago",
    likes: 189,
    comments: 67,
    variant: "blue" as const,
  },
  {
    content: "Submitted an assignment written entirely by ChatGPT. Got an A. The guilt is eating me alive but also... that's a flex right?",
    timestamp: "2 hours ago",
    likes: 423,
    comments: 156,
    variant: "chalk" as const,
  },
  {
    content: "I've been using the same water bottle without washing it for... actually I don't want to admit how long. We all have our secrets.",
    timestamp: "3 hours ago",
    likes: 312,
    comments: 78,
    variant: "yellow" as const,
  },
  {
    content: "Cried in the bathroom between classes today. Not because of stress, just saw a really cute dog video. No regrets.",
    timestamp: "4 hours ago",
    likes: 678,
    comments: 92,
    variant: "pink" as const,
  },
];

const ConfessionsSection = () => {
  return (
    <section id="confessions" className="py-16">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="inline-block bg-neon/30 px-3 py-1 sketch-border-sm text-handwritten-sm tilt-3 mb-2">
            🤫 Shhh...
          </span>
          <h2 className="text-handwritten-3xl md:text-handwritten-4xl font-bold marker-underline-red mb-4">
            Anonymous Confessions
          </h2>
          <p className="font-comic text-muted-foreground max-w-xl mx-auto">
            Spill your secrets into the void. No names, no judgment, just pure unfiltered honesty.
            Like a digital bathroom wall, but classier (barely).
          </p>
        </div>

        {/* Submit Confession */}
        <div className="sketch-border bg-card p-6 mb-12 max-w-2xl mx-auto tilt-1">
          <div className="flex items-center gap-2 mb-4">
            <EyeOff size={24} strokeWidth={2.5} />
            <span className="text-handwritten-lg font-bold">Got something to confess?</span>
          </div>
          <textarea
            placeholder="Get it off your chest... we won't tell anyone 🤐"
            className="w-full bg-muted/50 p-4 font-comic placeholder:text-muted-foreground focus:outline-none resize-none h-24 sketch-border-sm mb-4"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground font-comic flex items-center gap-1">
              <Eye size={14} /> 100% anonymous. Promise.
            </p>
            <button className="btn-sketch-destructive py-2 px-6 text-lg flex items-center gap-2">
              <Send size={18} strokeWidth={2.5} />
              Confess
            </button>
          </div>
        </div>

        {/* Confessions Masonry */}
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
          {confessions.map((confession, index) => (
            <div key={index} className="break-inside-avoid">
              <ConfessionCard {...confession} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="btn-sketch text-xl">
            More secrets 👀
          </button>
        </div>
      </div>
    </section>
  );
};

export default ConfessionsSection;
