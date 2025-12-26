'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { CategoryIcon } from './CategoryIcon';
import { searchBills, type BillSearchResult } from '@/actions/bills';
import { cn } from '@/lib/utils';

interface BillSearchProps {
  /** Optional className for styling */
  className?: string;
}

/**
 * BillSearch
 *
 * Search component for finding bills by title.
 * Displays a dropdown with matching results and navigates to the appropriate page when a result is selected.
 */
export function BillSearch({ className }: BillSearchProps) {
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');
  const [results, setResults] = useState<BillSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear results when input is less than 3 characters
  useEffect(() => {
    if (inputValue.length < 3) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Need to clear state when input is too short
      setResults([]);
      setIsOpen(false);
    }
  }, [inputValue]);

  // Debounced search effect
  useEffect(() => {
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If input is less than 3 characters, skip search
    if (inputValue.length < 3) {
      return;
    }

    // Debounce search by 300ms
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await searchBills({ query: inputValue });

        if (response.success && response.data && response.data.length > 0) {
          setResults(response.data);
          setIsOpen(true);
        } else {
          if (response.error) {
            toast.error(response.error);
          }
          setResults([]);
          setIsOpen(false);
        }
      } catch {
        toast.error('Failed to search bills');
        setResults([]);
        setIsOpen(false);
      }
    }, 300);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  function handleResultClick(result: BillSearchResult) {
    // Determine target route based on archived status
    const targetRoute = result.isArchived ? '/archive' : '/';
    const url = `${targetRoute}?selectedBill=${result.id}`;

    // Navigate to the route with selectedBill query param
    router.push(url);

    // Clear input and results, close dropdown
    setInputValue('');
    setResults([]);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 w-100 pl-9"
        />
      </div>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-[400px] border bg-popover text-popover-foreground shadow-md rounded-none">
          <div className="max-h-[300px] overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleResultClick(result)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
              >
                <CategoryIcon
                  icon={result.categoryIcon}
                  size={16}
                  className="text-muted-foreground shrink-0"
                />
                <span className="flex-1 truncate">{result.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

