import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').optional()
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const validateForm = () => {
    try {
      if (isLogin) {
        authSchema.pick({ email: true, password: true }).parse({ email, password });
      } else {
        authSchema.parse({ email, password, username });
      }
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.errors.forEach((error) => {
          if (error.path[0]) {
            newErrors[error.path[0] as string] = error.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "Successfully logged in."
          });
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password, username);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Signup failed",
              description: "This email is already registered. Try logging in instead.",
              variant: "destructive"
            });
          } else {
            toast({
              title: "Signup failed",
              description: error.message,
              variant: "destructive"
            });
          }
        } else {
          toast({
            title: "Welcome to Campus Chaos!",
            description: "Account created successfully."
          });
          navigate('/');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 sketch-border bg-secondary mx-auto flex items-center justify-center mb-4 animate-wiggle">
            <span className="text-4xl font-bold font-hand">C</span>
          </div>
          <h1 className="font-hand text-4xl text-ink marker-underline inline-block">
            Campus Chaos
          </h1>
          <p className="font-comic text-ink/70 mt-2">
            {isLogin ? 'Welcome back, chaos maker!' : 'Join the chaos!'}
          </p>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="sketch-border bg-paper p-6 space-y-4 tilt-1">
          <h2 className="font-hand text-2xl text-center mb-6">
            {isLogin ? '🔐 Login' : '✏️ Sign Up'}
          </h2>

          {!isLogin && (
            <div>
              <label className="font-comic text-sm text-ink/80 block mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full sketch-border bg-background px-4 py-3 font-comic focus:outline-none focus:border-primary"
                placeholder="your_username"
              />
              {errors.username && (
                <p className="text-accent text-sm font-comic mt-1">{errors.username}</p>
              )}
            </div>
          )}

          <div>
            <label className="font-comic text-sm text-ink/80 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full sketch-border bg-background px-4 py-3 font-comic focus:outline-none focus:border-primary"
              placeholder="you@university.edu"
            />
            {errors.email && (
              <p className="text-accent text-sm font-comic mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="font-comic text-sm text-ink/80 block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full sketch-border bg-background px-4 py-3 font-comic focus:outline-none focus:border-primary"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-accent text-sm font-comic mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-sketch-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '⏳ Loading...' : (isLogin ? '🚀 Login' : '🎉 Create Account')}
          </button>

          <div className="text-center pt-4 border-t-2 border-dashed border-ink/30">
            <p className="font-comic text-sm text-ink/70">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="font-hand text-lg text-primary hover:underline mt-1"
            >
              {isLogin ? 'Sign up here!' : 'Login here!'}
            </button>
          </div>
        </form>

        {/* Decorative elements */}
        <div className="mt-6 text-center">
          <p className="font-comic text-xs text-ink/50">
            ✨ No spam, just campus chaos ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
