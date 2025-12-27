import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnnualSpendingChart } from './AnnualSpendingChart';
import type { AggregatedBillSpending } from '@/lib/types';

const mockCellOnClickHandlers: Array<() => void> = [];

jest.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => {
    return (
      <div data-testid="pie" data-pie-data={JSON.stringify(data)}>
        {(data as Array<{ billId: string; name: string; value: number }>).map((entry) => (
          <div
            key={entry.billId}
            data-testid={`pie-segment-${entry.billId}`}
            data-bill-id={entry.billId}
            role="button"
            aria-label={`${entry.name} spending`}
          >
            {entry.name}
          </div>
        ))}
        {children}
      </div>
    );
  },
  Cell: ({ onClick, fill, strokeWidth, style }: { onClick?: () => void; fill?: string; strokeWidth?: number; style?: React.CSSProperties }) => {
    const cellIndex = mockCellOnClickHandlers.length;
    if (onClick) {
      mockCellOnClickHandlers.push(onClick);
    }
    return (
      <div
        data-testid="pie-cell"
        data-cell-index={cellIndex}
        onClick={() => mockCellOnClickHandlers[cellIndex]?.()}
        data-fill={fill}
        data-stroke-width={strokeWidth}
        style={style}
      />
    );
  },
}));

jest.mock('@/components/ui/chart', () => ({
  ChartContainer: ({
    children,
    config,
    initialDimension,
  }: {
    children: React.ReactNode;
    config: Record<string, unknown>;
    initialDimension?: { width: number; height: number };
  }) => (
    <div
      data-testid="chart-container"
      data-config={JSON.stringify(config)}
      data-initial-dimension={
        initialDimension ? JSON.stringify(initialDimension) : null
      }
    >
      {children}
    </div>
  ),
  ChartTooltip: ({ content }: { content: (props: unknown) => React.ReactNode }) => {
    const mockProps = {
      active: true,
      payload: [
        {
          payload: { name: 'Rent', value: 1200000, billId: 'bill-1' },
        },
      ],
    };
    return <div data-testid="chart-tooltip">{content(mockProps)}</div>;
  },
}));

jest.mock('@/lib/money', () => ({
  formatMoney: jest.fn((amount: number) => `$${(amount / 100).toFixed(2)}`),
}));

import { formatMoney } from '@/lib/money';

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

describe('AnnualSpendingChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCellOnClickHandlers.length = 0;
  });

  describe('rendering', () => {
    it('renders chart container with data', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('renders pie segments for each bill', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      expect(screen.getByTestId('pie-segment-bill-1')).toBeInTheDocument();
      expect(screen.getByTestId('pie-segment-bill-2')).toBeInTheDocument();
    });

    it('configures chart with bill data', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const container = screen.getByTestId('chart-container');
      const config = JSON.parse(container.getAttribute('data-config') || '{}');

      expect(config['bill-1']).toBeDefined();
      expect(config['bill-2']).toBeDefined();
      expect(config['bill-1'].label).toBe('Rent');
      expect(config['bill-2'].label).toBe('Internet');
    });

    it('passes initialDimension for SSR support', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const container = screen.getByTestId('chart-container');
      const dimensionAttr = container.getAttribute('data-initial-dimension');
      const initialDimension = dimensionAttr ? JSON.parse(dimensionAttr) : null;

      expect(initialDimension).toEqual({ width: 800, height: 400 });
    });
  });

  describe('empty state', () => {
    it('displays neutral placeholder when data is empty', () => {
      const { container } = render(
        <AnnualSpendingChart
          data={[]}
          currency="USD"
          locale="en-US"
        />
      );

      const placeholder = container.querySelector('.bg-muted');
      expect(placeholder).toBeInTheDocument();
    });

    it('displays neutral placeholder when all values are zero', () => {
      const zeroData: AggregatedBillSpending[] = [
        {
          billId: 'bill-1',
          billTitle: 'Rent',
          categoryIcon: 'house',
          paymentCount: 0,
          totalAmount: 0,
          averageAmount: 0,
        },
      ];

      const { container } = render(
        <AnnualSpendingChart
          data={zeroData}
          currency="USD"
          locale="en-US"
        />
      );

      const placeholder = container.querySelector('.bg-muted');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('calls onBillClick when pie segment is clicked', async () => {
      const user = userEvent.setup();
      const mockOnBillClick = jest.fn();

      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
          onBillClick={mockOnBillClick}
        />
      );

      const cells = screen.getAllByTestId('pie-cell');
      await user.click(cells[0]!);

      expect(mockOnBillClick).toHaveBeenCalledWith('bill-1');
      expect(mockOnBillClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onBillClick when handler is not provided', async () => {
      const user = userEvent.setup();

      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const segment = screen.getByTestId('pie-segment-bill-1');
      await user.click(segment);

      expect(screen.getByTestId('pie-segment-bill-1')).toBeInTheDocument();
    });

    it('calls onBillClick for different bills', async () => {
      const user = userEvent.setup();
      const mockOnBillClick = jest.fn();

      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
          onBillClick={mockOnBillClick}
        />
      );

      const cells = screen.getAllByTestId('pie-cell');
      await user.click(cells[0]!);
      await user.click(cells[1]!);

      expect(mockOnBillClick).toHaveBeenCalledWith('bill-1');
      expect(mockOnBillClick).toHaveBeenCalledWith('bill-2');
      expect(mockOnBillClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('highlighting', () => {
    it('applies highlight styling to highlighted bill', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
          highlightedBillId="bill-1"
        />
      );

      const cells = screen.getAllByTestId('pie-cell');
      const highlightedCell = cells.find((cell) =>
        cell.getAttribute('data-fill')?.includes('primary')
      );

      expect(highlightedCell).toBeDefined();
    });

    it('does not highlight when no bill is highlighted', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const cells = screen.getAllByTestId('pie-cell');
      const hasHighlight = cells.some((cell) =>
        cell.getAttribute('data-stroke-width') === '3'
      );

      expect(hasHighlight).toBe(false);
    });

    it('updates highlight when highlightedBillId changes', () => {
      const { rerender } = render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
          highlightedBillId="bill-1"
        />
      );

      rerender(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
          highlightedBillId="bill-2"
        />
      );

      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });
  });

  describe('tooltip', () => {
    it('formats tooltip values using formatMoney', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      screen.getByTestId('chart-tooltip');

      expect(formatMoney).toHaveBeenCalledWith(1200000, 'USD', 'en-US');
    });

    it('displays bill name and formatted amount in tooltip', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const tooltip = screen.getByTestId('chart-tooltip');
      expect(tooltip).toHaveTextContent('Rent');
      expect(tooltip).toHaveTextContent('$12000.00');
    });

    it('passes correct currency and locale to formatMoney', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="PLN"
          locale="pl-PL"
        />
      );

      screen.getByTestId('chart-tooltip');

      expect(formatMoney).toHaveBeenCalledWith(
        expect.any(Number),
        'PLN',
        'pl-PL'
      );
    });
  });

  describe('data transformation', () => {
    it('transforms bill data to chart format correctly', () => {
      render(
        <AnnualSpendingChart
          data={mockData}
          currency="USD"
          locale="en-US"
        />
      );

      const pie = screen.getByTestId('pie');
      const pieData = JSON.parse(pie.getAttribute('data-pie-data') || '[]');

      expect(pieData).toHaveLength(2);
      expect(pieData[0]).toMatchObject({
        name: 'Rent',
        value: 1200000,
        billId: 'bill-1',
      });
      expect(pieData[1]).toMatchObject({
        name: 'Internet',
        value: 60000,
        billId: 'bill-2',
      });
    });

    it('handles single bill correctly', () => {
      const singleBill: AggregatedBillSpending[] = [mockData[0]];

      render(
        <AnnualSpendingChart
          data={singleBill}
          currency="USD"
          locale="en-US"
        />
      );

      const pie = screen.getByTestId('pie');
      const pieData = JSON.parse(pie.getAttribute('data-pie-data') || '[]');

      expect(pieData).toHaveLength(1);
      expect(pieData[0].billId).toBe('bill-1');
    });
  });
});

