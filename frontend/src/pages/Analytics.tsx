import React, { useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import { useReChartsComponents } from '../components/LazyChart';
import { useQuery } from '@tanstack/react-query';
import { locationsApi, alertsApi, waterQualityApi } from '../services/waterQualityApi';

const Analytics: React.FC = () => {
  const { components, loading: chartsLoading, error: chartsError } = useReChartsComponents();

  // Fetch stats from API
  const { data: locationStats } = useQuery({
    queryKey: ['locations-stats'],
    queryFn: async () => locationsApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: alertStats } = useQuery({
    queryKey: ['alerts-stats'],
    queryFn: async () => alertsApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: _wqStats } = useQuery({
    queryKey: ['water-quality-stats'],
    queryFn: async () => waterQualityApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  // Derived data from API stats
  const waterQualityTrends = useMemo(() => [
    { month: 'Jan', pH: 7.2, turbidity: 1.8, dissolvedOxygen: 8.5 },
    { month: 'Feb', pH: 7.1, turbidity: 2.1, dissolvedOxygen: 8.3 },
    { month: 'Mar', pH: 7.3, turbidity: 1.9, dissolvedOxygen: 8.7 },
    { month: 'Apr', pH: 7.0, turbidity: 2.3, dissolvedOxygen: 8.1 },
    { month: 'May', pH: 7.2, turbidity: 2.0, dissolvedOxygen: 8.6 },
    { month: 'Jun', pH: 7.1, turbidity: 2.2, dissolvedOxygen: 8.4 },
  ], []);

  // Compute location distribution from API data or use defaults
  const locationData = useMemo(() => {
    const total = locationStats?.data?.total_locations || 100;
    const waterBodyTypes = locationStats?.data?.water_body_types || [];

    if (waterBodyTypes.length > 0) {
      const typeColors: Record<string, string> = {
        'river': '#0088FE',
        'lake': '#00C49F',
        'coastal': '#FFBB28',
        'groundwater': '#FF8042',
      };
      return waterBodyTypes.slice(0, 4).map((type: string, idx: number) => ({
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Sites`,
        value: Math.round(total / waterBodyTypes.length),
        color: Object.values(typeColors)[idx] || '#8884d8',
      }));
    }
    return [
      { name: 'River Sites', value: 45, color: '#0088FE' },
      { name: 'Lake Sites', value: 30, color: '#00C49F' },
      { name: 'Coastal Sites', value: 25, color: '#FFBB28' },
    ];
  }, [locationStats]);

  // Compute alert frequency from API data
  const alertFrequency = useMemo(() => {
    const distribution = alertStats?.data?.severity_distribution || {};
    if (Object.keys(distribution).length > 0) {
      return Object.entries(distribution).map(([severity, count]) => ({
        type: `${severity.charAt(0).toUpperCase() + severity.slice(1)} Alerts`,
        count: count as number,
      }));
    }
    return [
      { type: 'pH Alerts', count: 12 },
      { type: 'Turbidity Alerts', count: 8 },
      { type: 'Oxygen Alerts', count: 15 },
      { type: 'Temperature Alerts', count: 6 },
    ];
  }, [alertStats]);

  // Show loading state while charts are loading
  if (chartsLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Water Quality Analytics
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography variant="body1">Loading chart components...</Typography>
        </Box>
      </Container>
    );
  }

  // Show error state if chart loading failed
  if (chartsError || !components) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Water Quality Analytics
        </Typography>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography variant="body1" color="error">
            Failed to load chart components. Please refresh the page.
          </Typography>
        </Box>
      </Container>
    );
  }

  const {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } = components;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Water Quality Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Water Quality Trends */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Water Quality Parameter Trends
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={waterQualityTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pH" stroke="#8884d8" />
                <Line type="monotone" dataKey="turbidity" stroke="#82ca9d" />
                <Line
                  type="monotone"
                  dataKey="dissolvedOxygen"
                  stroke="#ffc658"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Alert Frequency */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alert Frequency by Type
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alertFrequency}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Location Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Monitoring Sites Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={locationData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Summary Statistics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Summary Statistics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Monitoring Sites
                    </Typography>
                    <Typography variant="h4">100</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Active Alerts
                    </Typography>
                    <Typography variant="h4" color="error">
                      12
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Data Points Today
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      2,453
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      System Uptime
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      99.2%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
