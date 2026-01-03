import { Heart, Github, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="py-12 border-t-[3px] border-foreground bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 sketch-border bg-secondary flex items-center justify-center">
                <span className="text-handwritten-lg font-bold">C</span>
              </div>
              <span className="text-handwritten-xl font-bold">Campus Chaos</span>
            </div>
            <p className="font-comic text-sm text-muted-foreground mb-4">
              Made by students, for students. No corpo vibes here. ✌️
            </p>
            <div className="flex gap-3">
              <a href="#" className="sketch-border-sm p-2 hover:bg-secondary transition-colors hover-wiggle">
                <Twitter size={18} strokeWidth={2.5} />
              </a>
              <a href="#" className="sketch-border-sm p-2 hover:bg-secondary transition-colors hover-wiggle">
                <Instagram size={18} strokeWidth={2.5} />
              </a>
              <a href="#" className="sketch-border-sm p-2 hover:bg-secondary transition-colors hover-wiggle">
                <Github size={18} strokeWidth={2.5} />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-handwritten-lg font-bold mb-4 marker-underline inline-block">Explore</h3>
            <ul className="space-y-2 font-comic text-sm">
              <li><a href="#" className="hover:marker-underline">Feed</a></li>
              <li><a href="#" className="hover:marker-underline">Chatrooms</a></li>
              <li><a href="#" className="hover:marker-underline">Confessions</a></li>
              <li><a href="#" className="hover:marker-underline">Events</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-handwritten-lg font-bold mb-4 marker-underline inline-block">Support</h3>
            <ul className="space-y-2 font-comic text-sm">
              <li><a href="#" className="hover:marker-underline">Community Guidelines</a></li>
              <li><a href="#" className="hover:marker-underline">Report a Problem</a></li>
              <li><a href="#" className="hover:marker-underline">FAQ</a></li>
              <li><a href="#" className="hover:marker-underline">Contact</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-handwritten-lg font-bold mb-4 marker-underline inline-block">Legal Stuff</h3>
            <ul className="space-y-2 font-comic text-sm">
              <li><a href="#" className="hover:marker-underline">Privacy Policy</a></li>
              <li><a href="#" className="hover:marker-underline">Terms of Service</a></li>
              <li><a href="#" className="hover:marker-underline">Cookie Policy</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t-2 border-dashed border-foreground/30 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-comic text-sm text-muted-foreground">
            © 2025 Campus Chaos. All rights reserved-ish.
          </p>
          <p className="font-comic text-sm flex items-center gap-1">
            Made with <Heart size={14} className="text-destructive animate-wiggle" fill="currentColor" /> and too much coffee
          </p>
        </div>

        {/* Easter Egg Doodles */}
        <div className="mt-8 text-center opacity-30">
          <span className="text-4xl">✿ ★ ◆ ✦ ☾ ♪ ✿</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
