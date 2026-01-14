import React, { Suspense } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

// We'll handle lazy loading through hooks instead of components

interface ChartWrapperProps {
  children: React.ReactNode;
  height?: number | string;
  fallbackText?: string;
}

const ChartLoadingSpinner: React.FC<{ height?: number | string; text?: string }> = ({
  height = 300,
  text = "Loading chart..."
}) => (
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    height={height}
    sx={{
      bgcolor: 'grey.50',
      borderRadius: 1,
      border: '1px solid',
      borderColor: 'grey.200'
    }}
  >
    <CircularProgress size={40} sx={{ mb: 2 }} />
    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
      {text}
    </Typography>
  </Box>
);

export const LazyChart: React.FC<ChartWrapperProps> = ({
  children,
  height = 300,
  fallbackText = "Loading chart components..."
}) => {
  return (
    <Suspense fallback={<ChartLoadingSpinner height={height} text={fallbackText} />}>
      {children}
    </Suspense>
  );
};

// Export hooks for accessing components
export const useReChartsComponents = () => {
  const [components, setComponents] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    import('recharts')
      .then(module => {
        setComponents({
          BarChart: module.BarChart,
          Bar: module.Bar,
          XAxis: module.XAxis,
          YAxis: module.YAxis,
          CartesianGrid: module.CartesianGrid,
          Tooltip: module.Tooltip,
          Legend: module.Legend,
          LineChart: module.LineChart,
          Line: module.Line,
          PieChart: module.PieChart,
          Pie: module.Pie,
          Cell: module.Cell,
          ResponsiveContainer: module.ResponsiveContainer,
        });
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { components, loading, error };
};

export const useEChartsComponents = () => {
  const [ECharts, setECharts] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    import('echarts-for-react')
      .then(module => {
        setECharts(module.default);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  return { ECharts, loading, error };
};

export default LazyChart;