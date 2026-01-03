import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: string;
  to: string;
  color: "red" | "yellow" | "blue" | "neon";
  children: React.ReactNode;
}

const colorClasses = {
  red: "border-accent bg-accent/5 hover:bg-accent/10",
  yellow: "border-secondary bg-secondary/5 hover:bg-secondary/10",
  blue: "border-primary bg-primary/5 hover:bg-primary/10",
  neon: "border-neon bg-neon/5 hover:bg-neon/10",
};

const DashboardCard = ({ title, description, icon, to, color, children }: DashboardCardProps) => {
  return (
    <Link 
      to={to}
      className={`sketch-border p-6 transition-all duration-300 hover:animate-wiggle group ${colorClasses[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h3 className="font-hand text-2xl text-ink">{title}</h3>
        </div>
        <ArrowRight className="w-5 h-5 text-ink/50 group-hover:text-ink group-hover:translate-x-1 transition-all" />
      </div>
      <p className="font-comic text-sm text-ink/70 mb-4">{description}</p>
      <div className="space-y-2">
        {children}
      </div>
    </Link>
  );
};

export default DashboardCard;
