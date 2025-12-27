'use client';

import { useQueryState } from 'nuqs';
import { Triangle } from 'lucide-react';
import { cn, getCurrentYear } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';

const navButtonClass = cn(
  buttonVariants({ variant: 'ghost' }),
  'h-4 w-4 p-0 opacity-50 hover:opacity-100 cursor-pointer inline-flex items-center justify-center [&_svg]:size-3'
);

interface YearNavigationProps {
  /** Current year in YYYY format */
  currentYear: string;
}

/**
 * YearNavigation
 *
 * Navigation arrows for year selection in annual spending view.
 * Updates URL search param via nuqs to trigger server refetch.
 */
export function YearNavigation({ currentYear }: YearNavigationProps) {
  const [, setYear] = useQueryState('year', {
    defaultValue: getCurrentYear(),
    shallow: false,
  });

  const handlePreviousYear = () => {
    const yearNum = parseInt(currentYear, 10);
    const prevYearStr = (yearNum - 1).toString();
    setYear(prevYearStr);
  };

  const handleNextYear = () => {
    const yearNum = parseInt(currentYear, 10);
    const nextYearStr = (yearNum + 1).toString();
    setYear(nextYearStr);
  };

  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        className={navButtonClass}
        onClick={handlePreviousYear}
        aria-label="Previous year"
      >
        <Triangle className="h-2.5 w-2.5 fill-current -rotate-90" />
      </button>
      <button
        type="button"
        className={navButtonClass}
        onClick={handleNextYear}
        aria-label="Next year"
      >
        <Triangle className="h-2.5 w-2.5 fill-current rotate-90" />
      </button>
    </div>
  );
}

