import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ForecastChart } from './ForecastChart';
import type { MonthlyForecastTotal } from '@/lib/services/ForecastService';

jest.mock('recharts', () => ({
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: ({ dataKey, onClick }: { dataKey: string; onClick?: (data: unknown) => void }) => (
    <div
      data-testid={`bar-${dataKey}`}
      onClick={() => onClick?.({ payload: { month: '2025-03' } })}
    />
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
          value: 30000,
          dataKey: 'totalDue',
          name: 'totalDue',
          color: '#000',
        },
        {
          value: 5000,
          dataKey: 'totalToSave',
          name: 'totalToSave',
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
        { value: 'totalDue', id: 'totalDue', color: '#000' },
        { value: 'totalToSave', id: 'totalToSave', color: '#000' },
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

const mockData: MonthlyForecastTotal[] = [
  {
    month: '2025-03',
    monthLabel: 'Mar',
    totalDue: 30000,
    totalToSave: 5000,
    grandTotal: 35000,
  },
  {
    month: '2025-04',
    monthLabel: 'Apr',
    totalDue: 20000,
    totalToSave: 0,
    grandTotal: 20000,
  },
];

describe('ForecastChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders chart with provided data', () => {
    render(
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders both bars for totalDue and totalToSave', () => {
    render(
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('bar-totalDue')).toBeInTheDocument();
    expect(screen.getByTestId('bar-totalToSave')).toBeInTheDocument();
  });

  it('renders X-axis with monthLabel dataKey', () => {
    render(
      <ForecastChart
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
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
  });

  it('renders chart legend', () => {
    render(
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    expect(screen.getByTestId('chart-legend')).toBeInTheDocument();
    expect(screen.getByTestId('chart-legend-content')).toBeInTheDocument();
  });

  it('includes totalToSave in legend config', () => {
    render(
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    const container = screen.getByTestId('chart-container');
    const config = JSON.parse(container.getAttribute('data-config') || '{}');

    expect(config.totalDue).toBeDefined();
    expect(config.totalToSave).toBeDefined();
    expect(config.totalDue.label).toBe('Amount Due');
    expect(config.totalToSave.label).toBe('Amount to Save');
  });

  it('formats tooltip values using formatMoney', () => {
    render(
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    screen.getByTestId('chart-tooltip');

    expect(formatMoney).toHaveBeenCalledWith(30000, 'USD', 'en-US');
    expect(formatMoney).toHaveBeenCalledWith(5000, 'USD', 'en-US');
  });

  it('displays formatted currency values in tooltip', () => {
    render(
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
      />
    );

    const tooltip = screen.getByTestId('chart-tooltip');
    expect(tooltip).toHaveTextContent('$300.00');
    expect(tooltip).toHaveTextContent('$50.00');
  });

  it('calls onBarClick when bar is clicked', async () => {
    const user = userEvent.setup();
    const onBarClick = jest.fn();

    render(
      <ForecastChart
        data={mockData}
        currency="USD"
        locale="en-US"
        onBarClick={onBarClick}
      />
    );

    const totalDueBar = screen.getByTestId('bar-totalDue');
    await user.click(totalDueBar);

    expect(onBarClick).toHaveBeenCalledWith('2025-03');
  });

  it('handles empty data array', () => {
    render(
      <ForecastChart
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
      <ForecastChart
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

  it('passes initialDimension to ChartContainer for SSR support', () => {
    render(
      <ForecastChart
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

