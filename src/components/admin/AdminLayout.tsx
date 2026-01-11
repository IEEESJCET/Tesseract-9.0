import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutDashboard, Ticket, Users, LogOut, Home } from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { href: '/admin/registrations', label: 'Registrations', icon: Users },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { profile, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-display font-bold text-primary glow-text tracking-wider">
              TESSERACT
            </span>
          </Link>
          <span className="text-xs text-muted-foreground font-mono">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded font-mono text-sm transition-colors ${
                  isActive
                    ? 'bg-primary text-background'
                    : 'text-primary/70 hover:bg-secondary/50 hover:text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 rounded font-mono text-sm text-primary/70 hover:bg-secondary/50 hover:text-primary transition-colors"
          >
            <Home className="w-4 h-4" />
            Back to Site
          </Link>
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded font-mono text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
          <h1 className="text-lg font-display text-primary">Admin Panel</h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground font-mono">
              {profile?.full_name || profile?.email}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {(profile?.full_name || profile?.email || 'A')[0].toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
