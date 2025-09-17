const express = require('express');
const router = express.Router();

// Mock data for development - in production, this would connect to PostgreSQL
const mockWaterQualityData = [
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
    location_name: "Yamuna at Delhi",
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
    location_name: "Godavari at Nashik",
    state: "Maharashtra",
    district: "Nashik",
    latitude: 19.9975,
    longitude: 73.7898,
    parameter: "BOD",
    value: 4.8,
    unit: "mg/L",
    measurement_date: "2024-01-15T14:15:00Z",
    risk_level: "medium",
    quality_score: 65
  }
];

// GET /api/water-quality - Get all water quality readings with filtering
router.get('/', async (req, res) => {
  try {
    const { 
      location_id, 
      parameter, 
      state, 
      risk_level, 
      start_date, 
      end_date,
      limit = 100,
      offset = 0
    } = req.query;

    let filteredData = [...mockWaterQualityData];

    // Apply filters
    if (location_id) {
      filteredData = filteredData.filter(item => item.id === parseInt(location_id));
    }

    if (parameter) {
      filteredData = filteredData.filter(item => 
        item.parameter.toLowerCase() === parameter.toLowerCase()
      );
    }

    if (state) {
      filteredData = filteredData.filter(item => 
        item.state.toLowerCase().includes(state.toLowerCase())
      );
    }

    if (risk_level) {
      filteredData = filteredData.filter(item => 
        item.risk_level === risk_level
      );
    }

    if (start_date) {
      filteredData = filteredData.filter(item => 
        new Date(item.measurement_date) >= new Date(start_date)
      );
    }

    if (end_date) {
      filteredData = filteredData.filter(item => 
        new Date(item.measurement_date) <= new Date(end_date)
      );
    }

    // Apply pagination
    const total = filteredData.length;
    const paginatedData = filteredData.slice(
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
    console.error('Error fetching water quality data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch water quality data',
      message: error.message
    });
  }
});

// GET /api/water-quality/:id - Get specific water quality reading
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const reading = mockWaterQualityData.find(item => item.id === parseInt(id));

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: 'Water quality reading not found'
      });
    }

    res.json({
      success: true,
      data: reading
    });

  } catch (error) {
    console.error('Error fetching water quality reading:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch water quality reading',
      message: error.message
    });
  }
});

// GET /api/water-quality/location/:locationId - Get all readings for a location
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { parameter, limit = 50 } = req.query;

    let readings = mockWaterQualityData.filter(item => item.id === parseInt(locationId));

    if (parameter) {
      readings = readings.filter(item => 
        item.parameter.toLowerCase() === parameter.toLowerCase()
      );
    }

    if (limit) {
      readings = readings.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: readings,
      count: readings.length
    });

  } catch (error) {
    console.error('Error fetching location readings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location readings',
      message: error.message
    });
  }
});

// GET /api/water-quality/parameters - Get available parameters
router.get('/parameters', async (req, res) => {
  try {
    const parameters = [
      { code: 'BOD', name: 'Biochemical Oxygen Demand', unit: 'mg/L' },
      { code: 'TDS', name: 'Total Dissolved Solids', unit: 'mg/L' },
      { code: 'pH', name: 'pH Level', unit: '' },
      { code: 'DO', name: 'Dissolved Oxygen', unit: 'mg/L' },
      { code: 'Lead', name: 'Lead', unit: 'mg/L' },
      { code: 'Mercury', name: 'Mercury', unit: 'mg/L' },
      { code: 'Coliform', name: 'Coliform Count', unit: 'MPN/100ml' },
      { code: 'Nitrates', name: 'Nitrates', unit: 'mg/L' }
    ];

    res.json({
      success: true,
      data: parameters
    });

  } catch (error) {
    console.error('Error fetching parameters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parameters',
      message: error.message
    });
  }
});

// GET /api/water-quality/stats - Get water quality statistics
router.get('/stats', async (req, res) => {
  try {
    const { state, parameter } = req.query;
    
    let data = [...mockWaterQualityData];
    
    if (state) {
      data = data.filter(item => 
        item.state.toLowerCase().includes(state.toLowerCase())
      );
    }
    
    if (parameter) {
      data = data.filter(item => 
        item.parameter.toLowerCase() === parameter.toLowerCase()
      );
    }

    const stats = {
      total_readings: data.length,
      risk_level_distribution: {
        low: data.filter(item => item.risk_level === 'low').length,
        medium: data.filter(item => item.risk_level === 'medium').length,
        high: data.filter(item => item.risk_level === 'high').length,
        critical: data.filter(item => item.risk_level === 'critical').length
      },
      average_quality_score: data.reduce((sum, item) => sum + item.quality_score, 0) / data.length,
      parameters_monitored: [...new Set(data.map(item => item.parameter))],
      states_monitored: [...new Set(data.map(item => item.state))],
      latest_reading: data.length > 0 ? data[0].measurement_date : null
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching water quality stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch water quality statistics',
      message: error.message
    });
  }
});

module.exports = router;

