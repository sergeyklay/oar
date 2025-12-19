'use client';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { BillCategoryGroupWithCategories } from '@/lib/types';

interface CategorySelectProps {
  categoriesGrouped: BillCategoryGroupWithCategories[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Grouped category dropdown for bill categorization.
 *
 * Displays categories organized by their parent groups with group names as section headers.
 */
export function CategorySelect({
  categoriesGrouped,
  value,
  onValueChange,
  placeholder = 'Select category',
  disabled = false,
}: CategorySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {categoriesGrouped.map((group) => (
          <SelectGroup key={group.id}>
            <SelectLabel className="text-xs text-muted-foreground">
              {group.name}
            </SelectLabel>
            {group.categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

