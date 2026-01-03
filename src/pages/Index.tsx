import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import PostsFeed from '@/components/PostsFeed';
import ChatroomsSection from '@/components/ChatroomsSection';
import ConfessionsSection from '@/components/ConfessionsSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <HeroSection />
        <PostsFeed />
        <ChatroomsSection />
        <ConfessionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
