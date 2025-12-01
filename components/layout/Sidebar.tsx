import Link from 'next/link';
import { Home, CreditCard, TrendingUp, Settings } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/bills', icon: CreditCard, label: 'Bills' },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  return (
    <aside className="sidebar bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border">
        <span className="text-xl font-bold tracking-tight">
          ⛵ Oar
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-md
                       text-muted-foreground hover:text-foreground
                       hover:bg-accent transition-colors"
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
