const express = require('express');
const router = express.Router();

// Mock AI predictions data
const mockPredictions = [
  {
    id: 1,
    location_id: 1,
    location_name: "Ganga at Varanasi",
    parameter: "BOD",
    predicted_value: 9.2,
    confidence_score: 78.5,
    prediction_date: "2024-01-16T10:30:00Z",
    forecast_hours: 24,
    model_version: "v1.2",
    risk_level: "high",
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    location_id: 1,
    location_name: "Ganga at Varanasi",
    parameter: "TDS",
    predicted_value: 680,
    confidence_score: 82.3,
    prediction_date: "2024-01-16T10:30:00Z",
    forecast_hours: 24,
    model_version: "v1.2",
    risk_level: "medium",
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 3,
    location_id: 2,
    location_name: "Yamuna at Delhi",
    parameter: "BOD",
    predicted_value: 16.8,
    confidence_score: 85.2,
    prediction_date: "2024-01-17T12:00:00Z",
    forecast_hours: 48,
    model_version: "v1.2",
    risk_level: "critical",
    created_at: "2024-01-15T12:00:00Z"
  },
  {
    id: 4,
    location_id: 2,
    location_name: "Yamuna at Delhi",
    parameter: "DO",
    predicted_value: 2.1,
    confidence_score: 79.8,
    prediction_date: "2024-01-17T12:00:00Z",
    forecast_hours: 48,
    model_version: "v1.2",
    risk_level: "critical",
    created_at: "2024-01-15T12:00:00Z"
  },
  {
    id: 5,
    location_id: 3,
    location_name: "Godavari at Nashik",
    parameter: "BOD",
    predicted_value: 5.1,
    confidence_score: 72.4,
    prediction_date: "2024-01-16T14:15:00Z",
    forecast_hours: 24,
    model_version: "v1.2",
    risk_level: "medium",
    created_at: "2024-01-15T14:15:00Z"
  },
  {
    id: 6,
    location_id: 4,
    location_name: "Krishna at Vijayawada",
    parameter: "BOD",
    predicted_value: 2.3,
    confidence_score: 88.7,
    prediction_date: "2024-01-16T16:45:00Z",
    forecast_hours: 24,
    model_version: "v1.2",
    risk_level: "low",
    created_at: "2024-01-15T16:45:00Z"
  }
];

// GET /api/predictions - Get all AI predictions
router.get('/', async (req, res) => {
  try {
    const { 
      location_id, 
      parameter, 
      risk_level, 
      forecast_hours,
      model_version,
      limit = 100,
      offset = 0
    } = req.query;

    let filteredPredictions = [...mockPredictions];

    // Apply filters
    if (location_id) {
      filteredPredictions = filteredPredictions.filter(pred => 
        pred.location_id === parseInt(location_id)
      );
    }

    if (parameter) {
      filteredPredictions = filteredPredictions.filter(pred => 
        pred.parameter.toLowerCase() === parameter.toLowerCase()
      );
    }

    if (risk_level) {
      filteredPredictions = filteredPredictions.filter(pred => 
        pred.risk_level === risk_level
      );
    }

    if (forecast_hours) {
      filteredPredictions = filteredPredictions.filter(pred => 
        pred.forecast_hours === parseInt(forecast_hours)
      );
    }

    if (model_version) {
      filteredPredictions = filteredPredictions.filter(pred => 
        pred.model_version === model_version
      );
    }

    // Apply pagination
    const total = filteredPredictions.length;
    const paginatedData = filteredPredictions.slice(
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
    console.error('Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictions',
      message: error.message
    });
  }
});

// GET /api/predictions/:id - Get specific prediction
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const prediction = mockPredictions.find(pred => pred.id === parseInt(id));

    if (!prediction) {
      return res.status(404).json({
        success: false,
        error: 'Prediction not found'
      });
    }

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Error fetching prediction:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prediction',
      message: error.message
    });
  }
});

// GET /api/predictions/location/:locationId - Get predictions for specific location
router.get('/location/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const { parameter, forecast_hours, limit = 50 } = req.query;

    let predictions = mockPredictions.filter(pred => 
      pred.location_id === parseInt(locationId)
    );

    if (parameter) {
      predictions = predictions.filter(pred => 
        pred.parameter.toLowerCase() === parameter.toLowerCase()
      );
    }

    if (forecast_hours) {
      predictions = predictions.filter(pred => 
        pred.forecast_hours === parseInt(forecast_hours)
      );
    }

    if (limit) {
      predictions = predictions.slice(0, parseInt(limit));
    }

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });

  } catch (error) {
    console.error('Error fetching location predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch location predictions',
      message: error.message
    });
  }
});

// GET /api/predictions/hotspots - Get pollution hotspots
router.get('/hotspots', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Group predictions by location and calculate risk scores
    const locationRiskScores = {};
    
    mockPredictions.forEach(pred => {
      if (!locationRiskScores[pred.location_id]) {
        locationRiskScores[pred.location_id] = {
          location_id: pred.location_id,
          location_name: pred.location_name,
          risk_score: 0,
          predictions: [],
          high_risk_parameters: 0
        };
      }
      
      locationRiskScores[pred.location_id].predictions.push(pred);
      
      // Calculate risk score based on risk level and confidence
      let riskWeight = 0;
      switch (pred.risk_level) {
        case 'low': riskWeight = 1; break;
        case 'medium': riskWeight = 2; break;
        case 'high': riskWeight = 3; break;
        case 'critical': riskWeight = 4; break;
      }
      
      locationRiskScores[pred.location_id].risk_score += 
        (riskWeight * pred.confidence_score) / 100;
      
      if (pred.risk_level === 'high' || pred.risk_level === 'critical') {
        locationRiskScores[pred.location_id].high_risk_parameters++;
      }
    });

    // Convert to array and sort by risk score
    const hotspots = Object.values(locationRiskScores)
      .sort((a, b) => b.risk_score - a.risk_score)
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      data: hotspots,
      count: hotspots.length
    });

  } catch (error) {
    console.error('Error fetching hotspots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch hotspots',
      message: error.message
    });
  }
});

// GET /api/predictions/stats - Get prediction statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total_predictions: mockPredictions.length,
      average_confidence: mockPredictions.reduce((sum, pred) => sum + pred.confidence_score, 0) / mockPredictions.length,
      risk_level_distribution: {
        low: mockPredictions.filter(pred => pred.risk_level === 'low').length,
        medium: mockPredictions.filter(pred => pred.risk_level === 'medium').length,
        high: mockPredictions.filter(pred => pred.risk_level === 'high').length,
        critical: mockPredictions.filter(pred => pred.risk_level === 'critical').length
      },
      forecast_hours_distribution: {
        '24h': mockPredictions.filter(pred => pred.forecast_hours === 24).length,
        '48h': mockPredictions.filter(pred => pred.forecast_hours === 48).length,
        '72h': mockPredictions.filter(pred => pred.forecast_hours === 72).length
      },
      parameters_predicted: [...new Set(mockPredictions.map(pred => pred.parameter))],
      model_versions: [...new Set(mockPredictions.map(pred => pred.model_version))],
      locations_with_predictions: [...new Set(mockPredictions.map(pred => pred.location_id))].length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching prediction stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prediction statistics',
      message: error.message
    });
  }
});

// POST /api/predictions/generate - Generate new predictions (mock)
router.post('/generate', async (req, res) => {
  try {
    const { location_ids, parameters, forecast_hours = 24 } = req.body;

    // Mock prediction generation
    const newPredictions = [];
    const locations = location_ids || [1, 2, 3, 4, 5];
    const params = parameters || ['BOD', 'TDS', 'pH', 'DO'];

    locations.forEach(locationId => {
      params.forEach(param => {
        const prediction = {
          id: mockPredictions.length + newPredictions.length + 1,
          location_id: locationId,
          location_name: `Location ${locationId}`,
          parameter: param,
          predicted_value: Math.random() * 20,
          confidence_score: Math.random() * 40 + 60, // 60-100%
          prediction_date: new Date(Date.now() + forecast_hours * 60 * 60 * 1000).toISOString(),
          forecast_hours: forecast_hours,
          model_version: "v1.2",
          risk_level: Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low',
          created_at: new Date().toISOString()
        };
        newPredictions.push(prediction);
      });
    });

    // In a real implementation, this would trigger the AI model
    // For now, we'll just return the mock predictions
    res.json({
      success: true,
      message: 'Predictions generated successfully',
      data: newPredictions,
      count: newPredictions.length
    });

  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictions',
      message: error.message
    });
  }
});

module.exports = router;

