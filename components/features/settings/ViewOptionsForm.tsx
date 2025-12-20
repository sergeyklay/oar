'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { updateViewOptions } from '@/actions/settings';
import {
  CURRENCY_OPTIONS,
  LOCALE_OPTIONS,
  WEEK_START_OPTIONS,
} from '@/lib/constants';

type FieldKey = 'currency' | 'locale' | 'weekStart';

interface ViewOptionsFormProps {
  initialCurrency: string;
  initialLocale: string;
  initialWeekStart: number;
}

/**
 * Client component for editing view options settings.
 * Handles currency, locale, and week start day preferences.
 */
export function ViewOptionsForm({
  initialCurrency,
  initialLocale,
  initialWeekStart,
}: ViewOptionsFormProps) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [locale, setLocale] = useState(initialLocale);
  const [weekStart, setWeekStart] = useState(String(initialWeekStart));
  const [isPending, startTransition] = useTransition();
  const [updatingField, setUpdatingField] = useState<FieldKey | null>(null);

  const handleUpdate = (field: FieldKey, value: string) => {
    const newCurrency = field === 'currency' ? value : currency;
    const newLocale = field === 'locale' ? value : locale;
    const newWeekStart = field === 'weekStart' ? value : weekStart;

    if (field === 'currency') setCurrency(value);
    if (field === 'locale') setLocale(value);
    if (field === 'weekStart') setWeekStart(value);

    setUpdatingField(field);

    startTransition(async () => {
      const result = await updateViewOptions({
        currency: newCurrency,
        locale: newLocale,
        weekStart: parseInt(newWeekStart, 10),
      });

      setUpdatingField(null);

      if (!result.success) {
        toast.error('Failed to update setting', {
          description: result.error || 'Please try again.',
        });
        if (field === 'currency') setCurrency(initialCurrency);
        if (field === 'locale') setLocale(initialLocale);
        if (field === 'weekStart') setWeekStart(String(initialWeekStart));
      }
    });
  };

  const isCurrencyUpdating = isPending && updatingField === 'currency';
  const isLocaleUpdating = isPending && updatingField === 'locale';
  const isWeekStartUpdating = isPending && updatingField === 'weekStart';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="currency-select">Default Currency</Label>
        <Select
          value={currency}
          onValueChange={(value) => handleUpdate('currency', value)}
          disabled={isPending}
        >
          <SelectTrigger id="currency-select" className="w-[200px]">
            <SelectValue>
              {isCurrencyUpdating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                CURRENCY_OPTIONS.find((c) => c.code === currency)?.label ?? currency
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {CURRENCY_OPTIONS.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id="currency-description" className="text-xs text-muted-foreground">
          Default currency for new bills and reports
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locale-select">Default Locale</Label>
        <Select
          value={locale}
          onValueChange={(value) => handleUpdate('locale', value)}
          disabled={isPending}
        >
          <SelectTrigger id="locale-select" className="w-[250px]">
            <SelectValue>
              {isLocaleUpdating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                LOCALE_OPTIONS.find((l) => l.code === locale)?.label ?? locale
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {LOCALE_OPTIONS.map((option) => (
              <SelectItem key={option.code} value={option.code}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id="locale-description" className="text-xs text-muted-foreground">
          Format for dates, numbers, and currency display
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weekstart-select">Start of Week</Label>
        <Select
          value={weekStart}
          onValueChange={(value) => handleUpdate('weekStart', value)}
          disabled={isPending}
        >
          <SelectTrigger id="weekstart-select" className="w-[200px]">
            <SelectValue>
              {isWeekStartUpdating ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Updating...
                </span>
              ) : (
                WEEK_START_OPTIONS.find((w) => w.value === parseInt(weekStart, 10))
                  ?.label ?? weekStart
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {WEEK_START_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id="weekstart-description" className="text-xs text-muted-foreground">
          Sets the first day of the week in the calendar
        </p>
      </div>
    </div>
  );
}

