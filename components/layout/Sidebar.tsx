import Link from 'next/link';
import { Home, CreditCard, TrendingUp, Settings, Calendar } from 'lucide-react';
import { getBillsForCurrentMonthStats } from '@/actions/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { formatMoney } from '@/lib/money';

const navItems = [
  { href: '/', icon: Home, label: 'Dashboard' },
  { href: '/due-this-month', icon: Calendar, label: 'Due This Month', showStats: true },
  { href: '/bills', icon: CreditCard, label: 'Bills' },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export async function Sidebar() {
  const [stats, settings] = await Promise.all([
    getBillsForCurrentMonthStats(),
    SettingsService.getAll(),
  ]);

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
            {item.showStats ? (
              <div className="flex flex-col">
                <span>{item.label}</span>
                {stats.count > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {stats.count} bills - {formatMoney(stats.total, settings.currency, settings.locale)}
                    {stats.hasVariable ? ' (est.)' : ''}
                  </span>
                )}
                {stats.count === 0 && (
                  <span className="text-xs text-muted-foreground">
                    No bills
                  </span>
                )}
              </div>
            ) : (
              <span>{item.label}</span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
