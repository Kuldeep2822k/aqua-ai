const express = require('express');
const router = express.Router();
const supabase = require('../src/supabase');

// Mock data for development - fallback if Supabase is unavailable
const mockLocations = [
  {
    id: 1,
    name: "Ganga at Varanasi",
    state: "Uttar Pradesh",
    district: "Varanasi",
    latitude: 25.3176,
    longitude: 82.9739,
    water_body_type: "river",
    water_body_name: "Ganga",
    population_affected: 1500000,
    parameters_monitored: ["BOD", "TDS", "pH", "DO", "Lead", "Mercury", "Coliform", "Nitrates"],
    last_reading: "2024-01-15T10:30:00Z",
    avg_wqi_score: 45.2,
    active_alerts: 2,
    risk_level: "high"
  },
  {
    id: 2,
    name: "Yamuna at Delhi",
    state: "Delhi",
    district: "Central Delhi",
    latitude: 28.6139,
    longitude: 77.2090,
    water_body_type: "river",
    water_body_name: "Yamuna",
    population_affected: 2000000,
    parameters_monitored: ["BOD", "TDS", "pH", "DO", "Lead", "Mercury", "Coliform", "Nitrates"],
    last_reading: "2024-01-15T12:00:00Z",
    avg_wqi_score: 28.7,
    active_alerts: 3,
    risk_level: "critical"
  },
  {
    id: 3,
    name: "Godavari at Nashik",
    state: "Maharashtra",
    district: "Nashik",
    latitude: 19.9975,
    longitude: 73.7898,
    water_body_type: "river",
    water_body_name: "Godavari",
    population_affected: 800000,
    parameters_monitored: ["BOD", "TDS", "pH", "DO", "Lead", "Mercury", "Coliform", "Nitrates"],
    last_reading: "2024-01-15T14:15:00Z",
    avg_wqi_score: 72.8,
    active_alerts: 1,
    risk_level: "medium"
  },
  {
    id: 4,
    name: "Krishna at Vijayawada",
    state: "Andhra Pradesh",
    district: "Krishna",
    latitude: 16.5062,
    longitude: 80.6480,
    water_body_type: "river",
    water_body_name: "Krishna",
    population_affected: 1200000,
    parameters_monitored: ["BOD", "TDS", "pH", "DO", "Lead", "Mercury", "Coliform", "Nitrates"],
    last_reading: "2024-01-15T16:45:00Z",
    avg_wqi_score: 89.3,
    active_alerts: 0,
    risk_level: "low"
  },
  {
    id: 5,
    name: "Narmada at Jabalpur",
    state: "Madhya Pradesh",
    district: "Jabalpur",
    latitude: 23.1815,
    longitude: 79.9864,
    water_body_type: "river",
    water_body_name: "Narmada",
    population_affected: 600000,
    parameters_monitored: ["BOD", "TDS", "pH", "DO", "Lead", "Mercury", "Coliform", "Nitrates"],
    last_reading: "2024-01-15T18:20:00Z",
    avg_wqi_score: 65.4,
    active_alerts: 1,
    risk_level: "medium"
  }
];

// GET /api/locations - Get all monitoring locations
router.get('/', async (req, res) => {
  try {
    const {
      state,
      risk_level,
      water_body_type,
      has_alerts,
      limit = 100,
      offset = 0
    } = req.query;

    let filteredLocations = [...mockLocations];

    // Apply filters
    if (state) {
      filteredLocations = filteredLocations.filter(location =>
        location.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (risk_level) {
      filteredLocations = filteredLocations.filter(location =>
        location.risk_level === risk_level
      );
    }

    if (water_body_type) {
      filteredLocations = filteredLocations.filter(location =>
        location.water_body_type === water_body_type
      );
    }

    if (has_alerts === 'true') {
      filteredLocations = filteredLocations.filter(location =>
        location.active_alerts > 0
      );
    }

    // Apply pagination
    const total = filteredLocations.length;
    const paginatedData = filteredLocations.slice(
      parseInt(offset),
      parseInt(offset) + parseInt(limit)
    );

    res.json({
      success: true,
      data: paginatedData,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });

  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch locations',
      message: error.message
    });
  }
});

// GET /api/locations/stats - Get location statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total_locations: mockLocations.length,
      states_covered: [...new Set(mockLocations.map(loc => loc.state))].length,
      water_body_types: [...new Set(mockLocations.map(loc => loc.water_body_type))],
      risk_level_distribution: {
        low: mockLocations.filter(loc => loc.risk_level === 'low').length,
        medium: mockLocations.filter(loc => loc.risk_level === 'medium').length,
        high: mockLocations.filter(loc => loc.risk_level === 'high').length,
        critical: mockLocations.filter(loc => loc.risk_level === 'critical').length
      },
      total_population_affected: mockLocations.reduce((sum, loc) => sum + loc.population_affected, 0),
      locations_with_alerts: mockLocations.filter(loc => loc.active_alerts > 0).length,
      average_wqi_score: mockLocations.reduce((sum, loc) => sum + loc.avg_wqi_score, 0) / mockLocations.length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching location stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location statistics',
      message: error.message
    });
  }
});

// GET /api/locations/geojson - Get locations as GeoJSON
router.get('/geojson', async (req, res) => {
  try {
    const geojson = {
      type: "FeatureCollection",
      features: mockLocations.map(location => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [location.longitude, location.latitude]
        },
        properties: {
          id: location.id,
          name: location.name,
          state: location.state,
          district: location.district,
          water_body_type: location.water_body_type,
          water_body_name: location.water_body_name,
          population_affected: location.population_affected,
          risk_level: location.risk_level,
          avg_wqi_score: location.avg_wqi_score,
          active_alerts: location.active_alerts,
          last_reading: location.last_reading
        }
      }))
    };

    res.json({
      success: true,
      data: geojson
    });

  } catch (error) {
    console.error('Error fetching GeoJSON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch GeoJSON data',
      message: error.message
    });
  }
});

// GET /api/locations/search - Search locations
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    const searchTerm = q.toLowerCase();
    const results = mockLocations.filter(location =>
      location.name.toLowerCase().includes(searchTerm) ||
      location.state.toLowerCase().includes(searchTerm) ||
      location.district.toLowerCase().includes(searchTerm) ||
      location.water_body_name.toLowerCase().includes(searchTerm)
    ).slice(0, parseInt(limit));

    res.json({
      success: true,
      data: results,
      count: results.length
    });

  } catch (error) {
    console.error('Error searching locations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search locations',
      message: error.message
    });
  }
});

// GET /api/locations/:id - Get specific location
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const location = mockLocations.find(loc => loc.id === parseInt(id));

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found'
      });
    }

    res.json({
      success: true,
      data: location
    });

  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location',
      message: error.message
    });
  }
});

module.exports = router;

