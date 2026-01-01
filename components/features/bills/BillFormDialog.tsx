'use client';

import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClientDate } from '@/components/ui/client-date';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { Toggle } from '@/components/common/Toggle';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  createBill,
  updateBill,
  getBillTags,
  getBillCategory,
  type CreateBillInput,
  type UpdateBillInput,
} from '@/actions/bills';
import { useAsyncAction } from '@/lib/hooks/useAsyncAction';
import { isValidMoneyInput, parseMoneyInput, toMajorUnits } from '@/lib/money';
import type { Bill, Tag, BillCategoryGroupWithCategories, BillFrequency } from '@/lib/types';
import { FREQUENCY_DISPLAY_LABELS } from '@/lib/constants';
import { TagCombobox } from './TagCombobox';
import { CategorySelect } from './CategorySelect';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => isValidMoneyInput(parseMoneyInput(val)), {
      message: 'Please enter a valid amount',
    }),
  dueDate: z.date({ message: 'Due date is required' }),
  frequency: z.enum([
    'once',
    'weekly',
    'biweekly',
    'twicemonthly',
    'monthly',
    'bimonthly',
    'quarterly',
    'yearly'
  ]),
  isAutoPay: z.boolean(),
  isVariable: z.boolean(),
  categoryId: z.string().min(1, 'Category is required'),
  tagIds: z.array(z.string()),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less'),
  weekendAdjustment: z
    .enum(['unchanged', 'next_business_day', 'previous_business_day'])
    .optional()
    .nullable(),
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
  /** Category groups with nested categories for dropdown */
  categoriesGrouped: BillCategoryGroupWithCategories[];
  /** Default category ID for new bills (null if no categories exist) */
  defaultCategoryId: string | null;
}

/**
 * Render a dialog containing a form to create a new bill or edit an existing bill.
 *
 * @param bill - Optional bill to edit; when provided the form is populated for editing.
 * @param open - Controls whether the dialog is open.
 * @param onOpenChange - Callback invoked with the new open state when the dialog is opened or closed.
 * @param currencySymbol - Currency symbol displayed next to the amount field (default: `"zł"`).
 * @param availableTags - List of tags available for selection in the tags combobox.
 * @param categoriesGrouped - Grouped category data used by the category selector.
 * @param defaultCategoryId - Optional default category id used when creating a new bill.
 * @returns The dialog JSX element that manages form state, validation, and submission for creating or updating a bill.
 */
export function BillFormDialog({
  bill,
  open,
  onOpenChange,
  currencySymbol = 'zł',
  availableTags = [],
  categoriesGrouped,
  defaultCategoryId,
}: BillFormDialogProps) {
  const isEditMode = !!bill;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: '',
      frequency: 'monthly',
      isAutoPay: false,
      isVariable: false,
      categoryId: defaultCategoryId ?? '',
      tagIds: [],
      notes: '',
      weekendAdjustment: null,
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
          categoryId: defaultCategoryId ?? '',
          tagIds: [],
          notes: bill.notes || '',
          weekendAdjustment: bill.weekendAdjustment ?? null,
        });

        // Fetch existing tags for this bill
        getBillTags(bill.id).then((result) => {
          if (result.success && result.data) {
            form.setValue('tagIds', result.data.map((t) => t.id));
          }
        });

        // Fetch existing category for this bill
        getBillCategory(bill.id).then((result) => {
          if (result.success && result.data) {
            form.setValue('categoryId', result.data);
          }
        });
      } else {
        form.reset({
          title: '',
          amount: '',
          frequency: 'monthly',
          isAutoPay: false,
          isVariable: false,
          categoryId: defaultCategoryId ?? '',
          tagIds: [],
          notes: '',
          dueDate: undefined,
          weekendAdjustment: null,
        });
      }
    }
  }, [bill, open, form, defaultCategoryId]);

  const submittedValuesRef = useRef<FormValues | null>(null);

  const { execute, isPending: isSubmitting } = useAsyncAction({
    action: (values: FormValues) => {
      const baseInput = {
        ...values,
        amount: parseMoneyInput(values.amount),
        weekendAdjustment: values.weekendAdjustment,
      };

      return isEditMode
        ? updateBill({ ...baseInput, id: bill.id } as UpdateBillInput)
        : createBill(baseInput as CreateBillInput);
    },
    showSuccessToast: false,
    errorMessage: isEditMode ? 'Failed to update bill' : 'Failed to create bill',
    onSuccess: () => {
      const values = submittedValuesRef.current;
      if (values) {
        toast.success(isEditMode ? 'Bill updated' : 'Bill created', {
          description: `"${values.title}" has been ${isEditMode ? 'updated' : 'created'}.`,
        });
      }
      form.reset();
      onOpenChange(false);
      submittedValuesRef.current = null;
    },
    onError: (error, result) => {
      const resultWithFieldErrors = result as typeof result & {
        fieldErrors?: Record<string, string[]>;
      };
      if (resultWithFieldErrors.fieldErrors) {
        Object.entries(resultWithFieldErrors.fieldErrors).forEach(([field, errors]) => {
          if (errors?.[0]) {
            form.setError(field as keyof FormValues, { message: errors[0] });
          }
        });
      }
      submittedValuesRef.current = null;
    },
  });

  async function onSubmit(values: FormValues) {
    submittedValuesRef.current = values;
    await execute(values);
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
          {/* eslint-disable-next-line react-hooks/refs */}
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
                <FormItem>
                  <FormControl>
                    <Toggle
                      id="isVariable"
                      label="Variable amount"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <CategorySelect
                      categoriesGrouped={categoriesGrouped}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Select category"
                    />
                  </FormControl>
                  <FormMessage />
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
                            <ClientDate date={field.value} format="MMM d, yyyy" />
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
                  <FormLabel>Repeat Interval</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select repeat interval" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        [
                          'weekly',
                          'biweekly',
                          'twicemonthly',
                          'monthly',
                          'bimonthly',
                          'quarterly',
                          'yearly',
                          'once',
                        ] as BillFrequency[]
                      ).map((freq) => (
                        <SelectItem key={freq} value={freq}>
                          {FREQUENCY_DISPLAY_LABELS[freq]}
                        </SelectItem>
                      ))}
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
                <FormItem>
                  <FormControl>
                    <Toggle
                      id="isAutoPay"
                      label="Auto-Pay Enabled"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
              name="weekendAdjustment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>If due date falls on weekend</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value === 'use-global' ? null : value);
                    }}
                    value={field.value ?? 'use-global'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="use-global">Use global default</SelectItem>
                      <SelectItem value="unchanged">Leave Unchanged</SelectItem>
                      <SelectItem value="next_business_day">Move to Next Business Day</SelectItem>
                      <SelectItem value="previous_business_day">Move to Previous Business Day</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose how to handle this bill when its due date falls on a weekend.
                  </p>
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
