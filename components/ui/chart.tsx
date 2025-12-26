'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from '@/lib/utils';

/**
 * Escapes a string for safe use in CSS identifiers.
 *
 * Replaces characters that could break CSS selector syntax.
 * This prevents CSS injection vulnerabilities.
 *
 * @internal Exported for testing purposes
 */
export function escapeCssIdentifier(value: string): string {
  // Replace characters that could break CSS syntax
  return value.replace(/[^a-zA-Z0-9-_]/g, '');
}

/**
 * Validates that a color value is safe for CSS injection.
 *
 * Only allows:
 * - CSS custom properties (var(--...))
 * - HSL/RGB/RGBA functions with simple values
 * - HSL/RGB/RGBA functions with nested var() calls (hsl(var(--primary)))
 * - Hex colors (#...)
 * - Named colors (basic validation)
 *
 * @returns The sanitized color value, or a fallback if invalid
 * @internal Exported for testing purposes
 */
export function sanitizeColorValue(value: string): string {
  const trimmed = value.trim();

  // Allow CSS custom properties (var(--name))
  if (/^var\(--[a-zA-Z0-9-_]+\)$/.test(trimmed)) {
    return trimmed;
  }

  // Allow nested functions like hsl(var(--primary)) or rgb(var(--color))
  // Pattern: function(var(--css-variable-name))
  if (/^(hsl|rgb|rgba)\(var\(--[a-zA-Z0-9-_]+\)\)$/.test(trimmed)) {
    return trimmed;
  }

  // Allow HSL/RGB/RGBA functions with simple numeric values only
  // Pattern: function(numbers, numbers, numbers) with safe characters
  if (/^(hsl|rgb|rgba)\([\d.\s,%]+\)$/.test(trimmed)) {
    return trimmed;
  }

  // Allow hex colors (# followed by exactly 3, 4, 6, or 8 hex digits)
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed) ||
      /^#[0-9a-fA-F]{4}$/.test(trimmed) ||
      /^#[0-9a-fA-F]{6}$/.test(trimmed) ||
      /^#[0-9a-fA-F]{8}$/.test(trimmed)) {
    return trimmed;
  }

  // Allow basic named colors (whitelist approach for safety)
  const safeNamedColors = [
    'transparent',
    'currentcolor',
    'inherit',
    'initial',
    'unset',
  ];
  const normalized = trimmed.toLowerCase();
  if (safeNamedColors.includes(normalized)) {
    return normalized;
  }

  // If color doesn't match safe patterns, return fallback
  return 'hsl(var(--chart-1))';
}

/**
 * Container component that wraps chart content and applies responsive styling.
 *
 * Generates CSS custom properties from chart config for theming.
 * Provides responsive container wrapper for Recharts components.
 *
 * @param {ChartConfig} config - Chart configuration for color theming.
 * @param {React.ReactNode} children - Recharts chart components to render.
 * @returns Chart container with applied styling and responsive wrapper.
 */
const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${escapeCssIdentifier(id || uniqueId)}`;

  return (
    <div
      data-chart={chartId}
      ref={ref}
      className={cn(
        'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line-line]:stroke-border [&_.recharts-sector[stroke="#fff"]]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
        className
      )}
      {...props}
    >
      <ChartStyle id={chartId} config={config} />
      <RechartsPrimitive.ResponsiveContainer>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
});
ChartContainer.displayName = 'Chart';

/**
 * Generates and injects CSS styles for chart color theming.
 *
 * Creates CSS custom properties from chart config and applies them via
 * inline styles. Sanitizes all values to prevent CSS injection.
 *
 * @param {string} id - Unique chart identifier for scoped CSS selectors.
 * @param {ChartConfig} config - Chart configuration containing color definitions.
 * @returns Style element with sanitized CSS, or null if no colors configured.
 */
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, configItem]) => configItem.theme || configItem.color
  );

  if (!colorConfig.length) {
    return null;
  }

  // We can use id directly since it's already escaped
  const escapedId = id;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(config)
          .filter(([, configItem]) => configItem.theme || configItem.color)
          .map(([key, itemConfig]) => {
            // Escape config key to prevent CSS injection
            const escapedKey = escapeCssIdentifier(key);

            // Sanitize color values to prevent CSS injection
            const rawColor =
              itemConfig.theme?.light || itemConfig.color || 'hsl(var(--chart-1))';
            const rawDark =
              itemConfig.theme?.dark || itemConfig.color || 'hsl(var(--chart-1))';
            const color = sanitizeColorValue(rawColor);
            const dark = sanitizeColorValue(rawDark);

            // Use quoted attribute selector and escaped identifiers
            return `[data-chart="${escapedId}"] {
              --color-${escapedKey}: ${color};
            }
            @media (prefers-color-scheme: dark) {
              [data-chart="${escapedId}"] {
                --color-${escapedKey}: ${dark};
              }
            }`;
          })
          .join('\n'),
      }}
    />
  );
};

// Chart tooltip
const ChartTooltip = RechartsPrimitive.Tooltip;

/**
 * Props for ChartTooltipContent component.
 */
interface ChartTooltipContentProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    dataKey?: string;
    color?: string;
    payload?: {
      fill?: string;
      config?: ChartConfig;
      [key: string]: unknown;
    };
  }>;
  label?: string | number;
  labelFormatter?: (label: unknown, payload: unknown) => React.ReactNode;
  formatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown
  ) => React.ReactNode;
  className?: string;
  labelClassName?: string;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: 'line' | 'dot' | 'dashed';
  nameKey?: string;
  labelKey?: string;
  color?: string;
}

interface TooltipIndicatorProps {
  indicator: 'line' | 'dot' | 'dashed';
  color: string;
  nestLabel: boolean;
}

const TooltipIndicator = ({
  indicator,
  color,
  nestLabel,
}: TooltipIndicatorProps) => (
  <div
    className={cn(
      'shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]',
      {
        'h-2.5 w-2.5': indicator === 'dot',
        'w-1': indicator === 'line',
        'w-0 border-[1.5px] border-dashed bg-transparent':
          indicator === 'dashed',
        'my-0.5': nestLabel && indicator === 'dashed',
      }
    )}
    style={
      {
        '--color-bg': color,
        '--color-border': color,
      } as React.CSSProperties
    }
  />
);

type TooltipPayloadItem = NonNullable<
  ChartTooltipContentProps['payload']
>[number];

interface TooltipItemContentProps {
  item: TooltipPayloadItem;
  itemConfig: ChartConfig[string] | undefined;
  indicator: 'line' | 'dot' | 'dashed';
  indicatorColor: string;
  hideIndicator: boolean;
  nestLabel: boolean;
  tooltipLabel: React.ReactNode;
  formatter?: ChartTooltipContentProps['formatter'];
  formatterIndex: number;
}

const TooltipItemContent = ({
  item,
  itemConfig,
  indicator,
  indicatorColor,
  hideIndicator,
  nestLabel,
  tooltipLabel,
  formatter,
  formatterIndex,
}: TooltipItemContentProps) => {
  const shouldUseFormatter =
    formatter && item?.value !== undefined && item.name;

  if (shouldUseFormatter) {
    return (
      <>
        {formatter(
          item.value,
          item.name,
          item,
          formatterIndex,
          item.payload || {}
        )}
      </>
    );
  }

  return (
    <>
      {itemConfig && !hideIndicator && (
        <TooltipIndicator
          indicator={indicator}
          color={indicatorColor}
          nestLabel={nestLabel}
        />
      )}
      <div
        className={cn(
          'flex flex-1 justify-between leading-none',
          nestLabel ? 'items-end' : 'items-center'
        )}
      >
        <div className="grid gap-1.5">
          {nestLabel && tooltipLabel}
          <span className="text-muted-foreground">
            {itemConfig?.label || item.name}
          </span>
        </div>
        {item.value != null && (
          <span className="font-mono font-medium tabular-nums text-foreground">
            {item.value.toLocaleString()}
          </span>
        )}
      </div>
    </>
  );
};

/**
 * Renders tooltip content for chart data points.
 *
 * Displays formatted values with optional indicators, labels, and custom
 * formatting. Supports multiple payload items and conditional label nesting.
 *
 * @param {boolean} active - Whether the tooltip should be displayed.
 * @param {Array} payload - Array of data point information to display.
 * @param {string | number} label - Tooltip label text.
 * @param {'line' | 'dot' | 'dashed'} indicator - Visual indicator style for data points.
 * @param {Function} formatter - Optional function to format tooltip values.
 * @param {Function} labelFormatter - Optional function to format tooltip label.
 * @returns Tooltip content element, or null if not active or no payload.
 */
const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = 'dot',
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || 'value'}`;
      const itemConfig = item.payload?.config?.[key];

      if (labelFormatter) {
        return (
          <div className={cn('font-medium', labelClassName)}>
            {labelFormatter(label, payload)}
          </div>
        );
      }

      if (!label) {
        return null;
      }

      return (
        <div className={cn('font-medium', labelClassName)}>
          {typeof label === 'string' ? label : itemConfig?.label || key}
        </div>
      );
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      labelKey,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== 'dot';

    return (
      <div
        ref={ref}
        className={cn(
          'grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl',
          className
        )}
      >
        {!nestLabel && tooltipLabel}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || 'value'}`;
            const itemConfig = item.payload?.config?.[key];
            const indicatorColor =
              color || item.payload?.fill || item.color || '';

            return (
              <div
                key={item.dataKey ?? `item-${index}`}
                className={cn(
                  'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
                  indicator === 'dot' && 'items-center'
                )}
              >
                <TooltipItemContent
                  item={item}
                  itemConfig={itemConfig}
                  indicator={indicator}
                  indicatorColor={indicatorColor}
                  hideIndicator={hideIndicator}
                  nestLabel={nestLabel}
                  tooltipLabel={tooltipLabel}
                  formatter={formatter}
                  formatterIndex={index}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = 'ChartTooltipContent';

// Chart legend
const ChartLegend = RechartsPrimitive.Legend;

/**
 * Props for ChartLegendContent component.
 */
interface ChartLegendContentProps {
  payload?: Array<{
    value?: string;
    type?: string;
    id?: string;
    color?: string;
  }>;
  config?: ChartConfig;
}

/**
 * Renders legend items for chart data series.
 *
 * Displays color indicators and labels for each chart series based on
 * chart configuration. Falls back to payload values if config is unavailable.
 *
 * @param {Array} payload - Array of legend item data.
 * @param {ChartConfig} config - Chart configuration for label and color mapping.
 * @returns Legend content element, or null if no payload items.
 */
const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps & React.ComponentProps<'div'>
>(({ payload, config, className, ...props }, ref) => {
  if (!payload?.length) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn('flex flex-wrap items-center gap-4', className)}
      {...props}
    >
      {payload.map((item) => {
        const key = item.value || item.id || '';
        const itemConfig = config?.[key];
        const color = item.color
          ? item.color
          : itemConfig?.color
            ? itemConfig.color
            : `var(--color-${key})`;

        return (
          <div key={item.id || key} className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-sm"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs text-muted-foreground">
              {itemConfig?.label || item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = 'ChartLegendContent';

/**
 * Chart configuration for styling chart elements.
 *
 * All color values are sanitized to prevent CSS injection vulnerabilities.
 * ChartConfig should only contain developer-controlled constants, never user-supplied values.
 *
 * @security Color values are validated to only allow safe CSS color formats:
 * - CSS custom properties: var(--name)
 * - Nested functions: hsl(var(--primary))
 * - HSL/RGB/RGBA functions with numeric values
 * - Hex colors: #rrggbb
 * - Safe named colors: transparent, currentColor, inherit, etc.
 */
type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme?: { light: string; dark: string } }
  );
};

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
  type ChartConfig,
};

