'use client';

import { useActionState, useEffect, useRef, useState, startTransition } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { updateViewOptions } from '@/actions/settings';
import {
  CURRENCY_OPTIONS,
  LOCALE_OPTIONS,
  WEEK_START_OPTIONS,
} from '@/lib/constants';

type FieldKey = 'currency' | 'locale' | 'weekStart' | 'includeAutoPayInDueSoon';

interface ViewOptionsFormProps {
  initialCurrency: string;
  initialLocale: string;
  initialWeekStart: number;
  initialIncludeAutoPayInDueSoon: boolean;
}

interface ViewOptionsState {
  currency: string;
  locale: string;
  weekStart: number;
  includeAutoPayInDueSoon: boolean;
  error: string | null;
}

interface UpdatePayload {
  field: FieldKey;
  value: string;
}

/**
 * Client component for editing view options settings.
 * Handles currency, locale, and week start day preferences.
 */
export function ViewOptionsForm({
  initialCurrency,
  initialLocale,
  initialWeekStart,
  initialIncludeAutoPayInDueSoon,
}: ViewOptionsFormProps) {
  const [updatingField, setUpdatingField] = useState<FieldKey | null>(null);

  const updateAction = async (
    prevState: ViewOptionsState,
    payload: UpdatePayload
  ): Promise<ViewOptionsState> => {
    const { field, value } = payload;
    const newCurrency = field === 'currency' ? value : prevState.currency;
    const newLocale = field === 'locale' ? value : prevState.locale;
    const newWeekStart = field === 'weekStart' ? parseInt(value, 10) : prevState.weekStart;
    const newIncludeAutoPayInDueSoon =
      field === 'includeAutoPayInDueSoon' ? value === 'true' : prevState.includeAutoPayInDueSoon;

    const result = await updateViewOptions({
      currency: newCurrency,
      locale: newLocale,
      weekStart: newWeekStart,
      includeAutoPayInDueSoon: newIncludeAutoPayInDueSoon,
    });

    if (!result.success) {
      return {
        ...prevState,
        error: result.error || 'Failed to update setting',
      };
    }

    return {
      currency: newCurrency,
      locale: newLocale,
      weekStart: newWeekStart,
      includeAutoPayInDueSoon: newIncludeAutoPayInDueSoon,
      error: null,
    };
  };

  const [state, updateOptions, isPending] = useActionState(updateAction, {
    currency: initialCurrency,
    locale: initialLocale,
    weekStart: initialWeekStart,
    includeAutoPayInDueSoon: initialIncludeAutoPayInDueSoon,
    error: null,
  });

  const prevStateRef = useRef(state);
  const prevPendingRef = useRef(isPending);

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = state;

    if (state.error && !prevState.error) {
      toast.error('Failed to update setting', {
        description: state.error,
      });
    }
  }, [state]);

  // Clear updatingField when async action completes
  // This is necessary to synchronize React state with async operation completion.
  // The alternative would require significant component restructuring.
  useEffect(() => {
    const wasPending = prevPendingRef.current;
    prevPendingRef.current = isPending;

    if (wasPending && !isPending) {
      // Necessary to clear state when async operation completes
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUpdatingField(null);
    }
  }, [isPending]);

  const handleUpdate = (field: FieldKey, value: string) => {
    setUpdatingField(field);
    startTransition(() => {
      updateOptions({ field, value });
    });
  };

  const isCurrencyUpdating = isPending && updatingField === 'currency';
  const isLocaleUpdating = isPending && updatingField === 'locale';
  const isWeekStartUpdating = isPending && updatingField === 'weekStart';
  const isIncludeAutoPayInDueSoonUpdating =
    isPending && updatingField === 'includeAutoPayInDueSoon';

  return (
    <div className="space-y-6">
      <FormItem>
        <Label htmlFor="currency-select">Default Currency</Label>
        <Select
          value={state.currency}
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
                CURRENCY_OPTIONS.find((c) => c.code === state.currency)?.label ?? state.currency
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
      </FormItem>

      <FormItem>
        <Label htmlFor="locale-select">Default Locale</Label>
        <Select
          value={state.locale}
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
                LOCALE_OPTIONS.find((l) => l.code === state.locale)?.label ?? state.locale
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
      </FormItem>

      <FormItem>
        <Label htmlFor="weekstart-select">Start of Week</Label>
        <Select
          value={String(state.weekStart)}
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
                WEEK_START_OPTIONS.find((w) => w.value === state.weekStart)
                  ?.label ?? String(state.weekStart)
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
      </FormItem>

      <FormItem>
        <Label htmlFor="include-autopay-toggle">Include automatic bills in bills due soon</Label>
        <div className="flex items-center gap-2">
          <Switch
            id="include-autopay-toggle"
            checked={state.includeAutoPayInDueSoon}
            onCheckedChange={(checked) =>
              handleUpdate('includeAutoPayInDueSoon', String(checked))
            }
            disabled={isPending}
          />
          {isIncludeAutoPayInDueSoonUpdating && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>
        <p id="include-autopay-description" className="text-xs text-muted-foreground">
          Show automatic bills in Due Soon and Due This Month views
        </p>
      </FormItem>
    </div>
  );
}

