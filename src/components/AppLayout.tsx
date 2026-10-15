import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, FileDown, Users, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { role, displayName, user, signOut } = useAuth();

  const navItems = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/transactions', label: 'Sales', icon: List },
    { to: '/add', label: 'New Sale', icon: PlusCircle, primary: true },
    ...(role === 'owner'
      ? [
          { to: '/export', label: 'Export', icon: FileDown },
          { to: '/staff', label: 'Staff', icon: Users },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="gradient-primary px-4 py-3 flex items-center justify-between sticky top-0 z-40 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-foreground/20 flex items-center justify-center font-heading font-bold text-primary-foreground text-sm">CM</div>
          <span className="font-heading font-bold text-primary-foreground text-lg">Cyber MIS</span>
        </Link>
        <nav className="hidden md:flex gap-1">
          {navItems.map(item => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-primary-foreground/20 text-primary-foreground' : 'text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-xs text-primary-foreground/80 max-w-[140px] truncate">
            {displayName || user?.email} · {role === 'owner' ? 'Owner' : 'Staff'}
          </span>
          <button onClick={signOut} aria-label="Sign out" className="p-2 rounded-lg text-primary-foreground/80 hover:bg-primary-foreground/10">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24 md:pb-6">{children}</main>

      <footer className="hidden md:block text-center py-3 text-xs text-muted-foreground border-t">
        Cyber MIS &copy; {new Date().getFullYear()}
      </footer>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t flex justify-around items-end px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map(item => {
          const active = location.pathname === item.to;
          if (item.primary) {
            return (
              <Link key={item.to} to={item.to} aria-label={item.label} className="-mt-6 flex flex-col items-center gap-0.5 text-[11px] font-medium">
                <span className="w-14 h-14 rounded-full gradient-primary text-primary-foreground flex items-center justify-center shadow-lg">
                  <item.icon size={26} />
                </span>
                <span className={active ? 'text-primary' : 'text-muted-foreground'}>{item.label}</span>
              </Link>
            );
          }
          return (
            <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-0.5 min-w-[56px] py-1 text-[11px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>
              <item.icon size={22} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
