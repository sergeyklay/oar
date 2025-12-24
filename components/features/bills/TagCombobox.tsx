'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';

import { cn } from '@/lib/utils';
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
import { createTag } from '@/actions/tags';
import type { Tag } from '@/lib/types';

interface TagComboboxProps {
  /** All available tags */
  availableTags: Tag[];
  /** Currently selected tag IDs */
  selectedIds: string[];
  /** Callback when selection changes */
  onChange: (ids: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * TagCombobox
 *
 * Multi-select combobox with create-on-fly capability.
 *
 * WHY CLIENT:
 * - Manages open/close state
 * - Handles async tag creation
 * - Controlled selection state
 */
export function TagCombobox({
  availableTags,
  selectedIds,
  onChange,
  placeholder = 'Select tags...',
}: TagComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [tags, setTags] = useState<Tag[]>(availableTags);
  const [isCreating, setIsCreating] = useState(false);

  // Sync tags when availableTags prop updates
  useEffect(() => {
    setTags(availableTags);
  }, [availableTags]);

  // Get selected tag objects for display
  const selectedTags = tags.filter((tag) => selectedIds.includes(tag.id));

  // Filter tags based on search
  const filteredTags = tags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches any existing tag (for create-on-fly)
  const exactMatch = tags.some(
    (tag) => tag.name.toLowerCase() === search.toLowerCase()
  );
  const showCreateOption = search.length > 0 && !exactMatch && !isCreating;

  /** Toggle tag selection */
  function handleSelect(tagId: string) {
    const newIds = selectedIds.includes(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId];
    onChange(newIds);
  }

  /** Remove tag from selection */
  function handleRemove(tagId: string) {
    onChange(selectedIds.filter((id) => id !== tagId));
  }

  /** Create new tag and select it */
  async function handleCreate() {
    if (!search.trim()) return;

    setIsCreating(true);
    try {
      const result = await createTag({ name: search.trim() });

      if (result.success && result.data) {
        const newTag: Tag = {
          id: result.data.id,
          name: result.data.name,
          slug: result.data.slug,
          createdAt: new Date(),
        };

        // Add to local tags list
        setTags((prev) => [...prev, newTag].sort((a, b) => a.name.localeCompare(b.name)));

        // Select the new tag
        onChange([...selectedIds, newTag.id]);

        // Clear search
        setSearch('');
      }
    } catch {
      // Error handling is done via toast in the form submission
      // Logger is for server-side only, client errors are handled by UI feedback
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[40px] h-auto"
          onClick={(e) => {
            // Prevent event from bubbling up to parent elements (e.g., BillRowClickable)
            e.stopPropagation();
          }}
        >
          <div className="flex flex-wrap gap-1">
            {selectedTags.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedTags.map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="mr-1"
                >
                  {tag.name}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(tag.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemove(tag.id);
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {tag.name}</span>
                  </span>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create tag..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {showCreateOption ? (
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded-sm"
                  onClick={handleCreate}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4" />
                  Create &quot;{search}&quot;
                </button>
              ) : (
                <span className="text-muted-foreground">No tags found.</span>
              )}
            </CommandEmpty>

            <CommandGroup>
              {filteredTags.map((tag) => (
                <CommandItem
                  key={tag.id}
                  value={tag.id}
                  onSelect={() => handleSelect(tag.id)}
                  onClick={(e) => {
                    // Stop propagation to prevent triggering parent click handlers
                    e.stopPropagation();
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      selectedIds.includes(tag.id) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {tag.name}
                </CommandItem>
              ))}

              {/* Show create option at bottom when there are filtered results */}
              {showCreateOption && filteredTags.length > 0 && (
                <CommandItem
                  value="__create__"
                  onSelect={handleCreate}
                  disabled={isCreating}
                  className="text-muted-foreground"
                  onClick={(e) => {
                    // Stop propagation to prevent triggering parent click handlers
                    e.stopPropagation();
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create &quot;{search}&quot;
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
