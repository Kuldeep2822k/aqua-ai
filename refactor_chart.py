import re

file_path = 'frontend/src/components/ui/chart.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

tooltip_item = '''
function ChartTooltipItem({ item, index, config, nameKey, color, indicator, hideIndicator, formatter, nestLabel, tooltipLabel }: any) {
  const key = `${nameKey || item.name || item.dataKey || 'value'}`;
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const indicatorColor = color || item.payload.fill || item.color;

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
        <>
          {itemConfig?.icon ? (
            <itemConfig.icon />
          ) : (
            !hideIndicator && (
              <div
                className={cn(
                  'shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)',
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
                    '--color-bg': indicatorColor,
                    '--color-border': indicatorColor,
                  } as React.CSSProperties
                }
              />
            )
          )}
          <div
            className={cn(
              'flex flex-1 justify-between leading-none',
              nestLabel ? 'items-end' : 'items-center'
            )}
          >
            <div className="grid gap-1.5">
              {nestLabel ? tooltipLabel : null}
              <span className="text-muted-foreground">
                {itemConfig?.label || item.name}
              </span>
            </div>
            {item.value && (
              <span className="text-foreground font-mono font-medium tabular-nums">
                {item.value.toLocaleString()}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
'''
# inject ChartTooltipItem before ChartTooltipContent
content = content.replace('function ChartTooltipContent({', tooltip_item + '\nfunction ChartTooltipContent({')

# Replace the payload.map logic
original_map = r'\{payload\.map\(\(item, index\) => \{\s*const key =.*?\n\s*const itemConfig =.*?\n\s*const indicatorColor =.*?\n\n\s*return \(\n\s*<div\n\s*key=\{item\.dataKey\}([\s\S]*?)<\/div>\n\s*\);\n\s*\}\)\}'
replacement = r'{payload.map((item: any, index: number) => (\n          <ChartTooltipItem key={item.dataKey} item={item} index={index} config={config} nameKey={nameKey} color={color} indicator={indicator} hideIndicator={hideIndicator} formatter={formatter} nestLabel={nestLabel} tooltipLabel={tooltipLabel} />\n        ))}'
content = re.sub(original_map, replacement, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
