import { render, screen } from '@testing-library/react';
import { MonthlyHistoryChart } from './MonthlyHistoryChart';

jest.mock('recharts', () => ({
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => (
    <div data-testid={`bar-${dataKey}`} />
  ),
  XAxis: ({ dataKey }: { dataKey: string }) => (
    <div data-testid="x-axis" data-key={dataKey} />
  ),
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
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
          value: 208000,
          dataKey: 'currentYear',
          name: 'currentYear',
          color: '#000',
        },
        {
          value: 150000,
          dataKey: 'lastYear',
          name: 'lastYear',
          color: '#000',
        },
      ],
    };
    return <div data-testid="chart-tooltip">{content(mockProps)}</div>;
  },
  ChartLegend: ({
    content,
  }: {
    content?: (props: unknown) => React.ReactNode;
  }) => {
    const mockProps = {
      payload: [
        { value: 'currentYear', id: 'currentYear', color: '#000' },
        { value: 'lastYear', id: 'lastYear', color: '#000' },
      ],
    };
    return (
      <div data-testid="chart-legend">
        {content ? content(mockProps) : null}
      </div>
    );
  },
  ChartLegendContent: ({ config }: { config: Record<string, unknown> }) => (
    <div data-testid="chart-legend-content" data-config={JSON.stringify(config)} />
  ),
}));

jest.mock('@/lib/money', () => ({
  formatMoney: jest.fn((amount: number) => `$${(amount / 100).toFixed(2)}`),
}));

import { formatMoney } from '@/lib/money';

const mockData = [
  {
    month: '2025-12',
    monthLabel: 'Dec',
    currentYear: 208000,
    lastYear: 150000,
  },
  {
    month: '2026-01',
    monthLabel: 'Jan',
    currentYear: 180000,
    lastYear: 120000,
  },
];

describe('MonthlyHistoryChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chart with provided data', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders both bars for currentYear and lastYear', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('bar-currentYear')).toBeInTheDocument();
    expect(screen.getByTestId('bar-lastYear')).toBeInTheDocument();
  });

  it('renders X-axis with monthLabel dataKey', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    const xAxis = screen.getByTestId('x-axis');
    expect(xAxis).toBeInTheDocument();
    expect(xAxis).toHaveAttribute('data-key', 'monthLabel');
  });

  it('renders cartesian grid', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('renders chart legend', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('chart-legend')).toBeInTheDocument();
    expect(screen.getByTestId('chart-legend-content')).toBeInTheDocument();
  });

  it('includes currentYear and lastYear in legend config', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    const container = screen.getByTestId('chart-container');
    const config = JSON.parse(container.getAttribute('data-config') || '{}');

    expect(config.currentYear).toBeDefined();
    expect(config.lastYear).toBeDefined();
    expect(config.currentYear.label).toBe('Current Year');
    expect(config.lastYear.label).toBe('Last Year');
  });

  it('formats tooltip values using formatMoney', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    screen.getByTestId('chart-tooltip');

    expect(formatMoney).toHaveBeenCalledWith(208000, 'USD', 'en-US');
    expect(formatMoney).toHaveBeenCalledWith(150000, 'USD', 'en-US');
  });

  it('displays formatted currency values in tooltip', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    const tooltip = screen.getByTestId('chart-tooltip');
    expect(tooltip).toHaveTextContent('$2080.00');
    expect(tooltip).toHaveTextContent('$1500.00');
  });

  it('handles empty data array', () => {
    render(
      <MonthlyHistoryChart
        data={[]}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('passes correct currency and locale to formatMoney', () => {
    render(
      <MonthlyHistoryChart
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

  it('handles months with zero values', () => {
    const dataWithZeros = [
      {
        month: '2025-12',
        monthLabel: 'Dec',
        currentYear: 0,
        lastYear: 0,
      },
    ];

    render(
      <MonthlyHistoryChart
        data={dataWithZeros}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-currentYear')).toBeInTheDocument();
    expect(screen.getByTestId('bar-lastYear')).toBeInTheDocument();
  });

  it('passes initialDimension to ChartContainer for SSR support', () => {
    render(
      <MonthlyHistoryChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    const container = screen.getByTestId('chart-container');
    const dimensionAttr = container.getAttribute('data-initial-dimension');
    const initialDimension = dimensionAttr ? JSON.parse(dimensionAttr) : null;

    expect(initialDimension).toEqual({ width: 800, height: 200 });
  });
});

