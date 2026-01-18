import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SEOHead from '../components/SEO/SEOHead';
import { useSEO, useSEOAnalytics } from '../hooks/useSEO';
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
  const [exportDataType, setExportDataType] = useState<'water-quality' | 'locations' | 'alerts'>('water-quality');

  // SEO optimization
  const seoData = useSEO();
  useSEOAnalytics();

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

  const handleExport = (dataType: 'water-quality' | 'locations' | 'alerts') => {
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
      case 'alerts':
        return recentAlerts;
      default:
        return [];
    }
  };

  return (
    <>
      <SEOHead
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        url={seoData.url}
        section={seoData.section}
        tags={seoData.tags}
      />
      <Container
        maxWidth="xl"
        sx={{
          mt: { xs: 2, sm: 3, md: 4 },
          mb: { xs: 2, sm: 3, md: 4 },
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {/* Welcome Section */}
        <Box
          sx={{
            mb: 4,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 2, sm: 0 },
            bgcolor: 'background.paper',
            borderRadius: 3,
            p: 4,
            position: 'relative',
            overflow: 'hidden',
            boxShadow: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
          className="slide-in-up"
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Typography
              variant="h3"
              component="h1"
              gutterBottom
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                fontSize: { xs: '1.75rem', sm: '2rem', md: '2.5rem' },
                lineHeight: { xs: 1.3, sm: 1.2 },
              }}
            >
              Water Quality Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', fontWeight: 500 }}>
              Real-time monitoring and AI-powered insights for India's water bodies
            </Typography>
          </Box>
          <Box sx={{
            display: 'flex',
            gap: 1,
            position: 'relative',
            zIndex: 1,
            flexDirection: { xs: 'row', sm: 'row' },
            width: { xs: '100%', sm: 'auto' },
            justifyContent: { xs: 'flex-end', sm: 'flex-start' }
          }}>
            <Tooltip title="Refresh Data">
              <IconButton
                className="glass"
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#0066cc',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-2px)',
                  }
                }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export Data">
              <IconButton
                className="glass"
                onClick={() => handleExport('water-quality')}
                sx={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: '#0066cc',
                  '&:hover': {
                    background: 'rgba(255, 255, 255, 0.3)',
                    transform: 'translateY(-2px)',
                  }
                }}
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
              <Card
                className="card-hover slide-in-up stagger-animation"
                sx={{
                  '--stagger-index': index,
                  bgcolor: 'background.paper',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${metric.color === 'primary' ? 'rgba(0, 102, 204, 0.05)' : metric.color === 'warning' ? 'rgba(245, 124, 0, 0.05)' : metric.color === 'success' ? 'rgba(46, 125, 50, 0.05)' : 'rgba(2, 136, 209, 0.05)'} 0%, transparent 100%)`,
                    zIndex: 0,
                  },
                  '&:hover': {
                    '&::before': {
                      background: `linear-gradient(135deg, ${metric.color === 'primary' ? 'rgba(0, 102, 204, 0.1)' : metric.color === 'warning' ? 'rgba(245, 124, 0, 0.1)' : metric.color === 'success' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(2, 136, 209, 0.1)'} 0%, transparent 100%)`,
                    }
                  }
                }}
              >
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 56,
                        height: 56,
                        borderRadius: 3,
                        background: `linear-gradient(135deg, ${metric.color}.main, ${metric.color}.light)`,
                        color: 'white',
                        mr: 2,
                        boxShadow: `0 8px 24px rgba(${metric.color === 'primary' ? '0, 102, 204' : metric.color === 'warning' ? '245, 124, 0' : metric.color === 'success' ? '46, 125, 50' : '2, 136, 209'}, 0.3)`,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        }
                      }}
                    >
                      {React.cloneElement(metric.icon, { fontSize: 'large' })}
                    </Box>
                    <Box>
                      <Typography
                        variant="h4"
                        component="div"
                        sx={{
                          fontWeight: 700,
                          color: 'text.primary',
                          mb: 0.5,
                          fontSize: '1.75rem',
                        }}
                      >
                        {metric.value}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                        }}
                      >
                        {metric.title}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={metric.change}
                    color={metric.trend === 'up' ? 'success' : 'error'}
                    size="small"
                    sx={{
                      fontWeight: 600,
                      borderRadius: 2,
                      background: metric.trend === 'up'
                        ? 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.1) 100%)'
                        : 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)',
                      border: `1px solid ${metric.trend === 'up' ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.3)'}`,
                    }}
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
              <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }} className="text-primary">
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
                      <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                        {alert.location}
                      </Typography>
                      <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
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
              <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }} className="text-primary">
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
                      <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600 }}>
                        {hotspot.region}
                      </Typography>
                      <Chip
                        label={hotspot.riskScore}
                        color={getRiskColor(hotspot.riskScore) as any}
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500 }}>
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
              <Typography variant="h5" component="h2" gutterBottom className="text-primary">
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
              <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }} className="text-primary">
                <Download sx={{ mr: 1 }} />
                Export Data
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Export water quality data, locations, and alerts in various formats
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
    </>
  );
}
