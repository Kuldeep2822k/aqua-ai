import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Button,
  IconButton,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  SkipPrevious,
  SkipNext,
  FilterList,
  Download,
  Refresh,
} from '@mui/icons-material';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import SimpleMap from '../components/SimpleMap';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

interface WaterQualityData {
  id: number;
  location_name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  parameter: string;
  value: number;
  unit: string;
  measurement_date: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  quality_score: number;
}

interface MapFilters {
  parameter: string;
  riskLevel: string;
  state: string;
  dateRange: [number, number];
  showAlerts: boolean;
}
const MapView: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup>(new L.LayerGroup());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [waterQualityData, setWaterQualityData] = useState<WaterQualityData[]>([]);
  const [filteredData, setFilteredData] = useState<WaterQualityData[]>([]);
  const [timeSteps, setTimeSteps] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState<MapFilters>({
    parameter: 'all',
    riskLevel: 'all',
    state: 'all',
    dateRange: [0, 100],
    showAlerts: true
  });
  const riskColors = {
    low: '#27ae60',
    medium: '#f39c12',
    high: '#e74c3c',
    critical: '#8e44ad'
  };

  const parameters = [
    { value: 'all', label: 'All Parameters' },
    { value: 'BOD', label: 'BOD' },
    { value: 'TDS', label: 'TDS' },
    { value: 'pH', label: 'pH' },
    { value: 'DO', label: 'Dissolved Oxygen' },
    { value: 'Lead', label: 'Lead' },
    { value: 'Mercury', label: 'Mercury' },
    { value: 'Coliform', label: 'Coliform' },
    { value: 'Nitrates', label: 'Nitrates' }
  ];

  const states = [
    { value: 'all', label: 'All States' },
    { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
    { value: 'Delhi', label: 'Delhi' },
    { value: 'Maharashtra', label: 'Maharashtra' },
    { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
    { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
    { value: 'Assam', label: 'Assam' },
    { value: 'Karnataka', label: 'Karnataka' },
    { value: 'Gujarat', label: 'Gujarat' },
    { value: 'West Bengal', label: 'West Bengal' }
  ];

  // Initialize map - COMMENTED OUT since using SimpleMap
  /*
  useEffect(() => {
    if (mapRef.current && !mapInstance.current) {
      try {
        // Clear any existing map instance
        if (mapInstance.current) {
          mapInstance.current.remove();
        }
        
        mapInstance.current = L.map(mapRef.current, {
          center: [20.5937, 78.9629],
          zoom: 5,
          zoomControl: true,
          attributionControl: true
        });
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 18
        }).addTo(mapInstance.current);

        mapInstance.current.addLayer(markersRef.current);
        
        // Force a resize after a short delay to ensure proper rendering
        setTimeout(() => {
          if (mapInstance.current) {
            mapInstance.current.invalidateSize();
          }
        }, 100);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }
    
    // Cleanup function
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);
  */

  // Fallback mock data for when API is not available
  const getMockData = (): WaterQualityData[] => {
    return [
      // Sample of 25 locations - representing the full 51 location dataset
      {
        id: 1,
        location_name: "Ganga at Varanasi",
        state: "Uttar Pradesh",
        district: "Varanasi",
        latitude: 25.3176,
        longitude: 82.9739,
        parameter: "BOD",
        value: 8.5,
        unit: "mg/L",
        measurement_date: "2024-01-15T10:30:00Z",
        risk_level: "high",
        quality_score: 45
      },
      {
        id: 2,
        location_name: "Yamuna at Delhi (ITO)",
        state: "Delhi",
        district: "Central Delhi",
        latitude: 28.6139,
        longitude: 77.2090,
        parameter: "BOD",
        value: 15.2,
        unit: "mg/L",
        measurement_date: "2024-01-15T12:00:00Z",
        risk_level: "critical",
        quality_score: 15
      },
      {
        id: 3,
        location_name: "Ganga at Kanpur",
        state: "Uttar Pradesh",
        district: "Kanpur",
        latitude: 26.4499,
        longitude: 80.3319,
        parameter: "BOD",
        value: 18.3,
        unit: "mg/L",
        measurement_date: "2024-01-14T09:00:00Z",
        risk_level: "critical",
        quality_score: 12
      },
      {
        id: 4,
        location_name: "Mumbai Coastal Water",
        state: "Maharashtra",
        district: "Mumbai",
        latitude: 19.0760,
        longitude: 72.8777,
        parameter: "Coliform",
        value: 2400,
        unit: "/100ml",
        measurement_date: "2024-01-15T16:00:00Z",
        risk_level: "medium",
        quality_score: 55
      },
      {
        id: 5,
        location_name: "Cooum at Chennai",
        state: "Tamil Nadu",
        district: "Chennai",
        latitude: 13.0827,
        longitude: 80.2707,
        parameter: "BOD",
        value: 22.0,
        unit: "mg/L",
        measurement_date: "2024-01-14T08:30:00Z",
        risk_level: "critical",
        quality_score: 8
      },
      {
        id: 6,
        location_name: "Cauvery at Bangalore",
        state: "Karnataka",
        district: "Bangalore",
        latitude: 12.9716,
        longitude: 77.5946,
        parameter: "Nitrates",
        value: 35,
        unit: "mg/L",
        measurement_date: "2024-01-15T08:45:00Z",
        risk_level: "medium",
        quality_score: 62
      },
      {
        id: 7,
        location_name: "Periyar at Kochi",
        state: "Kerala",
        district: "Kochi",
        latitude: 9.9312,
        longitude: 76.2673,
        parameter: "DO",
        value: 6.8,
        unit: "mg/L",
        measurement_date: "2024-01-15T12:15:00Z",
        risk_level: "low",
        quality_score: 82
      },
      {
        id: 8,
        location_name: "Hooghly at Kolkata",
        state: "West Bengal",
        district: "Kolkata",
        latitude: 22.5726,
        longitude: 88.3639,
        parameter: "BOD",
        value: 22.5,
        unit: "mg/L",
        measurement_date: "2024-01-14T15:30:00Z",
        risk_level: "critical",
        quality_score: 8
      },
      {
        id: 9,
        location_name: "Brahmaputra at Guwahati",
        state: "Assam",
        district: "Guwahati",
        latitude: 26.1445,
        longitude: 91.7362,
        parameter: "TDS",
        value: 280,
        unit: "mg/L",
        measurement_date: "2024-01-16T06:00:00Z",
        risk_level: "low",
        quality_score: 75
      },
      {
        id: 10,
        location_name: "Damodar at Dhanbad",
        state: "Jharkhand",
        district: "Dhanbad",
        latitude: 23.7957,
        longitude: 86.4304,
        parameter: "Heavy Metals",
        value: 5.2,
        unit: "mg/L",
        measurement_date: "2024-01-14T14:20:00Z",
        risk_level: "critical",
        quality_score: 5
      },
      {
        id: 11,
        location_name: "Ganga at Patna",
        state: "Bihar",
        district: "Patna",
        latitude: 25.5941,
        longitude: 85.1376,
        parameter: "Coliform",
        value: 3200,
        unit: "/100ml",
        measurement_date: "2024-01-15T11:00:00Z",
        risk_level: "high",
        quality_score: 25
      },
      {
        id: 12,
        location_name: "Yamuna at Faridabad",
        state: "Haryana",
        district: "Faridabad",
        latitude: 28.4089,
        longitude: 77.3178,
        parameter: "BOD",
        value: 25.0,
        unit: "mg/L",
        measurement_date: "2024-01-14T16:45:00Z",
        risk_level: "critical",
        quality_score: 6
      },
      {
        id: 13,
        location_name: "Sutlej at Ludhiana",
        state: "Punjab",
        district: "Ludhiana",
        latitude: 30.9010,
        longitude: 75.8573,
        parameter: "Heavy Metals",
        value: 1.2,
        unit: "mg/L",
        measurement_date: "2024-01-15T10:00:00Z",
        risk_level: "high",
        quality_score: 28
      },
      {
        id: 14,
        location_name: "Luni at Jodhpur",
        state: "Rajasthan",
        district: "Jodhpur",
        latitude: 26.2389,
        longitude: 73.0243,
        parameter: "Salinity",
        value: 3500,
        unit: "mg/L",
        measurement_date: "2024-01-15T13:20:00Z",
        risk_level: "high",
        quality_score: 22
      },
      {
        id: 15,
        location_name: "Narmada at Jabalpur",
        state: "Madhya Pradesh",
        district: "Jabalpur",
        latitude: 23.1815,
        longitude: 79.9864,
        parameter: "pH",
        value: 7.2,
        unit: "",
        measurement_date: "2024-01-16T11:30:00Z",
        risk_level: "low",
        quality_score: 78
      },
      {
        id: 16,
        location_name: "Sabarmati at Ahmedabad",
        state: "Gujarat",
        district: "Ahmedabad",
        latitude: 23.0225,
        longitude: 72.5714,
        parameter: "pH",
        value: 8.9,
        unit: "",
        measurement_date: "2024-01-14T13:30:00Z",
        risk_level: "high",
        quality_score: 42
      },
      {
        id: 17,
        location_name: "Mahanadi at Cuttack",
        state: "Odisha",
        district: "Cuttack",
        latitude: 20.4625,
        longitude: 85.8828,
        parameter: "Turbidity",
        value: 45,
        unit: "NTU",
        measurement_date: "2024-01-15T09:15:00Z",
        risk_level: "medium",
        quality_score: 58
      },
      {
        id: 18,
        location_name: "Krishna at Vijayawada",
        state: "Andhra Pradesh",
        district: "Vijayawada",
        latitude: 16.5062,
        longitude: 80.6480,
        parameter: "TDS",
        value: 580,
        unit: "mg/L",
        measurement_date: "2024-01-16T09:00:00Z",
        risk_level: "medium",
        quality_score: 58
      },
      {
        id: 19,
        location_name: "Godavari at Hyderabad",
        state: "Telangana",
        district: "Hyderabad",
        latitude: 17.3850,
        longitude: 78.4867,
        parameter: "BOD",
        value: 6.2,
        unit: "mg/L",
        measurement_date: "2024-01-15T14:40:00Z",
        risk_level: "medium",
        quality_score: 52
      },
      {
        id: 20,
        location_name: "Indus at Leh",
        state: "Jammu & Kashmir",
        district: "Leh",
        latitude: 34.1526,
        longitude: 77.5771,
        parameter: "pH",
        value: 7.8,
        unit: "",
        measurement_date: "2024-01-16T07:00:00Z",
        risk_level: "low",
        quality_score: 85
      }
    ];
  };

  // Fetch water quality data - Using mock data only (no API)
  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);

        // Use mock data directly (no API call)
        const mockData = getMockData();
        setWaterQualityData(mockData);
        setFilteredData(mockData);

        // Generate time steps from mock data
        const dates = Array.from(new Set(mockData.map(item =>
          new Date(item.measurement_date).toISOString().split('T')[0]
        ))).sort();
        setTimeSteps(dates as string[]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...waterQualityData];

    if (filters.parameter !== 'all') {
      filtered = filtered.filter(item => item.parameter === filters.parameter);
    }

    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(item => item.risk_level === filters.riskLevel);
    }

    if (filters.state !== 'all') {
      filtered = filtered.filter(item => item.state === filters.state);
    }

    // Date range filter
    if (timeSteps.length > 0) {
      const startIndex = Math.floor((filters.dateRange[0] / 100) * (timeSteps.length - 1));
      const endIndex = Math.floor((filters.dateRange[1] / 100) * (timeSteps.length - 1));
      const startDate = timeSteps[startIndex];
      const endDate = timeSteps[endIndex];

      filtered = filtered.filter(item => {
        const itemDate = new Date(item.measurement_date).toISOString().split('T')[0];
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    setFilteredData(filtered);
  }, [filters, waterQualityData, timeSteps]);

  // Update map markers - COMMENTED OUT since SimpleMap handles its own markers
  /*
  useEffect(() => {
    if (!mapInstance.current) return;

    markersRef.current.clearLayers();

    filteredData.forEach(item => {
      const color = riskColors[item.risk_level];
      
      const marker = L.circleMarker([item.latitude, item.longitude], {
        color: color,
        fillColor: color,
        fillOpacity: 0.7,
        radius: 8,
        weight: 2
      });

      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; color: #2c3e50;">${item.location_name}</h3>
          <p style="margin: 0 0 10px 0; color: #7f8c8d; font-size: 14px;">${item.state}</p>
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <span style="font-size: 18px; font-weight: bold; margin-right: 8px;">${item.value} ${item.unit}</span>
            <span style="background: ${color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
              ${item.risk_level.charAt(0).toUpperCase() + item.risk_level.slice(1)} Risk
            </span>
          </div>
          <div style="font-size: 12px; color: #666;">
            <div><strong>Parameter:</strong> ${item.parameter}</div>
            <div><strong>Quality Score:</strong> ${item.quality_score}</div>
            <div><strong>Date:</strong> ${new Date(item.measurement_date).toLocaleDateString()}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.addLayer(marker);
    });
  }, [filteredData, riskColors]);
  */

  // Time-lapse functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && timeSteps.length > 0) {
      interval = setInterval(() => {
        setCurrentTimeIndex(prev => {
          const next = prev + 1;
          if (next >= timeSteps.length) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, 1000); // Change every second
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, timeSteps.length]);

  // Update data based on current time step
  useEffect(() => {
    if (timeSteps.length > 0 && currentTimeIndex < timeSteps.length) {
      const currentDate = timeSteps[currentTimeIndex];
      const timeFilteredData = waterQualityData.filter(item =>
        new Date(item.measurement_date).toISOString().split('T')[0] === currentDate
      );
      setFilteredData(timeFilteredData);
    }
  }, [currentTimeIndex, timeSteps, waterQualityData]);

  const handleFilterChange = (key: keyof MapFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkipPrevious = () => {
    setCurrentTimeIndex(Math.max(0, currentTimeIndex - 1));
  };

  const handleSkipNext = () => {
    setCurrentTimeIndex(Math.min(timeSteps.length - 1, currentTimeIndex + 1));
  };

  const handleExportData = () => {
    const csvContent = [
      ['Location', 'State', 'Parameter', 'Value', 'Unit', 'Risk Level', 'Date'],
      ...filteredData.map(item => [
        item.location_name,
        item.state,
        item.parameter,
        item.value,
        item.unit,
        item.risk_level,
        new Date(item.measurement_date).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `water_quality_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRiskLevelCount = (level: string) => {
    return filteredData.filter(item => item.risk_level === level).length;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography>Loading map data...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Interactive Water Quality Map
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Real-time visualization with time-lapse and advanced filtering capabilities
      </Typography>

      <Grid container spacing={3}>
        {/* Filters Panel */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterList sx={{ mr: 1 }} />
              <Typography variant="h6">Filters & Controls</Typography>
            </Box>

            {/* Parameter Filter */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Parameter</InputLabel>
              <Select
                value={filters.parameter}
                onChange={(e) => handleFilterChange('parameter', e.target.value)}
                label="Parameter"
              >
                {parameters.map(param => (
                  <MenuItem key={param.value} value={param.value}>
                    {param.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Risk Level Filter */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Risk Level</InputLabel>
              <Select
                value={filters.riskLevel}
                onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                label="Risk Level"
              >
                <MenuItem value="all">All Risk Levels</MenuItem>
                <MenuItem value="low">Low Risk</MenuItem>
                <MenuItem value="medium">Medium Risk</MenuItem>
                <MenuItem value="high">High Risk</MenuItem>
                <MenuItem value="critical">Critical Risk</MenuItem>
              </Select>
            </FormControl>

            {/* Toggle Options */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>State</InputLabel>
              <Select
                value={filters.state}
                onChange={(e) => handleFilterChange('state', e.target.value)}
                label="State"
              >
                {states.map(state => (
                  <MenuItem key={state.value} value={state.value}>
                    {state.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Date Range Slider */}
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Date Range</Typography>
              <Slider
                value={filters.dateRange}
                onChange={(_, newValue) => handleFilterChange('dateRange', newValue)}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => {
                  if (timeSteps.length > 0) {
                    const index = Math.floor((value / 100) * (timeSteps.length - 1));
                    return timeSteps[index] || '';
                  }
                  return '';
                }}
              />
            </Box>

            <FormControlLabel
              control={
                <Switch
                  checked={filters.showAlerts}
                  onChange={(e) => handleFilterChange('showAlerts', e.target.checked)}
                />
              }
              label="Show Alerts"
            />

            <Divider sx={{ my: 2 }} />

            {/* Time-lapse Controls */}
            <Box sx={{ mb: 2 }}>
              <Typography gutterBottom>Time-lapse Controls</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <IconButton onClick={handleSkipPrevious} disabled={currentTimeIndex === 0}>
                  <SkipPrevious />
                </IconButton>
                <IconButton onClick={handlePlayPause} color="primary">
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
                <IconButton onClick={handleSkipNext} disabled={currentTimeIndex >= timeSteps.length - 1}>
                  <SkipNext />
                </IconButton>
              </Box>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                {timeSteps[currentTimeIndex] || 'No data'}
              </Typography>
            </Box>

            {/* Export Button */}
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleExportData}
              fullWidth
              sx={{ mb: 2 }}
            >
              Export Data
            </Button>

            {/* Refresh Button */}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => window.location.reload()}
              fullWidth
            >
              Refresh Data
            </Button>
          </Paper>
        </Grid>

        {/* Map and Statistics */}
        <Grid item xs={12} md={9}>
          {/* Statistics Cards */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main">
                    {getRiskLevelCount('low')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Low Risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main">
                    {getRiskLevelCount('medium')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Medium Risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="error.main">
                    {getRiskLevelCount('high')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    High Risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="error.dark">
                    {getRiskLevelCount('critical')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Risk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Map */}
          <Paper sx={{ height: 600, position: 'relative' }}>
            <SimpleMap height="600px" />
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MapView;

