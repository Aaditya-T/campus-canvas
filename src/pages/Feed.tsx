import Navigation from "@/components/Navigation";
import PostsFeed from "@/components/PostsFeed";
import Footer from "@/components/Footer";

const Feed = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <PostsFeed />
      </main>
      <Footer />
    </div>
  );
};

export default Feed;
