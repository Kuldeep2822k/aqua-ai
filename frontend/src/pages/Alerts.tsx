import React, { useState } from 'react';
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
  IconButton,
  Button,
  Box,
} from '@mui/material';
import { Warning, Error, Info, CheckCircle, Refresh } from '@mui/icons-material';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  location: string;
  timestamp: string;
  resolved: boolean;
}

const Alerts: React.FC = () => {
  const [alerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'critical',
      message: 'pH levels critically low at 5.2',
      location: 'River Site A',
      timestamp: '2024-01-15T10:30:00Z',
      resolved: false,
    },
    {
      id: '2',
      type: 'warning',
      message: 'Turbidity levels elevated',
      location: 'Lake Site B',
      timestamp: '2024-01-15T09:15:00Z',
      resolved: false,
    },
    {
      id: '3',
      type: 'info',
      message: 'Scheduled maintenance completed',
      location: 'Coastal Site C',
      timestamp: '2024-01-15T08:00:00Z',
      resolved: true,
    },
  ]);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Water Quality Alerts
        </Typography>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => window.location.reload()}
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
                    1
                  </Typography>
                  <Typography color="textSecondary">
                    Critical Alerts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    1
                  </Typography>
                  <Typography color="textSecondary">
                    Warning Alerts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    1
                  </Typography>
                  <Typography color="textSecondary">
                    Info Alerts
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="success.main">
                    1
                  </Typography>
                  <Typography color="textSecondary">
                    Resolved
                  </Typography>
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
                  <TableCell>Type</TableCell>
                  <TableCell>Message</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.map((alert) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getAlertIcon(alert.type)}
                        <Chip
                          label={alert.type.toUpperCase()}
                          color={getAlertColor(alert.type) as any}
                          size="small"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>{alert.location}</TableCell>
                    <TableCell>
                      {new Date(alert.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={alert.resolved ? 'Resolved' : 'Active'}
                        color={alert.resolved ? 'success' : 'default'}
                        size="small"
                        icon={alert.resolved ? <CheckCircle /> : undefined}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={alert.resolved}
                      >
                        {alert.resolved ? 'Resolved' : 'Resolve'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Alerts;