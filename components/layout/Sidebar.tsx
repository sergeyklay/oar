import { LayoutDashboard, TrendingUp, Settings, Calendar, Bell, CheckCircle, Archive, History } from 'lucide-react';
import { getBillsForCurrentMonthStats, getAllBillsStats, getBillsForDueSoonStats, getArchivedBillsStats } from '@/actions/bills';
import { getRecentPaymentsStats } from '@/actions/transactions';
import { SettingsService } from '@/lib/services/SettingsService';
import { formatMoney } from '@/lib/money';
import { NavLink } from './NavLink';

/**
 * Configuration for a sidebar navigation item.
 */
type NavItem = {
  /** Target URL path for the navigation link. */
  href: string;
  /** Lucide icon component to display alongside the label. */
  icon: React.ComponentType<{ className?: string }>;
  /** Display text for the navigation item. */
  label: string;
  /** Whether to show statistics subtitle below the label. */
  showStats?: boolean;
  /** Type of statistics to display when showStats is true. */
  statsType?: 'all' | 'currentMonth' | 'dueSoon' | 'paidRecently' | 'archived';
};

/**
 * Aggregated statistics data for sidebar navigation items.
 */
type StatsData = {
  /** Bills due in the current month with total amount. */
  currentMonth: { count: number; total: number; hasVariable: boolean };
  /** Total count of all active bills. */
  all: { count: number };
  /** Bills due soon with total amount. */
  dueSoon: { count: number; total: number; hasVariable: boolean };
  /** Recently paid transactions with total amount. */
  paidRecently: { count: number; total: number };
  /** Archived bills count. */
  archived: { count: number };
  /** User settings for currency formatting. */
  settings: { currency: string; locale: string };
};

/**
 * Generate stats subtitle text for a navigation item.
 *
 * Formats bill/payment counts and totals based on the item's statsType.
 * Returns null if the item has no stats configured.
 *
 * @param item - Navigation item configuration.
 * @param stats - Aggregated statistics data.
 * @returns Formatted subtitle string or null if stats not enabled.
 */
function getStatsSubtitle(item: NavItem, stats: StatsData): string | null {
  if (!item.showStats || !item.statsType) {
    return null;
  }

  const { currentMonth, all, dueSoon, paidRecently, archived, settings } = stats;

  if (item.statsType === 'currentMonth') {
    if (currentMonth.count === 0) return 'No bills';
    const amount = formatMoney(currentMonth.total, settings.currency, settings.locale);
    return `${currentMonth.count} bills - ${amount}${currentMonth.hasVariable ? ' (est.)' : ''}`;
  }

  if (item.statsType === 'dueSoon') {
    if (dueSoon.count === 0) return 'No bills';
    const amount = formatMoney(dueSoon.total, settings.currency, settings.locale);
    return `${dueSoon.count} bills - ${amount}${dueSoon.hasVariable ? ' (est.)' : ''}`;
  }

  if (item.statsType === 'paidRecently') {
    if (paidRecently.count === 0) return 'No payments';
    const amount = formatMoney(paidRecently.total, settings.currency, settings.locale);
    return `${paidRecently.count} payments - ${amount}`;
  }

  if (item.statsType === 'all') {
    if (all.count === 0) return 'No bills';
    return `${all.count} bills`;
  }

  if (item.statsType === 'archived') {
    if (archived.count === 0) return 'No bills';
    return `${archived.count} bills`;
  }

  return null;
}

const billsNavItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Overview', showStats: true, statsType: 'all' },
  { href: '/due-soon', icon: Bell, label: 'Due Soon', showStats: true, statsType: 'dueSoon' },
  { href: '/due-this-month', icon: Calendar, label: 'Due This Month', showStats: true, statsType: 'currentMonth' },
  { href: '/paid-recently', icon: CheckCircle, label: 'Paid Recently', showStats: true, statsType: 'paidRecently' },
];

const reportsNavItems: NavItem[] = [
  { href: '/forecast', icon: TrendingUp, label: 'Forecast' },
  { href: '/monthly-history', icon: History, label: 'Monthly History' },
  { href: '/annual-spending', icon: History, label: 'Annual Spending' },
  { href: '/archive', icon: Archive, label: 'Archive', showStats: true, statsType: 'archived' },
];

const settingsItem: NavItem = {
  href: '/settings',
  icon: Settings,
  label: 'Settings',
};

/**
 * Render navigation link content with icon and optional stats subtitle.
 *
 * Displays the nav item's icon and label. When statsSubtitle is provided,
 * renders it below the label in a smaller, muted style.
 *
 * @param props.item - Navigation item configuration with icon and label.
 * @param props.statsSubtitle - Optional subtitle text showing counts/totals.
 */
function NavLinkContent({
  item,
  statsSubtitle,
}: {
  item: NavItem;
  statsSubtitle: string | null;
}) {
  const Icon = item.icon;
  return (
    <>
      <Icon className="h-5 w-5 shrink-0" />
      {statsSubtitle ? (
        <div className="flex flex-col">
          <span>{item.label}</span>
          <span className="nav-subtitle text-xs text-muted-foreground">
            {statsSubtitle}
          </span>
        </div>
      ) : (
        <span>{item.label}</span>
      )}
    </>
  );
}

/**
 * Sidebar navigation component with grouped menu items.
 *
 * Fetches bill and payment statistics server-side and displays navigation
 * links organized into Bills, Reports, and Settings sections.
 * Settings link is pinned to the bottom of the sidebar.
 */
export async function Sidebar() {
  const [currentMonthStats, allBillsStats, dueSoonStats, paidRecentlyStats, archivedBillsStats, settings] = await Promise.all([
    getBillsForCurrentMonthStats(),
    getAllBillsStats(),
    getBillsForDueSoonStats(),
    getRecentPaymentsStats(),
    getArchivedBillsStats(),
    SettingsService.getAll(),
  ]);

  const stats: StatsData = {
    currentMonth: currentMonthStats,
    all: allBillsStats,
    dueSoon: dueSoonStats,
    paidRecently: paidRecentlyStats,
    archived: archivedBillsStats,
    settings,
  };

  return (
    <aside className="sidebar bg-card flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-border shrink-0">
        <span className="text-xl font-bold tracking-tight">
          ⛵ Oar
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col flex-1 p-4">
        {/* Bills Group */}
        <div>
          <div className="px-3 pt-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Bills
          </div>
          <div className="flex flex-col gap-1">
            {billsNavItems.map((item) => {
              const statsSubtitle = getStatsSubtitle(item, stats);
              return (
                <NavLink key={item.href} href={item.href} hasStats={!!statsSubtitle}>
                  <NavLinkContent item={item} statsSubtitle={statsSubtitle} />
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Reports Group */}
        <div className="mt-6">
          <div className="px-3 pt-2 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
            Reports
          </div>
          <div className="flex flex-col gap-1">
            {reportsNavItems.map((item) => {
              const statsSubtitle = getStatsSubtitle(item, stats);
              return (
                <NavLink key={item.href} href={item.href} hasStats={!!statsSubtitle}>
                  <NavLinkContent item={item} statsSubtitle={statsSubtitle} />
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Settings - Sticky to Bottom */}
        <div className="mt-auto pt-4">
          <NavLink href={settingsItem.href}>
            <NavLinkContent item={settingsItem} statsSubtitle={null} />
          </NavLink>
        </div>
      </nav>
    </aside>
  );
}
