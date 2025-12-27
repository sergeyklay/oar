import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnualSpendingInteractive } from './AnnualSpendingInteractive';
import type { AggregatedBillSpending, AnnualSpendingSummary } from '@/lib/types';

jest.mock('./AnnualSpendingGraph', () => ({
  AnnualSpendingGraph: ({
    highlightedBillId,
    onBillClick,
  }: {
    data: AggregatedBillSpending[];
    highlightedBillId?: string;
    onBillClick?: (billId: string) => void;
  }) => (
    <div
      data-testid="annual-spending-graph"
      data-highlighted-bill-id={highlightedBillId}
      onClick={() => onBillClick?.('bill-1')}
    >
      Graph
    </div>
  ),
}));

jest.mock('./AnnualSpendingList', () => ({
  AnnualSpendingList: ({
    highlightedBillId,
    onBillClick,
  }: {
    bills: AggregatedBillSpending[];
    highlightedBillId?: string;
    onBillClick?: (billId: string) => void;
  }) => (
    <div
      data-testid="annual-spending-list"
      data-highlighted-bill-id={highlightedBillId}
      onClick={() => onBillClick?.('bill-2')}
    >
      List
    </div>
  ),
}));

jest.mock('./AnnualSpendingSummary', () => ({
  AnnualSpendingSummary: ({
    summary,
    year,
  }: {
    summary: AnnualSpendingSummary;
    year: string;
  }) => (
    <div data-testid="annual-spending-summary" data-year={year}>
      <div>Total Bills: {summary.totalBills}</div>
      <div>Total Payments: {summary.totalPayments}</div>
      <div>Amount Paid: {summary.amountPaid}</div>
    </div>
  ),
}));

const mockData: AggregatedBillSpending[] = [
  {
    billId: 'bill-1',
    billTitle: 'Rent',
    categoryIcon: 'house',
    paymentCount: 12,
    totalAmount: 1200000,
    averageAmount: 100000,
  },
  {
    billId: 'bill-2',
    billTitle: 'Internet',
    categoryIcon: 'wifi',
    paymentCount: 12,
    totalAmount: 60000,
    averageAmount: 5000,
  },
];

const mockSummary: AnnualSpendingSummary = {
  totalBills: 2,
  totalPayments: 24,
  amountPaid: 1260000,
};

describe('AnnualSpendingInteractive', () => {
  describe('rendering', () => {
    it('renders graph component', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByTestId('annual-spending-graph')).toBeInTheDocument();
    });

    it('renders list component', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByTestId('annual-spending-list')).toBeInTheDocument();
    });

    it('renders summary component', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByTestId('annual-spending-summary')).toBeInTheDocument();
    });

    it('passes summary data to summary component', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByText('Total Bills: 2')).toBeInTheDocument();
      expect(screen.getByText('Total Payments: 24')).toBeInTheDocument();
      expect(screen.getByText('Amount Paid: 1260000')).toBeInTheDocument();
    });

    it('passes year to summary component', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2024"
        />
      );

      const summary = screen.getByTestId('annual-spending-summary');
      expect(summary).toHaveAttribute('data-year', '2024');
    });
  });

  describe('state management', () => {
    it('initializes with no highlighted bill', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const graph = screen.getByTestId('annual-spending-graph');
      const list = screen.getByTestId('annual-spending-list');

      expect(graph).not.toHaveAttribute('data-highlighted-bill-id');
      expect(list).not.toHaveAttribute('data-highlighted-bill-id');
    });

    it('updates highlight when chart segment is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const graph = screen.getByTestId('annual-spending-graph');
      await user.click(graph);

      const updatedGraph = screen.getByTestId('annual-spending-graph');
      const updatedList = screen.getByTestId('annual-spending-list');

      expect(updatedGraph).toHaveAttribute('data-highlighted-bill-id', 'bill-1');
      expect(updatedList).toHaveAttribute('data-highlighted-bill-id', 'bill-1');
    });

    it('updates highlight when table row is clicked', async () => {
      const user = userEvent.setup();

      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const list = screen.getByTestId('annual-spending-list');
      await user.click(list);

      const updatedGraph = screen.getByTestId('annual-spending-graph');
      const updatedList = screen.getByTestId('annual-spending-list');

      expect(updatedGraph).toHaveAttribute('data-highlighted-bill-id', 'bill-2');
      expect(updatedList).toHaveAttribute('data-highlighted-bill-id', 'bill-2');
    });

    it('toggles highlight off when same bill is clicked again', async () => {
      const user = userEvent.setup();

      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const graph = screen.getByTestId('annual-spending-graph');
      await user.click(graph);

      let updatedGraph = screen.getByTestId('annual-spending-graph');
      expect(updatedGraph).toHaveAttribute('data-highlighted-bill-id', 'bill-1');

      await user.click(graph);

      updatedGraph = screen.getByTestId('annual-spending-graph');
      const updatedList = screen.getByTestId('annual-spending-list');

      expect(updatedGraph).not.toHaveAttribute('data-highlighted-bill-id');
      expect(updatedList).not.toHaveAttribute('data-highlighted-bill-id');
    });

    it('switches highlight between different bills', async () => {
      const user = userEvent.setup();

      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const graph = screen.getByTestId('annual-spending-graph');
      const list = screen.getByTestId('annual-spending-list');

      await user.click(graph);

      let updatedGraph = screen.getByTestId('annual-spending-graph');
      expect(updatedGraph).toHaveAttribute('data-highlighted-bill-id', 'bill-1');

      await user.click(list);

      updatedGraph = screen.getByTestId('annual-spending-graph');
      const updatedList = screen.getByTestId('annual-spending-list');

      expect(updatedGraph).toHaveAttribute('data-highlighted-bill-id', 'bill-2');
      expect(updatedList).toHaveAttribute('data-highlighted-bill-id', 'bill-2');
    });
  });

  describe('layout structure', () => {
    it('renders graph in top section', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const graph = screen.getByTestId('annual-spending-graph');
      const parent = graph.parentElement;

      expect(parent).toHaveClass('flex-shrink-0');
    });

    it('renders list and summary in grid layout', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      const list = screen.getByTestId('annual-spending-list');
      const summary = screen.getByTestId('annual-spending-summary');

      const listParent = list.parentElement;
      const summaryParent = summary.parentElement?.parentElement;

      expect(listParent?.parentElement).toHaveClass('grid');
      expect(summaryParent?.parentElement).toHaveClass('grid');
    });
  });

  describe('data passing', () => {
    it('passes data to graph and list components', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="USD"
          locale="en-US"
          year="2025"
        />
      );

      expect(screen.getByTestId('annual-spending-graph')).toBeInTheDocument();
      expect(screen.getByTestId('annual-spending-list')).toBeInTheDocument();
    });

    it('passes currency and locale to child components', () => {
      render(
        <AnnualSpendingInteractive
          data={mockData}
          summary={mockSummary}
          currency="PLN"
          locale="pl-PL"
          year="2025"
        />
      );

      expect(screen.getByTestId('annual-spending-graph')).toBeInTheDocument();
      expect(screen.getByTestId('annual-spending-list')).toBeInTheDocument();
    });
  });
});

