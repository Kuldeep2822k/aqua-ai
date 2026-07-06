'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';

import { cn } from './utils';

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: '', dark: '.dark' } as const;

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return context;
}

function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >['children'];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function getThemeColorCss(
  itemConfig: ChartConfig[string],
  opts: { theme: string; key: string }
) {
  const color =
    itemConfig.theme?.[opts.theme as keyof typeof itemConfig.theme] ||
    itemConfig.color;
  return color ? `  --color-${opts.key}: ${color};` : null;
}

function getThemeCss(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  colorConfig: any[],
  opts: { theme: string; prefix: string; id: string }
) {
  const colorVars = colorConfig
    .map(([key, itemConfig]) =>
      getThemeColorCss(itemConfig, { theme: opts.theme, key })
    )
    .join('\n');
  return `\n${opts.prefix} [data-chart=${opts.id}] {\n${colorVars}\n}\n`;
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) =>
            getThemeCss(colorConfig, { theme, prefix, id })
          )
          .join('\n'),
      }}
    />
  );
};

const ChartTooltip = RechartsPrimitive.Tooltip;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ChartTooltipItemType = any;

interface ChartTooltipItemProps {
  item: ChartTooltipItemType;
  index: number;
  config: ChartConfig;
  nameKey?: string;
  color?: string;
  indicator?: 'line' | 'dot' | 'dashed';
  hideIndicator?: boolean;
  // eslint-disable-next-line max-params
  formatter?: (
    value: unknown,
    name: unknown,
    item: unknown,
    index: number,
    payload: unknown
  ) => React.ReactNode;
  nestLabel?: boolean;
  tooltipLabel?: React.ReactNode;
}

function isIndicatorDashed(indicator?: 'line' | 'dot' | 'dashed') {
  return indicator === 'dashed';
}

function getIndicatorClassName(
  indicator?: 'line' | 'dot' | 'dashed',
  nestLabel?: boolean
) {
  return cn('shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)', {
    'h-2.5 w-2.5': indicator === 'dot',
    'w-1': indicator === 'line',
    'w-0 border-[1.5px] border-dashed bg-transparent':
      isIndicatorDashed(indicator),
    'my-0.5': nestLabel && isIndicatorDashed(indicator),
  });
}

function renderIndicator({
  itemConfig,
  hideIndicator,
  indicatorColor,
  indicator,
  nestLabel,
}: {
  itemConfig: { icon?: React.ElementType } | undefined;
  hideIndicator?: boolean;
  indicatorColor: string;
  indicator?: 'line' | 'dot' | 'dashed';
  nestLabel?: boolean;
}) {
  if (itemConfig?.icon) {
    const Icon = itemConfig.icon;
    return <Icon />;
  }
  if (hideIndicator) {
    return null;
  }
  return (
    <div
      className={getIndicatorClassName(indicator, nestLabel)}
      style={
        {
          '--color-bg': indicatorColor,
          '--color-border': indicatorColor,
        } as React.CSSProperties
      }
    />
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface ChartTooltipDefaultItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  itemConfig: { icon?: React.ElementType; label?: React.ReactNode } | undefined;
  indicatorColor: string;
  indicator?: 'line' | 'dot' | 'dashed';
  hideIndicator?: boolean;
  nestLabel?: boolean;
  tooltipLabel?: React.ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTooltipValue(itemValue: any) {
  if (!itemValue) {
    return null;
  }
  return (
    <span className="text-foreground font-mono font-medium tabular-nums">
      {itemValue.toLocaleString()}
    </span>
  );
}

function renderTooltipLabel(
  itemConfig: { label?: React.ReactNode } | undefined,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemName: any
) {
  return (
    <span className="text-muted-foreground">
      {itemConfig?.label || itemName}
    </span>
  );
}

function ChartTooltipDefaultItem({
  item,
  itemConfig,
  indicatorColor,
  indicator,
  hideIndicator,
  nestLabel,
  tooltipLabel,
}: ChartTooltipDefaultItemProps) {
  return (
    <>
      {renderIndicator({
        itemConfig: itemConfig as { icon?: React.ElementType } | undefined,
        hideIndicator,
        indicatorColor,
        indicator,
        nestLabel,
      })}
      <div
        className={cn(
          'flex flex-1 justify-between leading-none',
          nestLabel ? 'items-end' : 'items-center'
        )}
      >
        <div className="grid gap-1.5">
          {nestLabel ? tooltipLabel : null}
          {renderTooltipLabel(itemConfig, item.name)}
        </div>
        {renderTooltipValue(item.value)}
      </div>
    </>
  );
}

function ChartTooltipItem({
  item,
  index,
  config,
  nameKey,
  color,
  indicator,
  hideIndicator,
  formatter,
  nestLabel,
  tooltipLabel,
}: ChartTooltipItemProps) {
  const key = `${nameKey || item.name || item.dataKey || 'value'}`;
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const indicatorColor = color || item.payload?.fill || item.color || '';

  return (
    <div
      key={item.dataKey}
      className={cn(
        '[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5',
        indicator === 'dot' && 'items-center'
      )}
    >
      {formatter && item?.value !== undefined && item.name ? (
        formatter(item.value, item.name, item, index, item.payload)
      ) : (
        <ChartTooltipDefaultItem
          item={item}
          itemConfig={itemConfig}
          indicatorColor={indicatorColor}
          indicator={indicator}
          hideIndicator={hideIndicator}
          nestLabel={nestLabel}
          tooltipLabel={tooltipLabel}
        />
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLabelKey(item: any, labelKey?: string) {
  if (labelKey) {
    return labelKey;
  }
  if (item?.dataKey) {
    return item.dataKey;
  }
  if (item?.name) {
    return item.name;
  }
  return 'value';
}

function getLabelValue(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any,
  config: ChartConfig,
  opts: { labelKey?: string; label?: unknown }
) {
  const key = getLabelKey(item, opts.labelKey);
  const itemConfig = getPayloadConfigFromPayload(config, item, key);

  if (!opts.labelKey && typeof opts.label === 'string') {
    return config[opts.label as keyof typeof config]?.label || opts.label;
  }
  return itemConfig?.label;
}

function renderFormattedLabel(opts: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelFormatter: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  labelClassName?: string;
}) {
  if (opts.labelFormatter) {
    return (
      <div className={cn('font-medium', opts.labelClassName)}>
        {opts.labelFormatter(opts.value, opts.payload)}
      </div>
    );
  }
  if (!opts.value) {
    return null;
  }
  return (
    <div className={cn('font-medium', opts.labelClassName)}>{opts.value}</div>
  );
}

function useTooltipLabel({
  hideLabel,
  payload,
  labelKey,
  label,
  labelFormatter,
  labelClassName,
  config,
}: {
  hideLabel?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  labelKey?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  label: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  labelFormatter?: any;
  labelClassName?: string;
  config: ChartConfig;
}) {
  return React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }

    const [item] = payload;
    const value = getLabelValue(item, config, { labelKey, label });
    return renderFormattedLabel({
      labelFormatter,
      value,
      payload,
      labelClassName,
    });
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);
}

interface TooltipContentOptions {
  config: ChartConfig;
  nameKey: string | undefined;
  color: string | undefined;
  indicator: 'line' | 'dot' | 'dashed';
  hideIndicator: boolean | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter: any;
  nestLabel: boolean;
  tooltipLabel: React.ReactNode;
}

function renderTooltipContentItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any[],
  opts: TooltipContentOptions
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return payload.map((item: any, index: number) => (
    <ChartTooltipItem
      key={item.dataKey}
      item={item}
      index={index}
      config={opts.config}
      nameKey={opts.nameKey}
      color={opts.color}
      indicator={opts.indicator}
      hideIndicator={opts.hideIndicator}
      formatter={opts.formatter}
      nestLabel={opts.nestLabel}
      tooltipLabel={opts.tooltipLabel}
    />
  ));
}

function isNestLabel(payloadLength: number, indicator?: string) {
  return payloadLength === 1 && indicator !== 'dot';
}

function ChartTooltipContent({
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
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: 'line' | 'dot' | 'dashed';
    nameKey?: string;
    labelKey?: string;
  }) {
  const { config } = useChart();

  const tooltipLabel = useTooltipLabel({
    hideLabel,
    payload,
    labelKey,
    label,
    labelFormatter,
    labelClassName,
    config,
  });

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = isNestLabel(payload.length, indicator);

  return (
    <div
      className={cn(
        'border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl',
        className
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {renderTooltipContentItems(payload, {
          config,
          nameKey,
          color,
          indicator,
          hideIndicator,
          formatter,
          nestLabel,
          tooltipLabel,
        })}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getLegendItemKey(item: any, nameKey?: string) {
  if (nameKey) {
    return nameKey;
  }
  if (item?.dataKey) {
    return item.dataKey;
  }
  return 'value';
}

function renderLegendIcon(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemConfig: any,
  hideIcon: boolean | undefined,
  itemColor: string
) {
  if (itemConfig?.icon && !hideIcon) {
    return <itemConfig.icon />;
  }
  return (
    <div
      className="h-2 w-2 shrink-0 rounded-[2px]"
      style={{
        backgroundColor: itemColor,
      }}
    />
  );
}

function ChartLegendItem({
  item,
  config,
  nameKey,
  hideIcon,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  config: ChartConfig;
  nameKey?: string;
  hideIcon?: boolean;
}) {
  const key = getLegendItemKey(item, nameKey);
  const itemConfig = getPayloadConfigFromPayload(config, item, key);

  return (
    <div
      key={item.value}
      className={cn(
        '[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3'
      )}
    >
      {renderLegendIcon(itemConfig, hideIcon, item.color)}
      {itemConfig?.label}
    </div>
  );
}

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> &
  Pick<RechartsPrimitive.LegendProps, 'payload' | 'verticalAlign'> & {
    hideIcon?: boolean;
    nameKey?: string;
  }) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className
      )}
    >
      {payload.map((item) => (
        <ChartLegendItem
          key={item.value}
          item={item}
          config={config}
          nameKey={nameKey}
          hideIcon={hideIcon}
        />
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNestedPayload(payload: any) {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }
  if (!('payload' in payload)) {
    return undefined;
  }
  if (typeof payload.payload !== 'object') {
    return undefined;
  }
  if (payload.payload === null) {
    return undefined;
  }
  return payload.payload;
}

function extractConfigLabelKey(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  opts: {
    key: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payloadPayload: any;
  }
) {
  if (opts.key in payload && typeof payload[opts.key] === 'string') {
    return payload[opts.key] as string;
  }
  if (
    opts.payloadPayload &&
    opts.key in opts.payloadPayload &&
    typeof opts.payloadPayload[opts.key] === 'string'
  ) {
    return opts.payloadPayload[opts.key] as string;
  }
  return opts.key;
}

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payloadPayload = getNestedPayload(payload as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configLabelKey = extractConfigLabelKey(payload, {
    key,
    payloadPayload,
  });

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
