import Link from 'next/link';
import { LayoutDashboard, TrendingUp, Settings, Calendar, Bell, CheckCircle } from 'lucide-react';
import { getBillsForCurrentMonthStats, getAllBillsStats, getBillsForDueSoonStats } from '@/actions/bills';
import { getRecentPaymentsStats } from '@/actions/transactions';
import { SettingsService } from '@/lib/services/SettingsService';
import { formatMoney } from '@/lib/money';

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  showStats?: boolean;
  statsType?: 'all' | 'currentMonth' | 'dueSoon' | 'paidRecently';
};

/**
 * Return a React node showing statistics subtitle for a navigation item.
 *
 * Renders count-only subtitle for "all bills" stats, count + total for bills views,
 * and payment count + total for "paid recently" view.
 * Returns null if the item does not have stats enabled or has invalid statsType.
 *
 * @param item - The navigation item to render the stats for
 * @param currentMonthStats - The statistics for the current month
 * @param allBillsStats - The statistics for all bills
 * @param dueSoonStats - The statistics for bills due soon
 * @param paidRecentlyStats - The statistics for paid recently
 * @param settings - The settings for the application
 * @returns A React node showing the statistics subtitle
 */
function renderStatsSubtitle(
  item: NavItem,
  currentMonthStats: { count: number; total: number; hasVariable: boolean },
  allBillsStats: { count: number },
  dueSoonStats: { count: number; total: number; hasVariable: boolean },
  paidRecentlyStats: { count: number; total: number },
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

  if (item.statsType === 'dueSoon') {
    if (dueSoonStats.count === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          No bills
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        {dueSoonStats.count} bills - {formatMoney(dueSoonStats.total, settings.currency, settings.locale)}
        {dueSoonStats.hasVariable ? ' (est.)' : ''}
      </span>
    );
  }

  if (item.statsType === 'paidRecently') {
    if (paidRecentlyStats.count === 0) {
      return (
        <span className="text-xs text-muted-foreground">
          No payments
        </span>
      );
    }
    return (
      <span className="text-xs text-muted-foreground">
        {paidRecentlyStats.count} payments - {formatMoney(paidRecentlyStats.total, settings.currency, settings.locale)}
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
  { href: '/', icon: LayoutDashboard, label: 'Overview', showStats: true, statsType: 'all' as const },
  { href: '/due-soon', icon: Bell, label: 'Due Soon', showStats: true, statsType: 'dueSoon' as const },
  { href: '/due-this-month', icon: Calendar, label: 'Due This Month', showStats: true, statsType: 'currentMonth' as const },
  { href: '/paid-recently', icon: CheckCircle, label: 'Paid Recently', showStats: true, statsType: 'paidRecently' as const },
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export async function Sidebar() {
  const [currentMonthStats, allBillsStats, dueSoonStats, paidRecentlyStats, settings] = await Promise.all([
    getBillsForCurrentMonthStats(),
    getAllBillsStats(),
    getBillsForDueSoonStats(),
    getRecentPaymentsStats(),
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
                {renderStatsSubtitle(item, currentMonthStats, allBillsStats, dueSoonStats, paidRecentlyStats, settings)}
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
