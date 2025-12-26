/// <reference types="@testing-library/jest-dom" />
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
  escapeCssIdentifier,
  sanitizeColorValue,
  type ChartConfig,
} from './chart';

describe('escapeCssIdentifier', () => {
  it('preserves alphanumeric characters and hyphens', () => {
    expect(escapeCssIdentifier('chart-123')).toBe('chart-123');
    expect(escapeCssIdentifier('myChart_123')).toBe('myChart_123');
    expect(escapeCssIdentifier('abc123')).toBe('abc123');
  });

  it('removes characters that break CSS syntax', () => {
    expect(escapeCssIdentifier('chart:id')).toBe('chartid');
    expect(escapeCssIdentifier('chart@name')).toBe('chartname');
    expect(escapeCssIdentifier('chart.name')).toBe('chartname');
    expect(escapeCssIdentifier('chart name')).toBe('chartname');
  });

  it('removes special characters that could inject CSS', () => {
    expect(escapeCssIdentifier('chart{value}')).toBe('chartvalue');
    expect(escapeCssIdentifier('chart[selector]')).toBe('chartselector');
    expect(escapeCssIdentifier('chart(value)')).toBe('chartvalue');
    expect(escapeCssIdentifier('chart;value')).toBe('chartvalue');
  });

  it('handles empty strings', () => {
    expect(escapeCssIdentifier('')).toBe('');
  });

  it('handles strings with only special characters', () => {
    expect(escapeCssIdentifier('!@#$%')).toBe('');
    expect(escapeCssIdentifier('{}[]()')).toBe('');
  });

  it('preserves underscores and hyphens', () => {
    expect(escapeCssIdentifier('chart-id_test')).toBe('chart-id_test');
    expect(escapeCssIdentifier('__chart__')).toBe('__chart__');
    expect(escapeCssIdentifier('---test---')).toBe('---test---');
  });
});

describe('sanitizeColorValue', () => {
  describe('CSS custom properties', () => {
    it('allows valid var() syntax', () => {
      expect(sanitizeColorValue('var(--primary)')).toBe('var(--primary)');
      expect(sanitizeColorValue('var(--chart-1)')).toBe('var(--chart-1)');
      expect(sanitizeColorValue('var(--color-name_123)')).toBe('var(--color-name_123)');
    });

    it('rejects invalid var() syntax', () => {
      expect(sanitizeColorValue('var(--primary))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('var(primary)')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('var(--primary;')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('var(--primary})')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('nested functions', () => {
    it('allows hsl(var(--name))', () => {
      expect(sanitizeColorValue('hsl(var(--primary))')).toBe('hsl(var(--primary))');
      expect(sanitizeColorValue('hsl(var(--chart-1))')).toBe('hsl(var(--chart-1))');
    });

    it('allows rgb(var(--name))', () => {
      expect(sanitizeColorValue('rgb(var(--color))')).toBe('rgb(var(--color))');
    });

    it('allows rgba(var(--name))', () => {
      expect(sanitizeColorValue('rgba(var(--color))')).toBe('rgba(var(--color))');
    });

    it('rejects invalid nested functions', () => {
      expect(sanitizeColorValue('hsl(var(primary))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('hsl(var(--primary)))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('hsl(var(--primary);')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('HSL/RGB/RGBA functions with numeric values', () => {
    it('allows hsl() with numeric values', () => {
      expect(sanitizeColorValue('hsl(200, 50%, 50%)')).toBe('hsl(200, 50%, 50%)');
      expect(sanitizeColorValue('hsl(200,50%,50%)')).toBe('hsl(200,50%,50%)');
      expect(sanitizeColorValue('hsl(200 50% 50%)')).toBe('hsl(200 50% 50%)');
    });

    it('allows rgb() with numeric values', () => {
      expect(sanitizeColorValue('rgb(255, 128, 0)')).toBe('rgb(255, 128, 0)');
      expect(sanitizeColorValue('rgb(255,128,0)')).toBe('rgb(255,128,0)');
    });

    it('allows rgba() with numeric values', () => {
      expect(sanitizeColorValue('rgba(255, 128, 0, 0.5)')).toBe('rgba(255, 128, 0, 0.5)');
      expect(sanitizeColorValue('rgba(255,128,0,0.5)')).toBe('rgba(255,128,0,0.5)');
    });

    it('rejects functions with unsafe characters', () => {
      expect(sanitizeColorValue('rgb(255, 128, url("evil"))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('hsl(200, 50%, calc(100%))')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('hex colors', () => {
    it('allows 3-digit hex colors', () => {
      expect(sanitizeColorValue('#fff')).toBe('#fff');
      expect(sanitizeColorValue('#000')).toBe('#000');
      expect(sanitizeColorValue('#abc')).toBe('#abc');
    });

    it('allows 4-digit hex colors', () => {
      expect(sanitizeColorValue('#ffff')).toBe('#ffff');
      expect(sanitizeColorValue('#0000')).toBe('#0000');
    });

    it('allows 6-digit hex colors', () => {
      expect(sanitizeColorValue('#ffffff')).toBe('#ffffff');
      expect(sanitizeColorValue('#000000')).toBe('#000000');
      expect(sanitizeColorValue('#ff0000')).toBe('#ff0000');
    });

    it('allows 8-digit hex colors', () => {
      expect(sanitizeColorValue('#ffffffff')).toBe('#ffffffff');
      expect(sanitizeColorValue('#00000000')).toBe('#00000000');
    });

    it('rejects invalid hex colors', () => {
      expect(sanitizeColorValue('#gg')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('#ffffg')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('#ff')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('#fffffff')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('named colors', () => {
    it('allows safe named colors', () => {
      expect(sanitizeColorValue('transparent')).toBe('transparent');
      expect(sanitizeColorValue('currentColor')).toBe('currentcolor');
      expect(sanitizeColorValue('inherit')).toBe('inherit');
      expect(sanitizeColorValue('initial')).toBe('initial');
      expect(sanitizeColorValue('unset')).toBe('unset');
    });

    it('normalizes case for named colors', () => {
      expect(sanitizeColorValue('TRANSPARENT')).toBe('transparent');
      expect(sanitizeColorValue('CurrentColor')).toBe('currentcolor');
      expect(sanitizeColorValue('INHERIT')).toBe('inherit');
      expect(sanitizeColorValue('INITIAL')).toBe('initial');
      expect(sanitizeColorValue('UNSET')).toBe('unset');
    });

    it('rejects unsafe named colors', () => {
      expect(sanitizeColorValue('red')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('blue')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('green')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('trimming', () => {
    it('trims whitespace', () => {
      expect(sanitizeColorValue('  var(--primary)  ')).toBe('var(--primary)');
      expect(sanitizeColorValue('\n\thsl(var(--chart-1))\t\n')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('  #fff  ')).toBe('#fff');
    });
  });

  describe('CSS injection prevention', () => {
    it('rejects CSS injection attempts in color values', () => {
      expect(sanitizeColorValue('red; } body { background: url(evil) } div {')).toBe(
        'hsl(var(--chart-1))'
      );
      expect(sanitizeColorValue('red } body {')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('red; } /* */')).toBe('hsl(var(--chart-1))');
    });

    it('rejects CSS functions that could be dangerous', () => {
      expect(sanitizeColorValue('url("evil")')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('calc(100% + 10px)')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('expression(evil)')).toBe('hsl(var(--chart-1))');
    });

    it('rejects empty strings', () => {
      expect(sanitizeColorValue('')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('   ')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('fallback behavior', () => {
    it('returns fallback for completely invalid input', () => {
      expect(sanitizeColorValue('not-a-color')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('123abc')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('!!@#$%')).toBe('hsl(var(--chart-1))');
    });
  });
});

jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', { 'data-testid': 'responsive-container' }, children),
}));

describe('ChartContainer', () => {
  const mockConfig: ChartConfig = {
    series1: {
      label: 'Series 1',
      color: 'hsl(var(--primary))',
    },
  };

  it('renders children within container', () => {
    render(
      <ChartContainer config={mockConfig}>
        <div>Chart Content</div>
      </ChartContainer>
    );

    expect(screen.getByText('Chart Content')).toBeInTheDocument();
    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChartContainer config={mockConfig} className="custom-class">
        <div>Content</div>
      </ChartContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('generates unique chart ID when id prop is provided', () => {
    const { container } = render(
      <ChartContainer config={mockConfig} id="my-chart">
        <div>Content</div>
      </ChartContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('data-chart', 'chart-my-chart');
  });

  it('generates unique chart ID when id prop is not provided', () => {
    const { container } = render(
      <ChartContainer config={mockConfig}>
        <div>Content</div>
      </ChartContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    const chartId = wrapper.getAttribute('data-chart');
    expect(chartId).toMatch(/^chart-/);
  });

  it('includes style element for chart config', () => {
    const { container } = render(
      <ChartContainer config={mockConfig}>
        <div>Content</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement).toBeInTheDocument();
    expect(styleElement?.textContent).toContain('--color-series1:');
  });

  it('passes additional props to container div', () => {
    const { container } = render(
      <ChartContainer
        config={mockConfig}
        data-testid="chart-wrapper"
        aria-label="Test Chart"
      >
        <div>Content</div>
      </ChartContainer>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveAttribute('data-testid', 'chart-wrapper');
    expect(wrapper).toHaveAttribute('aria-label', 'Test Chart');
  });

  it('forwards ref to container div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ChartContainer config={mockConfig} ref={ref}>
        <div>Content</div>
      </ChartContainer>
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current).toHaveAttribute('data-chart');
  });

  it('does not include style element when config has no colors or theme', () => {
    const emptyConfig: ChartConfig = {
      series1: {
        label: 'Series 1',
      },
    };

    const { container } = render(
      <ChartContainer config={emptyConfig}>
        <div>Content</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement).toBeNull();
  });

  it('generates CSS with theme.light and theme.dark', () => {
    const themeConfig: ChartConfig = {
      series1: {
        label: 'Series 1',
        theme: {
          light: 'hsl(var(--primary))',
          dark: 'hsl(var(--primary-dark))',
        },
      },
    };

    const { container } = render(
      <ChartContainer config={themeConfig}>
        <div>Content</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement?.textContent).toContain('hsl(var(--primary))');
    expect(styleElement?.textContent).toContain('hsl(var(--primary-dark))');
    expect(styleElement?.textContent).toContain('@media (prefers-color-scheme: dark)');
  });

  it('escapes special characters in chart ID and config keys in generated CSS', () => {
    const configWithSpecialChars: ChartConfig = {
      'series:1': {
        label: 'Series 1',
        color: 'hsl(var(--primary))',
      },
    };

    const { container } = render(
      <ChartContainer config={configWithSpecialChars} id="chart:id">
        <div>Content</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement?.textContent).toContain('[data-chart="chart-chartid"]');
    expect(styleElement?.textContent).toContain('--color-series1:');
    expect(styleElement?.textContent).not.toContain('series:1');
  });

  it('sanitizes color values in generated CSS', () => {
    const unsafeConfig: ChartConfig = {
      series1: {
        label: 'Series 1',
        color: 'red; } body { background: url(evil) } div {',
      },
    };

    const { container } = render(
      <ChartContainer config={unsafeConfig}>
        <div>Content</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement?.textContent).toContain('hsl(var(--chart-1))');
    expect(styleElement?.textContent).not.toContain('url(evil)');
  });

  it('uses theme.light when theme is provided', () => {
    const themeConfig: ChartConfig = {
      series1: {
        label: 'Series 1',
        theme: {
          light: 'hsl(var(--primary))',
          dark: 'hsl(var(--primary-dark))',
        },
      },
    };

    const { container } = render(
      <ChartContainer config={themeConfig}>
        <div>Content</div>
      </ChartContainer>
    );

    const styleElement = container.querySelector('style');
    expect(styleElement?.textContent).toContain('hsl(var(--primary))');
  });
});

describe('ChartTooltipContent', () => {
  const mockPayload = [
    {
      name: 'Series 1',
      value: 1000,
      dataKey: 'series1',
      color: '#ff0000',
      payload: {},
    },
  ];

  it('returns null when not active', () => {
    const { container } = render(
      <ChartTooltipContent active={false} payload={mockPayload} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is empty', () => {
    const { container } = render(
      <ChartTooltipContent active={true} payload={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders tooltip when active with payload', () => {
    render(<ChartTooltipContent active={true} payload={mockPayload} />);

    expect(screen.getByText('Series 1')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
  });

  it('renders label when provided', () => {
    render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        label="January 2025"
      />
    );

    expect(screen.getByText('January 2025')).toBeInTheDocument();
  });

  it('hides label when hideLabel is true', () => {
    render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        label="January 2025"
        hideLabel={true}
      />
    );

    expect(screen.queryByText('January 2025')).not.toBeInTheDocument();
  });

  it('uses labelFormatter when provided', () => {
    const labelFormatter = jest.fn(() => 'Formatted Label');
    render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        label="January 2025"
        labelFormatter={labelFormatter}
      />
    );

    expect(labelFormatter).toHaveBeenCalledWith('January 2025', mockPayload);
    expect(screen.getByText('Formatted Label')).toBeInTheDocument();
  });

  it('uses formatter when provided', () => {
    const formatter = jest.fn(() => <span>Formatted Value</span>);
    render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        formatter={formatter}
      />
    );

    expect(formatter).toHaveBeenCalledWith(
      1000,
      'Series 1',
      mockPayload[0],
      0,
      {}
    );
    expect(screen.getByText('Formatted Value')).toBeInTheDocument();
  });

  it('renders multiple payload items', () => {
    const multiPayload = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: {},
      },
      {
        name: 'Series 2',
        value: 2000,
        dataKey: 'series2',
        color: '#00ff00',
        payload: {},
      },
    ];

    render(<ChartTooltipContent active={true} payload={multiPayload} />);

    expect(screen.getByText('Series 1')).toBeInTheDocument();
    expect(screen.getByText('Series 2')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument();
    expect(screen.getByText('2,000')).toBeInTheDocument();
  });

  it('nests label when single payload and indicator is not dot', () => {
    render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        label="January 2025"
        indicator="line"
      />
    );

    const label = screen.getByText('January 2025');
    const tooltipContainer = label.closest('.grid.min-w-\\[8rem\\]');
    expect(tooltipContainer).toBeInTheDocument();
    const nestedGrid = tooltipContainer?.querySelector('.grid.gap-1\\.5')?.querySelector('.grid.gap-1\\.5');
    expect(nestedGrid).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        className="custom-tooltip"
      />
    );

    const tooltip = container.firstChild as HTMLElement;
    expect(tooltip).toHaveClass('custom-tooltip');
  });

  it('uses config label from payload when available', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Custom Label',
        color: 'hsl(var(--primary))',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    render(
      <ChartTooltipContent active={true} payload={payloadWithConfig} />
    );

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.queryByText('Series 1')).not.toBeInTheDocument();
  });

  it('handles string values in payload', () => {
    const stringPayload = [
      {
        name: 'Series 1',
        value: '1000',
        dataKey: 'series1',
        color: '#ff0000',
        payload: {},
      },
    ];

    render(<ChartTooltipContent active={true} payload={stringPayload} />);

    expect(screen.getByText('Series 1')).toBeInTheDocument();
  });

  it('renders dot indicator by default', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Series 1',
        color: '#ff0000',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    const { container } = render(
      <ChartTooltipContent active={true} payload={payloadWithConfig} />
    );

    const indicators = container.querySelectorAll('[style*="--color-bg"]');
    expect(indicators.length).toBeGreaterThan(0);
    const indicator = indicators[0] as HTMLElement;
    expect(indicator).toHaveClass('h-2.5', 'w-2.5');
  });

  it('renders line indicator when specified', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Series 1',
        color: '#ff0000',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    const { container } = render(
      <ChartTooltipContent
        active={true}
        payload={payloadWithConfig}
        indicator="line"
      />
    );

    const indicators = container.querySelectorAll('[style*="--color-bg"]');
    expect(indicators.length).toBeGreaterThan(0);
    const indicator = indicators[0] as HTMLElement;
    expect(indicator).toHaveClass('w-1');
  });

  it('renders dashed indicator when specified', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Series 1',
        color: '#ff0000',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    const { container } = render(
      <ChartTooltipContent
        active={true}
        payload={payloadWithConfig}
        indicator="dashed"
      />
    );

    const indicator = container.querySelector('[class*="border-dashed"]');
    expect(indicator).toBeInTheDocument();
  });

  it('hides indicator when hideIndicator is true', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Series 1',
        color: '#ff0000',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    const { container } = render(
      <ChartTooltipContent
        active={true}
        payload={payloadWithConfig}
        hideIndicator={true}
      />
    );

    const indicator = container.querySelector('[style*="--color-bg"]');
    expect(indicator).toBeNull();
  });

  it('uses color prop for indicator when provided', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Series 1',
        color: '#ff0000',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    const { container } = render(
      <ChartTooltipContent
        active={true}
        payload={payloadWithConfig}
        color="#00ff00"
      />
    );

    const indicator = container.querySelector('[style*="--color-bg"]') as HTMLElement;
    expect(indicator?.getAttribute('style')).toContain('--color-bg: #00ff00');
  });

  it('uses payload fill color for indicator when color prop is not provided', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Series 1',
        color: '#ff0000',
      },
    };

    const payloadWithFill = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { fill: '#00ff00', config },
      },
    ];

    const { container } = render(
      <ChartTooltipContent active={true} payload={payloadWithFill} />
    );

    const indicator = container.querySelector('[style*="--color-bg"]') as HTMLElement;
    expect(indicator?.getAttribute('style')).toContain('--color-bg: #00ff00');
  });

  it('uses item color for indicator when fill and color prop are not provided', () => {
    const config: ChartConfig = {
      'Series 1': {
        label: 'Series 1',
        color: '#ff0000',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    const { container } = render(
      <ChartTooltipContent active={true} payload={payloadWithConfig} />
    );

    const indicator = container.querySelector('[style*="--color-bg"]') as HTMLElement;
    expect(indicator?.getAttribute('style')).toContain('--color-bg: #ff0000');
  });

  it('uses nameKey prop to determine config key', () => {
    const config: ChartConfig = {
      customKey: {
        label: 'Custom Label',
        color: 'hsl(var(--primary))',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: { config },
      },
    ];

    render(
      <ChartTooltipContent
        active={true}
        payload={payloadWithConfig}
        nameKey="customKey"
      />
    );

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
    expect(screen.queryByText('Series 1')).not.toBeInTheDocument();
  });

  it('uses labelKey prop to determine label config key when label is not a string', () => {
    const config: ChartConfig = {
      customLabelKey: {
        label: 'Custom Label',
        color: 'hsl(var(--primary))',
      },
    };

    const payloadWithConfig = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'customLabelKey',
        color: '#ff0000',
        payload: { config },
      },
    ];

    render(
      <ChartTooltipContent
        active={true}
        payload={payloadWithConfig}
        label={123}
        labelKey="customLabelKey"
      />
    );

    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  it('does not nest label when multiple payload items', () => {
    const multiPayload = [
      {
        name: 'Series 1',
        value: 1000,
        dataKey: 'series1',
        color: '#ff0000',
        payload: {},
      },
      {
        name: 'Series 2',
        value: 2000,
        dataKey: 'series2',
        color: '#00ff00',
        payload: {},
      },
    ];

    render(
      <ChartTooltipContent
        active={true}
        payload={multiPayload}
        label="January 2025"
        indicator="line"
      />
    );

    const label = screen.getByText('January 2025');
    const labelParent = label.closest('.grid');
    expect(labelParent).toBeInTheDocument();
  });

  it('nests label when single payload and indicator is dashed', () => {
    render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        label="January 2025"
        indicator="dashed"
      />
    );

    const label = screen.getByText('January 2025');
    const tooltipContainer = label.closest('.grid.min-w-\\[8rem\\]');
    expect(tooltipContainer).toBeInTheDocument();
    const itemGrids = tooltipContainer?.querySelectorAll('.grid.gap-1\\.5');
    expect(itemGrids?.length).toBeGreaterThanOrEqual(2);
  });

  it('applies labelClassName when labelFormatter is provided', () => {
    const labelFormatter = jest.fn(() => 'Formatted Label');
    render(
      <ChartTooltipContent
        active={true}
        payload={mockPayload}
        label="January 2025"
        labelFormatter={labelFormatter}
        labelClassName="custom-label-class"
      />
    );

    const label = screen.getByText('Formatted Label');
    expect(label).toHaveClass('custom-label-class');
  });

  it('handles undefined value in payload item', () => {
    const payloadWithoutValue = [
      {
        name: 'Series 1',
        value: undefined,
        dataKey: 'series1',
        color: '#ff0000',
        payload: {},
      },
    ];

    render(<ChartTooltipContent active={true} payload={payloadWithoutValue} />);

    expect(screen.getByText('Series 1')).toBeInTheDocument();
    const valueElements = screen.queryAllByText(/\d/);
    const formattedValueElements = valueElements.filter(el =>
      el.classList.contains('tabular-nums')
    );
    expect(formattedValueElements.length).toBe(0);
  });

  it('renders zero value in tooltip', () => {
    const payloadWithZero = [
      {
        name: 'Series 1',
        value: 0,
        dataKey: 'series1',
        color: '#ff0000',
        payload: {},
      },
    ];

    render(<ChartTooltipContent active={true} payload={payloadWithZero} />);

    expect(screen.getByText('Series 1')).toBeInTheDocument();
    const valueElements = screen.queryAllByText('0');
    const formattedValueElement = valueElements.find(el =>
      el.classList.contains('tabular-nums') &&
      el.classList.contains('font-mono')
    );
    expect(formattedValueElement).toBeInTheDocument();
  });

  it('handles payload without name or dataKey', () => {
    const payloadWithoutName = [
      {
        value: 1000,
        dataKey: 'value',
        color: '#ff0000',
        payload: {},
      },
    ];

    render(<ChartTooltipContent active={true} payload={payloadWithoutName} />);

    const tooltip = screen.getByText('1,000').closest('.grid');
    expect(tooltip).toBeInTheDocument();
  });

});

describe('ChartLegendContent', () => {
  const mockPayload = [
    {
      value: 'series1',
      id: 'series1',
      color: '#ff0000',
    },
    {
      value: 'series2',
      id: 'series2',
      color: '#00ff00',
    },
  ];

  it('returns null when payload is empty', () => {
    const { container } = render(
      <ChartLegendContent payload={[]} config={{}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when payload is undefined', () => {
    const { container } = render(
      <ChartLegendContent payload={undefined} config={{}} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders legend items from payload', () => {
    render(<ChartLegendContent payload={mockPayload} config={{}} />);

    expect(screen.getByText('series1')).toBeInTheDocument();
    expect(screen.getByText('series2')).toBeInTheDocument();
  });

  it('uses config labels when available', () => {
    const config: ChartConfig = {
      series1: {
        label: 'Custom Series 1',
        color: 'hsl(var(--primary))',
      },
      series2: {
        label: 'Custom Series 2',
        color: 'hsl(var(--secondary))',
      },
    };

    render(<ChartLegendContent payload={mockPayload} config={config} />);

    expect(screen.getByText('Custom Series 1')).toBeInTheDocument();
    expect(screen.getByText('Custom Series 2')).toBeInTheDocument();
  });

  it('uses payload color when config color is not available', () => {
    const { container } = render(
      <ChartLegendContent payload={mockPayload} config={{}} />
    );

    const colorBoxes = container.querySelectorAll('[style*="background-color"]');
    expect(colorBoxes[0]).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(colorBoxes[1]).toHaveStyle({ backgroundColor: '#00ff00' });
  });

  it('uses config color when available', () => {
    const config: ChartConfig = {
      series1: {
        label: 'Series 1',
        color: 'rgb(0, 255, 0)',
      },
    };

    const payloadWithoutColor = [
      {
        value: 'series1',
        id: 'series1',
      },
    ];

    const { container } = render(
      <ChartLegendContent payload={payloadWithoutColor} config={config} />
    );

    const colorBox = container.querySelector(
      '[style*="background-color"]'
    ) as HTMLElement;
    expect(colorBox).toHaveStyle({ backgroundColor: 'rgb(0, 255, 0)' });
  });

  it('falls back to CSS variable when no color is provided', () => {
    const payloadWithoutColor = [
      {
        value: 'series1',
        id: 'series1',
      },
    ];

    const { container } = render(
      <ChartLegendContent payload={payloadWithoutColor} config={{}} />
    );

    const colorBox = container.querySelector(
      '[style*="background-color"]'
    ) as HTMLElement;
    expect(colorBox).toHaveStyle({ backgroundColor: 'var(--color-series1)' });
  });

  it('applies custom className', () => {
    const { container } = render(
      <ChartLegendContent
        payload={mockPayload}
        config={{}}
        className="custom-legend"
      />
    );

    const legend = container.firstChild as HTMLElement;
    expect(legend).toHaveClass('custom-legend');
  });

  it('uses id as key when value is not available', () => {
    const payloadWithIdOnly = [
      {
        id: 'series1',
        color: '#ff0000',
      },
    ];

    const config: ChartConfig = {
      series1: {
        label: 'Series 1',
        color: 'hsl(var(--primary))',
      },
    };

    const { rerender } = render(
      <ChartLegendContent payload={payloadWithIdOnly} config={config} />
    );

    expect(screen.getByText('Series 1')).toBeInTheDocument();

    rerender(
      <ChartLegendContent payload={payloadWithIdOnly} config={{}} />
    );

    const spans = screen.queryAllByRole('generic');
    const textSpan = spans.find(el =>
      el.classList.contains('text-xs') &&
      el.classList.contains('text-muted-foreground')
    );
    expect(textSpan?.textContent).toBe('');
  });

  it('handles payload items with type property', () => {
    const payloadWithType = [
      {
        value: 'series1',
        id: 'series1',
        type: 'line',
        color: '#ff0000',
      },
    ];

    render(<ChartLegendContent payload={payloadWithType} config={{}} />);

    expect(screen.getByText('series1')).toBeInTheDocument();
  });

  it('handles payload items with only value property', () => {
    const payloadValueOnly = [
      {
        value: 'series1',
      },
    ];

    render(<ChartLegendContent payload={payloadValueOnly} config={{}} />);

    expect(screen.getByText('series1')).toBeInTheDocument();
  });

  it('handles payload items with only id property', () => {
    const payloadIdOnly = [
      {
        id: 'series1',
      },
    ];

    render(<ChartLegendContent payload={payloadIdOnly} config={{}} />);

    const config: ChartConfig = {
      series1: {
        label: 'Series 1 Label',
        color: 'hsl(var(--primary))',
      },
    };

    const { rerender } = render(
      <ChartLegendContent payload={payloadIdOnly} config={config} />
    );

    expect(screen.getByText('Series 1 Label')).toBeInTheDocument();

    rerender(<ChartLegendContent payload={payloadIdOnly} config={{}} />);

    expect(screen.queryByText('Series 1 Label')).not.toBeInTheDocument();
  });

  it('passes additional props to legend container div', () => {
    const { container } = render(
      <ChartLegendContent
        payload={mockPayload}
        config={{}}
        data-testid="legend-wrapper"
        aria-label="Chart Legend"
      />
    );

    const legend = container.firstChild as HTMLElement;
    expect(legend).toHaveAttribute('data-testid', 'legend-wrapper');
    expect(legend).toHaveAttribute('aria-label', 'Chart Legend');
  });

  it('forwards ref to legend container div', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <ChartLegendContent payload={mockPayload} config={{}} ref={ref} />
    );

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

