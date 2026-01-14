import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, MessageCircle, Eye, PenTool, BookOpen, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import GlobalSearch from './GlobalSearch';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();

  const navItems = [
    { label: 'Feed', to: '/feed', icon: PenTool },
    { label: 'Chatrooms', to: '/chatrooms', icon: MessageCircle },
    { label: 'Confessions', to: '/confessions', icon: Eye },
    { label: 'Notes', to: '/resources', icon: BookOpen },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b-[3px] border-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 sketch-border bg-secondary flex items-center justify-center group-hover:animate-wiggle">
              <span className="text-handwritten-lg font-bold">C</span>
            </div>
            <span className="text-handwritten-xl font-bold hidden sm:block marker-underline">
              Campus Chaos
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.to}
                className={`btn-sketch py-2 px-4 text-lg hover-wiggle ${
                  index % 2 === 0 ? 'tilt-1' : 'tilt-2'
                } ${isActive(item.to) ? 'bg-secondary border-[3px]' : ''}`}
              >
                <item.icon className="inline-block w-5 h-5 mr-1" strokeWidth={2.5} />
                {item.label}
              </Link>
            ))}
          </div>

          {/* Search & Auth */}
          <div className="hidden md:flex items-center gap-3">
            <GlobalSearch />
            {loading ? (
              <div className="w-8 h-8 sketch-border animate-pulse bg-muted" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link 
                  to="/profile" 
                  className="flex items-center gap-2 btn-sketch py-2 px-3"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden sketch-border-sm">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} strokeWidth={2.5} />
                    )}
                  </div>
                  <span className="font-comic text-sm max-w-[100px] truncate">
                    {profile?.username || 'User'}
                  </span>
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="btn-sketch py-2 px-3 text-sm"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                </button>
              </div>
            ) : (
              <Link to="/auth" className="btn-sketch-primary text-lg">
                <LogIn className="inline-block w-5 h-5 mr-1" strokeWidth={2.5} />
                Join the Chaos!
              </Link>
            )}
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
                <Link
                  key={item.label}
                  to={item.to}
                  className={`btn-sketch py-3 text-center ${
                    index % 2 === 0 ? 'tilt-1' : 'tilt-2'
                  } ${isActive(item.to) ? 'bg-secondary border-[3px]' : ''}`}
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="inline-block w-5 h-5 mr-2" strokeWidth={2.5} />
                  {item.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link 
                    to="/profile"
                    className="btn-sketch py-3 text-center mt-2 border-t-2 border-dashed border-foreground/30"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden sketch-border-sm">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={18} strokeWidth={2.5} />
                        )}
                      </div>
                      <span className="font-comic">{profile?.username || 'My Profile'}</span>
                    </div>
                  </Link>
                  <button 
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                    className="btn-sketch py-3"
                  >
                    <LogOut className="inline-block w-5 h-5 mr-2" strokeWidth={2.5} />
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className="btn-sketch-primary py-3 mt-2"
                  onClick={() => setIsOpen(false)}
                >
                  ✏️ Join the Chaos!
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
