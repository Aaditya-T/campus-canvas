import { ArrowDown, Sparkles, Zap } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden py-12">
      {/* Decorative Elements */}
      <div className="absolute top-10 left-10 text-handwritten-2xl opacity-20 tilt-3">✿</div>
      <div className="absolute top-20 right-20 text-handwritten-3xl opacity-20 tilt-4">★</div>
      <div className="absolute bottom-20 left-20 text-handwritten-2xl opacity-20 tilt-1">◆</div>
      <div className="absolute bottom-10 right-10 text-handwritten-3xl opacity-20 tilt-2">✦</div>
      
      {/* Floating Doodles */}
      <div className="absolute top-1/4 left-[15%] animate-float" style={{ animationDelay: '0s' }}>
        <div className="sticky-note w-24 h-24 flex items-center justify-center">
          <span className="text-handwritten-lg">lol wat</span>
        </div>
      </div>
      <div className="absolute top-1/3 right-[10%] animate-float" style={{ animationDelay: '1s' }}>
        <div className="sticky-note-pink w-28 h-20 sketch-border flex items-center justify-center">
          <span className="text-handwritten-base">no sleep 😴</span>
        </div>
      </div>
      <div className="absolute bottom-1/4 left-[10%] animate-float" style={{ animationDelay: '2s' }}>
        <div className="sticky-note-blue w-24 h-24 sketch-border flex items-center justify-center">
          <span className="text-handwritten-sm">send notes pls</span>
        </div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        {/* Main Title */}
        <div className="mb-6">
          <span className="inline-block bg-destructive text-destructive-foreground px-4 py-1 sketch-border text-handwritten-lg tilt-2 mb-4">
            🔥 100% unfiltered
          </span>
        </div>
        
        <h1 className="text-handwritten-4xl md:text-[6rem] lg:text-[8rem] font-bold leading-none mb-6">
          <span className="marker-underline">Campus</span>
          <br />
          <span className="marker-underline-red inline-flex items-center gap-2">
            Chaos
            <Zap className="inline w-12 h-12 md:w-16 md:h-16 text-secondary animate-wiggle" strokeWidth={3} />
          </span>
        </h1>

        <p className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 font-comic">
          Where students{' '}
          <span className="sketch-border-sm px-2 bg-secondary inline-block tilt-1">rant</span>,{' '}
          <span className="sketch-border-sm px-2 bg-accent/30 inline-block tilt-2">connect</span>, and{' '}
          <span className="sketch-border-sm px-2 bg-neon/30 inline-block tilt-3">confess</span>
          <br />
          — no filters, just vibes ✨
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button className="btn-sketch-primary text-2xl group">
            <Sparkles className="inline w-6 h-6 mr-2 group-hover:animate-wiggle" strokeWidth={2.5} />
            Start Posting
          </button>
          <button className="btn-sketch text-2xl">
            👀 Browse Confessions
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12">
          <div className="sketch-border bg-card p-4 tilt-1 hover-wiggle">
            <div className="text-handwritten-2xl font-bold">2.4k+</div>
            <div className="text-sm font-comic text-muted-foreground">chaos agents</div>
          </div>
          <div className="sketch-border bg-card p-4 tilt-2 hover-wiggle">
            <div className="text-handwritten-2xl font-bold">12k+</div>
            <div className="text-sm font-comic text-muted-foreground">posts today</div>
          </div>
          <div className="sketch-border bg-card p-4 tilt-3 hover-wiggle">
            <div className="text-handwritten-2xl font-bold">847</div>
            <div className="text-sm font-comic text-muted-foreground">confessions</div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown className="w-8 h-8" strokeWidth={3} />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
