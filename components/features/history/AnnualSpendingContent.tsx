import { AnnualSpendingInteractive } from './AnnualSpendingInteractive';
import { getAnnualSpendingData } from '@/actions/history';
import { HistoryService } from '@/lib/services/HistoryService';

interface AnnualSpendingContentProps {
  year: string;
  currency: string;
  locale: string;
}

/**
 * AnnualSpendingContent
 *
 * Server Component that fetches and displays annual spending data.
 * Wrapped in Suspense for loading states.
 *
 * Render Mode: Server Component (fetches data, renders UI)
 */
export async function AnnualSpendingContent({
  year,
  currency,
  locale,
}: AnnualSpendingContentProps) {
  const result = await getAnnualSpendingData({ year });

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg text-muted-foreground">
          {result.error ?? 'Failed to load annual spending data'}
        </p>
      </div>
    );
  }

  const data = result.data ?? [];
  const summary = HistoryService.calculateAnnualSummary(data);

  return (
    <AnnualSpendingInteractive
      data={data}
      summary={summary}
      currency={currency}
      locale={locale}
      year={year}
    />
  );
}

