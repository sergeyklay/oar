'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Clock } from 'lucide-react';
import { isPaymentHistorical } from '@/lib/billing-cycle';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toMajorUnits, toMinorUnits, parseMoneyInput } from '@/lib/money';
import { logPayment } from '@/actions/transactions';
import type { Bill } from '@/lib/types';

const formSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  paidAt: z.date({ message: 'Please select a date' }),
  notes: z.string().max(500).optional(),
  updateDueDate: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface LogPaymentDialogProps {
  bill: Bill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currency: string;
}

export function LogPaymentDialog({
  bill,
  open,
  onOpenChange,
  currency,
}: LogPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: toMajorUnits(bill.amountDue, currency).toString(),
      paidAt: new Date(),
      notes: '',
      updateDueDate: true,
    },
  });

  const prevOpenRef = useRef(open);

  // Reset form only when the dialog transitions from closed to open
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      form.reset({
        amount: toMajorUnits(bill.amountDue, currency).toString(),
        paidAt: new Date(),
        notes: '',
        updateDueDate: true,
      });
    }
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, bill, currency]);

  // Watch paidAt and derive historical status
  const watchedPaidAt = useWatch({ control: form.control, name: 'paidAt' });

  const isHistorical = useMemo(() => {
    if (!watchedPaidAt) return false;
    return isPaymentHistorical(
      { dueDate: bill.dueDate, frequency: bill.frequency },
      watchedPaidAt
    );
  }, [watchedPaidAt, bill.dueDate, bill.frequency]);

  // Handle dialog open state change
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    // Convert user input to integer minor units before sending to action
    const amountInMinorUnits = toMinorUnits(parseMoneyInput(values.amount));

    const result = await logPayment({
      billId: bill.id,
      amount: amountInMinorUnits,
      paidAt: values.paidAt,
      notes: values.notes,
      updateDueDate: values.updateDueDate,
    });

    setIsSubmitting(false);

    if (result.success) {
      if (result.data?.isHistorical) {
        toast.success('Historical payment logged', {
          description: `Payment for "${bill.title}" has been recorded without changing the due date.`,
        });
      } else {
        toast.success('Payment logged', {
          description: `Payment for "${bill.title}" has been recorded.`,
        });
      }
      handleOpenChange(false);
    } else {
      toast.error('Failed to log payment', {
        description: result.error ?? 'Please try again.',
      });

      // Set field-level errors if any
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, {
            message: messages?.[0],
          });
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Log Payment</DialogTitle>
          <DialogDescription>
            Record a payment for &ldquo;{bill.title}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Amount Field */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Picker */}
            <FormField
              control={form.control}
              name="paidAt"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Confirmation #12345"
                      className="resize-none"
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Historical Payment Banner */}
            {isHistorical && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3">
                <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-amber-500">
                    Historical payment
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This payment will be recorded without changing the due date.
                  </p>
                </div>
              </div>
            )}

            {/* Update Due Date Toggle - Hidden for historical payments */}
            {!isHistorical && (
              <FormField
                control={form.control}
                name="updateDueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Update Due Date</FormLabel>
                      <FormDescription>
                        Turn off to log a partial payment without advancing the
                        billing cycle.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Log Payment
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
