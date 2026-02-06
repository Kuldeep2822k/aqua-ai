import React, { useEffect, useMemo, useState } from 'react';
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
import api from '../services/api';

const Analytics: React.FC = () => {
  const { components, loading, error } = useReChartsComponents();

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [locationsStats, setLocationsStats] = useState<any>(null);
  const [alertsStats, setAlertsStats] = useState<any>(null);
  const [waterStats, setWaterStats] = useState<any>(null);

  useEffect(() => {
    let canceled = false;

    async function load() {
      setStatsLoading(true);
      setStatsError(null);
      try {
        const [locRes, alertRes, waterRes] = await Promise.all([
          api.get('/locations/stats'),
          api.get('/alerts/stats'),
          api.get('/water-quality/stats'),
        ]);

        if (canceled) return;
        setLocationsStats(locRes.data?.data ?? null);
        setAlertsStats(alertRes.data?.data ?? null);
        setWaterStats(waterRes.data?.data ?? null);
      } catch (e: any) {
        if (!canceled) setStatsError(e?.message || 'Failed to load analytics');
      } finally {
        if (!canceled) setStatsLoading(false);
      }
    }

    load();
    return () => {
      canceled = true;
    };
  }, []);

  // Show loading state while charts are loading
  if (loading) {
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
  if (error || !components) {
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

  const riskDistributionData = useMemo(() => {
    const dist = waterStats?.risk_level_distribution ?? {};
    return [
      { name: 'Low', value: dist.low ?? 0, color: '#27ae60' },
      { name: 'Medium', value: dist.medium ?? 0, color: '#f39c12' },
      { name: 'High', value: dist.high ?? 0, color: '#e74c3c' },
      { name: 'Critical', value: dist.critical ?? 0, color: '#8e44ad' },
    ];
  }, [waterStats]);

  const alertSeverityData = useMemo(() => {
    const dist = alertsStats?.severity_distribution ?? {};
    return [
      { type: 'Low', count: dist.low ?? 0 },
      { type: 'Medium', count: dist.medium ?? 0 },
      { type: 'High', count: dist.high ?? 0 },
      { type: 'Critical', count: dist.critical ?? 0 },
    ];
  }, [alertsStats]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Water Quality Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Alert Frequency */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alert Severity Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={alertSeverityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Water Quality Risk Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }: any) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {riskDistributionData.map((entry, index) => (
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
                    <Typography variant="h4">
                      {locationsStats?.total_locations ?? 'N/A'}
                    </Typography>
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
                      {alertsStats?.active_alerts ?? 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Readings
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {waterStats?.total_readings ?? 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Latest Reading
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {waterStats?.latest_reading
                        ? new Date(waterStats.latest_reading).toLocaleDateString()
                        : 'N/A'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            {statsLoading && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Loading analytics…
              </Typography>
            )}
            {statsError && (
              <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                {statsError}
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics;
