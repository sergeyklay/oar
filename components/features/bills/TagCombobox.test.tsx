import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TagCombobox } from './TagCombobox';

Element.prototype.scrollIntoView = jest.fn();

// Mock the createTag action
jest.mock('@/actions/tags', () => ({
  createTag: jest.fn().mockResolvedValue({
    success: true,
    data: { id: 'new-tag-id', name: 'New Tag', slug: 'new-tag' },
  }),
}));

const mockTags = [
  { id: 'tag-1', name: 'Business', slug: 'business', createdAt: new Date() },
  { id: 'tag-2', name: 'Personal', slug: 'personal', createdAt: new Date() },
  { id: 'tag-3', name: 'Utilities', slug: 'utilities', createdAt: new Date() },
];

describe('TagCombobox', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  const renderCombobox = (selectedIds: string[] = []) => {
    return render(
      <TagCombobox
        availableTags={mockTags}
        selectedIds={selectedIds}
        onChange={mockOnChange}
        placeholder="Select tags..."
      />
    );
  };

  describe('rendering', () => {
    it('renders with placeholder when no tags selected', () => {
      renderCombobox([]);

      expect(screen.getByText('Select tags...')).toBeInTheDocument();
    });

    it('renders selected tags as badges', () => {
      renderCombobox(['tag-1', 'tag-2']);

      expect(screen.getByText('Business')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('renders combobox button with correct aria attributes', () => {
      renderCombobox([]);

      const button = screen.getByRole('combobox');
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('tag removal via badge', () => {
    it('removes tag when clicking X button on badge', async () => {
      const user = userEvent.setup();
      renderCombobox(['tag-1']);

      const removeButton = screen.getByRole('button', { name: /Remove Business/i });
      await user.click(removeButton);

      expect(mockOnChange).toHaveBeenCalledWith([]);
    });
  });

  describe('event propagation (regression: sidebar switching bug)', () => {
    it('stops click propagation on trigger button', async () => {
      const parentClickHandler = jest.fn();
      const user = userEvent.setup();

      render(
        <div onClick={parentClickHandler}>
          <TagCombobox
            availableTags={mockTags}
            selectedIds={[]}
            onChange={mockOnChange}
            placeholder="Select tags..."
          />
        </div>
      );

      await user.click(screen.getByRole('combobox'));

      // Parent should not receive the click due to stopPropagation
      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    it('stops click propagation when removing a tag badge', async () => {
      const parentClickHandler = jest.fn();
      const user = userEvent.setup();

      render(
        <div onClick={parentClickHandler}>
          <TagCombobox
            availableTags={mockTags}
            selectedIds={['tag-1']}
            onChange={mockOnChange}
            placeholder="Select tags..."
          />
        </div>
      );

      const removeButton = screen.getByRole('button', { name: /Remove Business/i });
      await user.click(removeButton);

      // Parent should not receive the click due to stopPropagation
      expect(parentClickHandler).not.toHaveBeenCalled();
    });

    it('calls onChange when removing tag without propagating to parent', async () => {
      const parentClickHandler = jest.fn();
      const user = userEvent.setup();

      render(
        <div onClick={parentClickHandler}>
          <TagCombobox
            availableTags={mockTags}
            selectedIds={['tag-1', 'tag-2']}
            onChange={mockOnChange}
            placeholder="Select tags..."
          />
        </div>
      );

      const removeButton = screen.getByRole('button', { name: /Remove Business/i });
      await user.click(removeButton);

      // onChange should be called with the remaining tag
      expect(mockOnChange).toHaveBeenCalledWith(['tag-2']);
      // Parent should not receive the click
      expect(parentClickHandler).not.toHaveBeenCalled();
    });
  });
});
