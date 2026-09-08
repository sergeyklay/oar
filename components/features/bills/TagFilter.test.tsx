import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useQueryState } from 'nuqs';
import { TagFilter } from './TagFilter';
import type { Tag } from '@/lib/types';

vi.mock('nuqs', () => ({
  useQueryState: vi.fn(),
}));

vi.mock('@/lib/search-params', () => ({
  calendarSearchParams: {
    tag: {
      withOptions: vi.fn().mockReturnValue({ shallow: false }),
    },
  },
}));

// Mock scrollIntoView for cmdk
window.HTMLElement.prototype.scrollIntoView = vi.fn();

const mockTags: Tag[] = [
  {
    id: '1',
    name: 'Utilities',
    slug: 'utilities',
    createdAt: new Date(),
  },
  {
    id: '2',
    name: 'Subscriptions',
    slug: 'subscriptions',
    createdAt: new Date(),
  },
];

describe('TagFilter', () => {
  const mockSetSelectedTag = vi.fn();

  beforeEach(() => {
    (useQueryState as Mock).mockReturnValue([null, mockSetSelectedTag]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('calls useQueryState with shallow: false configuration', () => {
    render(<TagFilter tags={mockTags} />);

    expect(useQueryState).toHaveBeenCalledWith(
      'tag',
      expect.objectContaining({
        shallow: false,
      }),
    );
  });

  it('updates selection when a tag is clicked in the list', async () => {
    const user = userEvent.setup();
    render(<TagFilter tags={mockTags} />);

    await user.click(screen.getByRole('button', { name: /all bills/i }));
    await user.click(screen.getByText('Utilities'));

    expect(mockSetSelectedTag).toHaveBeenCalledWith('utilities');
  });

  it('clears selection when the clear button is clicked', async () => {
    (useQueryState as Mock).mockReturnValue(['utilities', mockSetSelectedTag]);
    const user = userEvent.setup();
    render(<TagFilter tags={mockTags} />);

    await user.click(screen.getByRole('button', { name: /clear filter/i }));

    expect(mockSetSelectedTag).toHaveBeenCalledWith(null);
  });
});
