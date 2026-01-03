import Navigation from "@/components/Navigation";
import ChatroomsSection from "@/components/ChatroomsSection";
import Footer from "@/components/Footer";

const Chatrooms = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <ChatroomsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Chatrooms;
