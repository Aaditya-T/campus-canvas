import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import Footer from "@/components/Footer";
import DashboardCard from "@/components/DashboardCard";
import { Heart, Users, Download, Clock } from "lucide-react";

// Mock preview data
const latestPosts = [
  { id: 1, author: "anon_coder", content: "Just survived my third all-nighter this week 💀", likes: 42 },
  { id: 2, author: "sleepy_eng", content: "Prof uploaded notes 5 mins before exam lmao", likes: 89 },
];

const activeChatrooms = [
  { id: 1, name: "☕ Late Night Study", members: 156, active: true },
  { id: 2, name: "🎮 Gaming Squad", members: 89, active: true },
];

const latestConfessions = [
  { id: 1, content: "I still don't know what my major actually does...", likes: 234 },
];

const popularResources = [
  { id: 1, name: "DSA Notes - Complete", branch: "CSE", downloads: 1.2 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        <HeroSection />
        
        {/* Dashboard Cards Section */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-hand text-4xl md:text-5xl text-ink mb-4 marker-underline inline-block">
                What's Happening? 📢
              </h2>
              <p className="font-comic text-lg text-ink/70 max-w-xl mx-auto">
                Jump into any corner of the chaos — here's a quick peek at what's going on!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* Feed Card */}
              <DashboardCard
                title="Feed"
                description="See what everyone's ranting about"
                icon="📝"
                to="/feed"
                color="yellow"
              >
                {latestPosts.map((post) => (
                  <div key={post.id} className="bg-background/50 p-3 sketch-border text-sm">
                    <span className="font-comic text-primary font-bold">@{post.author}</span>
                    <p className="font-comic text-ink/80 truncate">{post.content}</p>
                    <div className="flex items-center gap-1 mt-1 text-accent">
                      <Heart className="w-3 h-3" />
                      <span className="text-xs">{post.likes}</span>
                    </div>
                  </div>
                ))}
              </DashboardCard>

              {/* Chatrooms Card */}
              <DashboardCard
                title="Chatrooms"
                description="Find your tribe, join the conversation"
                icon="💬"
                to="/chatrooms"
                color="blue"
              >
                {activeChatrooms.map((room) => (
                  <div key={room.id} className="bg-background/50 p-3 sketch-border text-sm flex items-center justify-between">
                    <div>
                      <p className="font-comic font-bold">{room.name}</p>
                      <div className="flex items-center gap-1 text-ink/60 text-xs">
                        <Users className="w-3 h-3" />
                        <span>{room.members} members</span>
                      </div>
                    </div>
                    {room.active && (
                      <span className="w-2 h-2 bg-neon rounded-full animate-pulse" />
                    )}
                  </div>
                ))}
              </DashboardCard>

              {/* Confessions Card */}
              <DashboardCard
                title="Confessions"
                description="Spill the tea, stay anonymous"
                icon="🎭"
                to="/confessions"
                color="red"
              >
                {latestConfessions.map((confession) => (
                  <div key={confession.id} className="sticky-note p-3 text-sm">
                    <p className="font-hand text-ink/90 italic">"{confession.content}"</p>
                    <div className="flex items-center gap-1 mt-2 text-accent">
                      <Heart className="w-3 h-3" />
                      <span className="text-xs font-comic">{confession.likes}</span>
                    </div>
                  </div>
                ))}
                <p className="font-comic text-xs text-ink/50 text-center">
                  + 47 more confessions today...
                </p>
              </DashboardCard>

              {/* Resources Card */}
              <DashboardCard
                title="Notes & Resources"
                description="Share & find study materials"
                icon="📚"
                to="/resources"
                color="neon"
              >
                {popularResources.map((resource) => (
                  <div key={resource.id} className="bg-background/50 p-3 sketch-border text-sm">
                    <p className="font-comic font-bold text-ink">{resource.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-comic text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {resource.branch}
                      </span>
                      <div className="flex items-center gap-1 text-ink/60 text-xs">
                        <Download className="w-3 h-3" />
                        <span>{resource.downloads}k</span>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-xs text-ink/50 font-comic justify-center">
                  <Clock className="w-3 h-3" />
                  <span>23 new uploads this week</span>
                </div>
              </DashboardCard>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
