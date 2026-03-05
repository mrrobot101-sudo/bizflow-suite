import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'primary' | 'accent';
}

export default function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <div className={`rounded-xl p-4 border animate-fade-in ${
      variant === 'primary' ? 'gradient-primary text-primary-foreground border-transparent' :
      variant === 'accent' ? 'gradient-accent text-accent-foreground border-transparent' :
      'bg-card border-border'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${
            variant === 'default' ? 'text-muted-foreground' : 'opacity-80'
          }`}>{title}</p>
          <p className="text-2xl font-heading font-bold mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 ${variant === 'default' ? 'text-muted-foreground' : 'opacity-70'}`}>{trend}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          variant === 'default' ? 'bg-muted' : 'bg-primary-foreground/20'
        }`}>
          <Icon size={20} className={variant === 'default' ? 'text-primary' : ''} />
        </div>
      </div>
    </div>
  );
}
