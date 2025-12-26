'use client';

import { useQueryState } from 'nuqs';
import { Filter, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { calendarSearchParams } from '@/lib/search-params';
import type { Tag } from '@/lib/types';

interface TagFilterProps {
  /** All available tags */
  tags: Tag[];
}

/**
 * TagFilter
 *
 * Dropdown filter for dashboard header.
 * Updates URL search params via nuqs.
 */
export function TagFilter({ tags }: TagFilterProps) {
  const [selectedTag, setSelectedTag] = useQueryState(
    'tag',
    calendarSearchParams.tag.withOptions({ shallow: false })
  );

  const activeTag = tags.find((t) => t.slug === selectedTag);

  function handleSelect(slug: string) {
    setSelectedTag(slug === selectedTag ? null : slug);
  }

  function handleClear() {
    setSelectedTag(null);
  }

  // Don't render if there are no tags
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9">
            <Filter className="mr-2 h-4 w-4" />
            {activeTag ? activeTag.name : 'All Bills'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="end">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag.id}
                    value={tag.slug}
                    onSelect={() => handleSelect(tag.slug)}
                  >
                    {tag.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Active filter badge */}
      {activeTag && (
        <Badge variant="secondary" className="gap-1">
          {activeTag.name}
          <button
            type="button"
            onClick={handleClear}
            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear filter</span>
          </button>
        </Badge>
      )}
    </div>
  );
}
