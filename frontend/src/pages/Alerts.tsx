import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertsApi } from '../services/waterQualityApi';
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
  CircularProgress,
} from '@mui/material';
import {
  Warning,
  Error as ErrorIcon,
  Info,
  CheckCircle,
  Refresh,
} from '@mui/icons-material';

const Alerts: React.FC = () => {
  // Fetch alert stats from API
  const { data: alertStats, refetch: refetchStats } = useQuery({
    queryKey: ['alerts-stats'],
    queryFn: async () => alertsApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch active alerts from API
  const { data: activeAlertsData, isLoading, refetch: refetchActive } = useQuery({
    queryKey: ['alerts-active-page'],
    queryFn: async () => alertsApi.getActive(),
    staleTime: 2 * 60 * 1000,
  });

  const alerts = useMemo(() => activeAlertsData?.data || [], [activeAlertsData]);

  const handleRefresh = () => {
    refetchStats();
    refetchActive();
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
      case 'warning':
        return <Warning color="warning" />;
      case 'medium':
      case 'info':
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
      case 'warning':
        return 'warning';
      case 'medium':
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Container>
    );
  }

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
          onClick={handleRefresh}
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
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error">
                    {alertStats?.data?.severity_distribution?.critical || 0}
                  </Typography>
                  <Typography color="textSecondary">Critical Alerts</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {(alertStats?.data?.severity_distribution?.high || 0) + (alertStats?.data?.severity_distribution?.warning || 0)}
                  </Typography>
                  <Typography color="textSecondary">Warning Alerts</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {(alertStats?.data?.severity_distribution?.medium || 0) + (alertStats?.data?.severity_distribution?.info || 0)}
                  </Typography>
                  <Typography color="textSecondary">Info Alerts</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    {alertStats?.data?.resolved_alerts || 0}
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
            <Table aria-label="alerts table">
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No active alerts found
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((alert) => (
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
                      <TableCell>{alert.location_name}</TableCell>
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
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          disabled={alert.status === 'resolved'}
                        >
                          {alert.status === 'resolved' ? 'Resolved' : 'Resolve'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
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