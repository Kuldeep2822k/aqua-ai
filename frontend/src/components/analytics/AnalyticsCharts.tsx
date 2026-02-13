import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type WaterQualityTrendDatum = {
  date: string;
  quality: number;
  alerts: number;
};

type MonthlyTrendDatum = {
  month: string;
  critical: number;
  warning: number;
  good: number;
};

type StatusDistributionDatum = {
  name: string;
  value: number;
  color: string;
};

export function WaterQualityTrendChart({
  data,
}: {
  data: WaterQualityTrendDatum[];
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f0f0"
          className="dark:opacity-20"
        />
        <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            border: '1px solid var(--tooltip-border, #e5e7eb)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #111827)',
          }}
          wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
        />
        <Area
          type="monotone"
          dataKey="quality"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorQuality)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function MonthlyTrendsChart({ data }: { data: MonthlyTrendDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f0f0f0"
          className="dark:opacity-20"
        />
        <XAxis dataKey="month" stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <YAxis stroke="#9ca3af" style={{ fontSize: '12px' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            border: '1px solid var(--tooltip-border, #e5e7eb)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #111827)',
          }}
          wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
        />
        <Legend />
        <Bar
          dataKey="critical"
          fill="#ef4444"
          name="Critical"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="warning"
          fill="#eab308"
          name="Warning"
          radius={[8, 8, 0, 0]}
        />
        <Bar dataKey="good" fill="#22c55e" name="Good" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function StatusDistributionChart({
  data,
}: {
  data: StatusDistributionDatum[];
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--tooltip-bg, #fff)',
            border: '1px solid var(--tooltip-border, #e5e7eb)',
            borderRadius: '8px',
            color: 'var(--tooltip-text, #111827)',
          }}
          wrapperClassName="dark:[--tooltip-bg:#1f2937] dark:[--tooltip-border:#374151] dark:[--tooltip-text:#f9fafb]"
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
