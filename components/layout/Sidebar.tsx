import Link from 'next/link';
import { Home, CreditCard, TrendingUp, Settings, Calendar } from 'lucide-react';
import { getBillsForCurrentMonthStats, getAllBillsStats } from '@/actions/bills';
import { SettingsService } from '@/lib/services/SettingsService';
import { formatMoney } from '@/lib/money';

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  showStats?: boolean;
  statsType?: 'all' | 'currentMonth';
};

function renderStatsSubtitle(
  item: NavItem,
  currentMonthStats: { count: number; total: number; hasVariable: boolean },
  allBillsStats: { count: number },
  settings: { currency: string; locale: string }
): React.ReactNode {
  if (!item.showStats || !item.statsType) {
    return null;
  }

  if (item.statsType === 'currentMonth') {
    if (currentMonthStats.count === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          No bills
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        {currentMonthStats.count} bills - {formatMoney(currentMonthStats.total, settings.currency, settings.locale)}
        {currentMonthStats.hasVariable ? ' (est.)' : ''}
      </span>
    );
  }

  if (item.statsType === 'all') {
    if (allBillsStats.count === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          No bills
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        {allBillsStats.count} bills
      </span>
    );
  }

  return null;
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Overview', showStats: true, statsType: 'all' as const },
  { href: '/due-this-month', icon: Calendar, label: 'Due This Month', showStats: true, statsType: 'currentMonth' as const },
  { href: '/bills', icon: CreditCard, label: 'Bills' },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export async function Sidebar() {
  const [currentMonthStats, allBillsStats, settings] = await Promise.all([
    getBillsForCurrentMonthStats(),
    getAllBillsStats(),
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
                {renderStatsSubtitle(item, currentMonthStats, allBillsStats, settings)}
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
