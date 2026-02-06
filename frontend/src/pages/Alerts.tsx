import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
} from '@mui/material';
import {
  Warning,
  Error,
  Info,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';
import api from '../services/api';

interface ApiAlertRow {
  id: number;
  location_id: number;
  location_name: string;
  state: string;
  parameter: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  status: 'active' | 'resolved' | 'dismissed';
  triggered_at: string;
  resolved_at: string | null;
}

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<ApiAlertRow[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refreshData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [alertsRes, statsRes] = await Promise.all([
        api.get('/alerts', { params: { limit: 100, offset: 0 } }),
        api.get('/alerts/stats'),
      ]);

      setAlerts(alertsRes.data?.data ?? []);
      setStats(statsRes.data?.data ?? null);
    } catch (e: any) {
      setLoadError(e?.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'high':
        return <Warning color="warning" />;
      case 'medium':
        return <Warning color="warning" />;
      case 'low':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const summary = useMemo(() => {
    const dist = stats?.severity_distribution ?? {};
    return {
      critical: dist.critical ?? 0,
      high: dist.high ?? 0,
      medium: dist.medium ?? 0,
      low: dist.low ?? 0,
      resolved: stats?.resolved_alerts ?? 0,
    };
  }, [stats]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4" gutterBottom>
          Water Quality Alerts
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={refreshData}
          disabled={loading}
        >
          Refresh Alerts
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Alert Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Alert Summary
            </Typography>
            {loadError && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {loadError}
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error">
                    {summary.critical}
                  </Typography>
                  <Typography color="textSecondary">Critical Alerts</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {summary.high}
                  </Typography>
                  <Typography color="textSecondary">High Alerts</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {summary.medium + summary.low}
                  </Typography>
                  <Typography color="textSecondary">Medium/Low Alerts</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {summary.resolved}
                  </Typography>
                  <Typography color="textSecondary">Resolved</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Alerts Table */}
        <Grid item xs={12}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Severity</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {getAlertIcon(alert.severity)}
                        <Chip
                          label={alert.severity.toUpperCase()}
                          color={getAlertColor(alert.severity) as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>
                      {alert.location_name}
                      {alert.state ? `, ${alert.state}` : ''}
                    </TableCell>
                    <TableCell>
                      {new Date(alert.triggered_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.status === 'resolved' ? 'Resolved' : 'Active'}
                        color={alert.status === 'resolved' ? 'success' : 'default'}
                        size="small"
                        icon={alert.status === 'resolved' ? <CheckCircle /> : undefined}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && alerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary">
                        No alerts found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Alerts;
