import Navigation from "@/components/Navigation";
import ConfessionsSection from "@/components/ConfessionsSection";
import Footer from "@/components/Footer";

const Confessions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <ConfessionsSection />
      </main>
      <Footer />
    </div>
  );
};

export default Confessions;
