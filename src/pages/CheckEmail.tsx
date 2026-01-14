import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const CheckEmail = () => {
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
        </div>

        {/* Check Email Card */}
        <div className="sketch-border bg-paper p-8 space-y-6 text-center tilt-1">
          <div className="flex justify-center">
            <div className="w-24 h-24 sketch-border bg-primary/20 rounded-full flex items-center justify-center">
              <Mail size={48} className="text-primary" />
            </div>
          </div>

          <div>
            <h2 className="font-hand text-3xl mb-3">Check Your Email! 📧</h2>
            <p className="font-comic text-ink/80 text-lg mb-2">
              We've sent you a confirmation link
            </p>
            <p className="font-comic text-sm text-ink/60">
              Click the link in your email to verify your account and complete your signup.
            </p>
          </div>

          <div className="bg-accent/20 p-4 sketch-border-sm">
            <p className="font-comic text-sm text-foreground">
              <strong>💡 Tip:</strong> Check your spam folder if you don't see the email!
            </p>
          </div>

          <div className="pt-4 border-t-2 border-dashed border-ink/30">
            <p className="font-comic text-sm text-ink/70 mb-4">
              Already confirmed your email?
            </p>
            <Link
              to="/auth"
              className="btn-sketch-primary py-3 text-lg inline-block w-full"
            >
              Continue to Login
            </Link>
          </div>

          <Link
            to="/auth"
            className="flex items-center justify-center gap-2 font-comic text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back to login
          </Link>
        </div>

        {/* Decorative elements */}
        <div className="mt-6 text-center">
          <p className="font-comic text-xs text-ink/50">
            ✨ We'll be waiting for you! ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default CheckEmail;

