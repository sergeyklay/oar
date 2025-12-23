'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  toMajorUnits,
  toMinorUnits,
  parseMoneyInput,
  isValidMoneyInput,
  formatMoney,
} from '@/lib/money';
import { updateTransaction, type UpdateTransactionInput } from '@/actions/transactions';
import type { Transaction } from '@/lib/types';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

const formSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => isValidMoneyInput(parseMoneyInput(val)), {
      message: 'Please enter a valid amount',
    }),
  paidAt: z.date({ message: 'Please select a date' }),
  notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface PaymentDetailFormProps {
  transaction: Transaction;
  currency: string;
  locale: string;
  onUpdate: () => void;
  onDelete: () => void;
}

export function PaymentDetailForm({
  transaction,
  currency,
  locale,
  onUpdate,
  onDelete,
}: PaymentDetailFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const prevTransactionIdRef = useRef<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: toMajorUnits(transaction.amount, currency).toString(),
      paidAt: transaction.paidAt,
      notes: transaction.notes || '',
    },
  });

  // Reset form when transaction changes
  useEffect(() => {
    if (prevTransactionIdRef.current !== transaction.id) {
      form.reset({
        amount: toMajorUnits(transaction.amount, currency).toString(),
        paidAt: transaction.paidAt,
        notes: transaction.notes || '',
      });
      prevTransactionIdRef.current = transaction.id;
      // Use setTimeout to avoid calling setState synchronously in effect
      setTimeout(() => setIsEditing(false), 0);
    }
  }, [transaction, currency, form]);

  async function handleSave(values: FormValues) {
    setIsSubmitting(true);

    const amountInMinorUnits = toMinorUnits(parseMoneyInput(values.amount), currency);

    const input: UpdateTransactionInput = {
      id: transaction.id,
      amount: amountInMinorUnits,
      paidAt: values.paidAt,
      notes: values.notes,
    };

    const result = await updateTransaction(input);

    setIsSubmitting(false);

    if (result.success) {
      toast.success('Payment updated', {
        description: 'Payment record has been updated.',
      });
      setIsEditing(false);
      onUpdate();
    } else {
      toast.error('Failed to update payment', {
        description: result.error ?? 'Please try again.',
      });

      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof FormValues, {
            message: messages?.[0],
          });
        });
      }
    }
  }

  function handleCancel() {
    form.reset({
      amount: toMajorUnits(transaction.amount, currency).toString(),
      paidAt: transaction.paidAt,
      notes: transaction.notes || '',
    });
    setIsEditing(false);
  }

  async function handleDeleteConfirm() {
    onDelete();
    setDeleteDialogOpen(false);
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with buttons */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Selected Payment</h3>
          {!isEditing && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setDeleteDialogOpen(true)}
                title="Delete this payment"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </div>
          )}
        </div>

        {/* Form fields */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            {/* Payment Date */}
            <FormField
              control={form.control}
              name="paidAt"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                    <FormLabel className="text-right">Payment Date:</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'dd/MM/yyyy')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
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
                      ) : (
                        <div className="text-sm py-2">
                          {format(transaction.paidAt, 'dd/MM/yyyy')}
                        </div>
                      )}
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                    <FormLabel className="text-right">Amount:</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Input
                          {...field}
                          type="text"
                          inputMode="decimal"
                          placeholder="0.00"
                          className="w-full"
                        />
                      ) : (
                        <div className="text-sm py-2 font-mono">
                          {formatMoney(transaction.amount, currency, locale)}
                        </div>
                      )}
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Note */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <div className="grid grid-cols-[1fr_2fr] gap-4 items-center">
                    <FormLabel className="text-right">Note:</FormLabel>
                    <FormControl>
                      {isEditing ? (
                        <Textarea
                          {...field}
                          placeholder="Optional notes"
                          className="resize-none"
                          rows={2}
                        />
                      ) : (
                        <div className="text-sm py-2">
                          {transaction.notes || ''}
                        </div>
                      )}
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cancel and Save buttons (only in edit mode) */}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </form>
        </Form>
      </div>

      <DeleteConfirmationDialog
        transaction={transaction}
        currency={currency}
        locale={locale}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

