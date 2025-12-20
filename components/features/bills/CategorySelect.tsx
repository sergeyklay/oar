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
import { CategoryIcon } from './CategoryIcon';

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
 * Displays categories organized by their parent groups with icons and group names as section headers.
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
                <span className="flex items-center gap-2">
                  <CategoryIcon icon={category.icon} size={16} className="text-muted-foreground" />
                  <span>{category.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );
}

