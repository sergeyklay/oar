'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  createBill,
  updateBill,
  getBillTags,
  type CreateBillInput,
  type UpdateBillInput,
} from '@/actions/bills';
import { isValidMoneyInput, parseMoneyInput, toMajorUnits } from '@/lib/money';
import type { Bill, Tag } from '@/lib/types';
import { TagCombobox } from './TagCombobox';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => isValidMoneyInput(parseMoneyInput(val)), {
      message: 'Please enter a valid amount',
    }),
  dueDate: z.date({ message: 'Due date is required' }),
  frequency: z.enum(['once', 'monthly', 'yearly']),
  isAutoPay: z.boolean(),
  isVariable: z.boolean(),
  tagIds: z.array(z.string()),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less'),
});

type FormValues = z.infer<typeof formSchema>;

interface BillFormDialogProps {
  /** When provided, dialog operates in Edit mode */
  bill?: Bill;
  /** Controlled open state */
  open: boolean;
  /** Controlled state callback */
  onOpenChange: (open: boolean) => void;
  /** Currency symbol for display */
  currencySymbol?: string;
  /** All available tags for the combobox */
  availableTags?: Tag[];
}

export function BillFormDialog({
  bill,
  open,
  onOpenChange,
  currencySymbol = 'zł',
  availableTags = [],
}: BillFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!bill;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: '',
      frequency: 'monthly',
      isAutoPay: false,
      isVariable: false,
      tagIds: [],
      notes: '',
    },
  });

  // Reset form when bill prop changes (for edit mode) or dialog opens
  useEffect(() => {
    if (open) {
      if (bill) {
        // Reset form with bill data
        form.reset({
          title: bill.title,
          amount: toMajorUnits(bill.amount).toString(),
          dueDate: bill.dueDate,
          frequency: bill.frequency,
          isAutoPay: bill.isAutoPay,
          isVariable: bill.isVariable,
          tagIds: [],
          notes: bill.notes || '',
        });

        // Fetch existing tags for this bill
        getBillTags(bill.id).then((result) => {
          if (result.success && result.data) {
            form.setValue('tagIds', result.data.map((t) => t.id));
          }
        });
      } else {
        form.reset({
          title: '',
          amount: '',
          frequency: 'monthly',
          isAutoPay: false,
          isVariable: false,
          tagIds: [],
          notes: '',
          dueDate: undefined,
        });
      }
    }
  }, [bill, open, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);

    try {
      const baseInput = {
        ...values,
        amount: parseMoneyInput(values.amount),
      };

      const result = isEditMode
        ? await updateBill({ ...baseInput, id: bill.id } as UpdateBillInput)
        : await createBill(baseInput as CreateBillInput);

      if (result.success) {
        form.reset();
        onOpenChange(false);
      } else if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, errors]) => {
          if (errors?.[0]) {
            form.setError(field as keyof FormValues, { message: errors[0] });
          }
        });
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} bill:`, error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Bill' : 'Add New Bill'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details of your bill.'
              : 'Enter the details of your recurring or one-time bill.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Netflix, Electric Bill..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Due ({currencySymbol})</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="49.99"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isVariable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Variable amount</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
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
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">One-time</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAutoPay"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Auto-Pay Enabled</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <TagCombobox
                      availableTags={availableTags}
                      selectedIds={field.value ?? []}
                      onChange={field.onChange}
                      placeholder="Add tags..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional information about this bill..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? 'Updating...' : 'Saving...'}
                </>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Save Bill'
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

