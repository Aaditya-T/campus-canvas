import Navigation from "@/components/Navigation";
import ResourcesSection from "@/components/ResourcesSection";
import Footer from "@/components/Footer";

const Resources = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-20">
        <ResourcesSection />
      </main>
      <Footer />
    </div>
  );
};

export default Resources;
