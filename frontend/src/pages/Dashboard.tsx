import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Water,
  Warning,
  TrendingUp,
  People,
  Assessment,
  LocationOn,
  Download,
  Refresh,
} from '@mui/icons-material';
import ExportDialog from '../components/ExportDialog';
import DashboardMap from '../components/DashboardMap';

export default function Dashboard() {
  const navigate = useNavigate();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportDataType, setExportDataType] = useState<'water-quality' | 'locations' | 'predictions' | 'alerts'>('water-quality');
  
  // Mock data - in real app, this would come from API
  const metrics = [
    {
      title: 'Water Bodies Monitored',
      value: '1,247',
      change: '+12%',
      trend: 'up',
      icon: <Water />,
      color: 'primary',
    },
    {
      title: 'Active Alerts',
      value: '23',
      change: '-8%',
      trend: 'down',
      icon: <Warning />,
      color: 'warning',
    },
    {
      title: 'Quality Improvement',
      value: '15%',
      change: '+3%',
      trend: 'up',
      icon: <TrendingUp />,
      color: 'success',
    },
    {
      title: 'Community Reports',
      value: '456',
      change: '+24%',
      trend: 'up',
      icon: <People />,
      color: 'info',
    },
  ];

  const recentAlerts = [
    {
      location: 'Yamuna River, Delhi',
      parameter: 'BOD',
      value: '12.5 mg/L',
      severity: 'high',
      time: '2 hours ago',
    },
    {
      location: 'Ganga River, Varanasi',
      parameter: 'Heavy Metals',
      value: '0.15 mg/L Lead',
      severity: 'critical',
      time: '4 hours ago',
    },
    {
      location: 'Krishna River, Vijayawada',
      parameter: 'TDS',
      value: '850 ppm',
      severity: 'medium',
      time: '6 hours ago',
    },
  ];

  const hotspots = [
    { region: 'Delhi NCR', riskScore: 85, affected: '2.1M people' },
    { region: 'Mumbai Metropolitan', riskScore: 78, affected: '1.8M people' },
    { region: 'Kolkata Urban', riskScore: 72, affected: '1.4M people' },
    { region: 'Chennai Metro', riskScore: 68, affected: '1.2M people' },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'error';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'info';
    return 'success';
  };

  const handleExport = (dataType: 'water-quality' | 'locations' | 'predictions' | 'alerts') => {
    setExportDataType(dataType);
    setExportDialogOpen(true);
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'map':
        navigate('/map');
        break;
      case 'alerts':
        navigate('/alerts');
        break;
      case 'community':
        navigate('/community');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      default:
        break;
    }
  };

  const getExportData = () => {
    switch (exportDataType) {
      case 'water-quality':
        return recentAlerts.map(alert => ({
          location_name: alert.location,
          parameter: alert.parameter,
          value: alert.value,
          risk_level: alert.severity,
          measurement_date: alert.time
        }));
      case 'locations':
        return hotspots.map(hotspot => ({
          name: hotspot.region,
          risk_score: hotspot.riskScore,
          affected: hotspot.affected
        }));
      case 'predictions':
        return []; // Would be populated from API
      case 'alerts':
        return recentAlerts;
      default:
        return [];
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Water Quality Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time monitoring and AI-powered insights for India's water bodies
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Tooltip title="Export Data">
            <IconButton 
              color="primary" 
              onClick={() => handleExport('water-quality')}
            >
              <Download />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box 
                    sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: 1,
                      backgroundColor: `${metric.color}.main`,
                      color: `${metric.color}.contrastText`,
                      mr: 2,
                    }}
                  >
                    {metric.icon}
                  </Box>
                  <Box>
                    <Typography variant="h4" component="div">
                      {metric.value}
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {metric.title}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={metric.change}
                  color={metric.trend === 'up' ? 'success' : 'error'}
                  size="small"
                  variant="outlined"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Alerts */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Warning sx={{ mr: 1 }} />
              Recent Alerts
            </Typography>
            <Box>
              {recentAlerts.map((alert, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 2,
                    borderBottom: index < recentAlerts.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2">
                      {alert.location}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {alert.parameter}: {alert.value}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Chip
                      label={alert.severity.toUpperCase()}
                      color={getSeverityColor(alert.severity) as any}
                      size="small"
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {alert.time}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Risk Hotspots */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn sx={{ mr: 1 }} />
              Risk Hotspots
            </Typography>
            <Box>
              {hotspots.map((hotspot, index) => (
                <Box
                  key={index}
                  sx={{
                    py: 2,
                    borderBottom: index < hotspots.length - 1 ? 1 : 0,
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      {hotspot.region}
                    </Typography>
                    <Chip
                      label={hotspot.riskScore}
                      color={getRiskColor(hotspot.riskScore) as any}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {hotspot.affected} affected
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleQuickAction('map')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Assessment sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="subtitle2">
                      View Full Map
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleQuickAction('alerts')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="subtitle2">
                      Create Alert Rule
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleQuickAction('community')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <People sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="subtitle2">
                      Report Issue
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card 
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => handleQuickAction('analytics')}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="subtitle2">
                      View Analytics
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Water Quality Map */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <DashboardMap height="500px" />
        </Grid>
      </Grid>

      {/* Export Options */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <Download sx={{ mr: 1 }} />
              Export Data
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Export water quality data, locations, predictions, and alerts in various formats
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={() => handleExport('water-quality')}
              >
                Export Water Quality Data
              </Button>
              <Button
                variant="outlined"
                startIcon={<LocationOn />}
                onClick={() => handleExport('locations')}
              >
                Export Locations
              </Button>
              <Button
                variant="outlined"
                startIcon={<TrendingUp />}
                onClick={() => handleExport('predictions')}
              >
                Export Predictions
              </Button>
              <Button
                variant="outlined"
                startIcon={<Warning />}
                onClick={() => handleExport('alerts')}
              >
                Export Alerts
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        data={getExportData()}
        dataType={exportDataType}
      />
    </Container>
  );
}
