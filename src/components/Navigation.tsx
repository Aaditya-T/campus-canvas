import { useState } from 'react';
import { Menu, X, MessageCircle, Users, Eye, PenTool } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: 'Feed', href: '#feed', icon: PenTool },
    { label: 'Chatrooms', href: '#chatrooms', icon: MessageCircle },
    { label: 'Confessions', href: '#confessions', icon: Eye },
    { label: 'Community', href: '#community', icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b-[3px] border-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-10 h-10 sketch-border bg-secondary flex items-center justify-center group-hover:animate-wiggle">
              <span className="text-handwritten-lg font-bold">C</span>
            </div>
            <span className="text-handwritten-xl font-bold hidden sm:block marker-underline">
              Campus Chaos
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item, index) => (
              <a
                key={item.label}
                href={item.href}
                className={`btn-sketch py-2 px-4 text-lg hover-wiggle ${
                  index % 2 === 0 ? 'tilt-1' : 'tilt-2'
                }`}
              >
                <item.icon className="inline-block w-5 h-5 mr-1" strokeWidth={2.5} />
                {item.label}
              </a>
            ))}
          </div>

          {/* Join Button */}
          <div className="hidden md:block">
            <button className="btn-sketch-primary text-lg">
              ✏️ Join the Chaos!
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden sketch-border p-2 hover-wiggle"
          >
            {isOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t-2 border-dashed border-foreground animate-bounce-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`btn-sketch py-3 text-center ${
                    index % 2 === 0 ? 'tilt-1' : 'tilt-2'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="inline-block w-5 h-5 mr-2" strokeWidth={2.5} />
                  {item.label}
                </a>
              ))}
              <button className="btn-sketch-primary py-3 mt-2">
                ✏️ Join the Chaos!
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
