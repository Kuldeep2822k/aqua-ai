/**
 * Water Quality Routes with Database Integration
 * Provides API endpoints for water quality data
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { validate, validationRules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');
const { sanitizeLikeSearch } = require('../utils/security');

/**
 * @route   GET /api/water-quality
 * @desc    Get all water quality readings with filtering
 * @access  Public
 */
router.get(
  '/',
  validate(
    validationRules.pagination,
    validationRules.dateRange,
    validationRules.riskLevel,
    validationRules.state,
    validationRules.parameter
  ),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const {
      location_id,
      parameter,
      state,
      risk_level,
      start_date,
      end_date,
      limit = 100,
      offset = 0,
    } = req.query;

    // Build query - simplified for SQLite schema
    let query = db('water_quality_readings as wqr')
      .select(
        'wqr.id',
        'wqr.location_name',
        'wqr.state',
        'wqr.district',
        'wqr.latitude',
        'wqr.longitude',
        'wqr.parameter',
        'wqr.value',
        'wqr.unit',
        'wqr.measurement_date',
        'wqr.source'
      );

    // Apply filters
    if (location_id) {
      query = query.where('wqr.location_name', location_id);
    }

    if (parameter) {
      query = query.where('wqr.parameter', parameter.toUpperCase());
    }

    if (state) {
      query = query.where('wqr.state', 'like', `%${sanitizeLikeSearch(state)}%`);
    }

    if (start_date) {
      query = query.where('wqr.measurement_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('wqr.measurement_date', '<=', end_date);
    }

    // Get total count
    const countQuery = db('water_quality_readings as wqr');
    if (parameter) countQuery.where('parameter', parameter.toUpperCase());
    if (state) countQuery.where('state', 'like', `%${sanitizeLikeSearch(state)}%`);
    const [{ count }] = await countQuery.count('* as count');
    const total = parseInt(count);

    // Apply pagination and ordering
    const data = await query
      .orderBy('wqr.measurement_date', 'desc')
      .limit(limit)
      .offset(offset);

    // Add computed risk_level and quality_score
    const enrichedData = data.map(reading => ({
      ...reading,
      risk_level: calculateRiskFromValue(reading.parameter, reading.value),
      quality_score: calculateQualityScore(reading.parameter, reading.value),
    }));

    res.json({
      success: true,
      data: enrichedData,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total,
      },
    });
  })
);

// Helper function to calculate risk level from parameter value
function calculateRiskFromValue(parameter, value) {
  const thresholds = {
    'pH': { low: [6.5, 8.5], medium: [6.0, 9.0], high: [5.5, 9.5] },
    'BOD': { low: 3, medium: 6, high: 10 },
    'DO': { low: 6, medium: 4, high: 2 },
    'TDS': { low: 500, medium: 1000, high: 1500 },
    'Turbidity': { low: 10, medium: 25, high: 50 },
    'Coliform': { low: 50, medium: 500, high: 2000 },
  };

  const threshold = thresholds[parameter];
  if (!threshold) return 'medium';

  if (parameter === 'pH') {
    if (value >= threshold.low[0] && value <= threshold.low[1]) return 'low';
    if (value >= threshold.medium[0] && value <= threshold.medium[1]) return 'medium';
    return 'high';
  } else if (parameter === 'DO') {
    if (value >= threshold.low) return 'low';
    if (value >= threshold.medium) return 'medium';
    if (value >= threshold.high) return 'high';
    return 'critical';
  } else {
    if (value <= threshold.low) return 'low';
    if (value <= threshold.medium) return 'medium';
    if (value <= threshold.high) return 'high';
    return 'critical';
  }
}

// Helper function to calculate quality score
function calculateQualityScore(parameter, value) {
  const risk = calculateRiskFromValue(parameter, value);
  switch (risk) {
    case 'low': return 90;
    case 'medium': return 70;
    case 'high': return 40;
    case 'critical': return 20;
    default: return 50;
  }
}

/**
 * @route   GET /api/water-quality/parameters
 * @desc    Get available water quality parameters
 * @access  Public
 */
router.get(
  '/parameters',
  asyncHandler(async (_req, res) => {
    // Hardcoded parameters for SQLite development
    const parameters = [
      { code: 'pH', name: 'pH Level', unit: '', safe_limit: 6.5, description: 'Acidity/alkalinity measure' },
      { code: 'BOD', name: 'Biochemical Oxygen Demand', unit: 'mg/L', safe_limit: 3, description: 'Measures organic pollution' },
      { code: 'DO', name: 'Dissolved Oxygen', unit: 'mg/L', safe_limit: 6, description: 'Oxygen available for aquatic life' },
      { code: 'TDS', name: 'Total Dissolved Solids', unit: 'mg/L', safe_limit: 500, description: 'General measure of water purity' },
      { code: 'Turbidity', name: 'Turbidity', unit: 'NTU', safe_limit: 10, description: 'Water clarity measure' },
      { code: 'Coliform', name: 'Coliform Count', unit: 'MPN/100ml', safe_limit: 50, description: 'Bacterial contamination indicator' },
    ];

    res.json({
      success: true,
      data: parameters,
    });
  })
);

/**
 * @route   GET /api/water-quality/stats
 * @desc    Get water quality statistics
 * @access  Public
 */
router.get(
  '/stats',
  validate(validationRules.state, validationRules.parameter),
  asyncHandler(async (req, res) => {
    const { state, parameter } = req.query;

    // Build base query for SQLite schema
    let baseQuery = db('water_quality_readings');

    // Apply filters
    if (state) {
      baseQuery = baseQuery.where('state', 'like', `%${sanitizeLikeSearch(state)}%`);
    }

    if (parameter) {
      baseQuery = baseQuery.where('parameter', parameter.toUpperCase());
    }

    // Get all readings and calculate risk levels
    const readings = await baseQuery.clone().select('parameter', 'value');

    const riskLevelCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    readings.forEach((reading) => {
      const risk = calculateRiskFromValue(reading.parameter, reading.value);
      if (riskLevelCounts[risk] !== undefined) {
        riskLevelCounts[risk]++;
      }
    });

    // Get unique parameters
    const parameters = await baseQuery
      .clone()
      .distinct('parameter')
      .pluck('parameter');

    // Get unique states
    const states = await baseQuery.clone().distinct('state').pluck('state');

    // Get latest reading
    const [latestReading] = await baseQuery
      .clone()
      .select('measurement_date')
      .orderBy('measurement_date', 'desc')
      .limit(1);

    // Get total readings
    const [{ count }] = await baseQuery.clone().count('* as count');

    // Calculate average quality score
    let totalScore = 0;
    readings.forEach(reading => {
      totalScore += calculateQualityScore(reading.parameter, reading.value);
    });
    const avgScore = readings.length > 0 ? (totalScore / readings.length).toFixed(2) : null;

    const stats = {
      total_readings: parseInt(count),
      risk_level_distribution: riskLevelCounts,
      average_quality_score: avgScore,
      parameters_monitored: parameters,
      states_monitored: states,
      latest_reading: latestReading?.measurement_date || null,
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   GET /api/water-quality/location/:locationId
 * @desc    Get all readings for a specific location
 * @access  Public
 */
router.get(
  '/location/:locationId',
  validate(
    validationRules.locationId,
    validationRules.parameter,
    validationRules.pagination
  ),
  asyncHandler(async (req, res) => {
    const { locationId } = req.params;
    const { parameter, limit = 50, latest_per_parameter } = req.query;

    let query = db('water_quality_readings as wqr')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
      .where('wqr.location_id', locationId)
      .select(
        'wqr.id',
        'wqp.parameter_name as parameter',
        'wqp.parameter_code',
        'wqr.value',
        'wqp.unit',
        'wqr.measurement_date',
        'wqr.risk_level',
        'wqr.quality_score',
        'wqr.source'
      );

    if (parameter) {
      query = query.whereRaw('UPPER(wqp.parameter_code) = ?', [
        parameter.toUpperCase(),
      ]);
    }

    if (latest_per_parameter === 'true') {
      if (parameter) {
        query = query.orderBy('wqr.measurement_date', 'desc').limit(1);
      } else {
        query = query
          .distinctOn('wqr.parameter_id')
          .orderBy('wqr.parameter_id')
          .orderBy('wqr.measurement_date', 'desc')
          .limit(limit);
      }
    } else {
      query = query.orderBy('wqr.measurement_date', 'desc').limit(limit);
    }

    const readings = await query;

    res.json({
      success: true,
      data: readings,
      count: readings.length,
    });
  })
);

/**
 * @route   GET /api/water-quality/:id
 * @desc    Get specific water quality reading
 * @access  Public
 */
router.get(
  '/:id',
  validate(validationRules.id),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const reading = await db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
      .where('wqr.id', id)
      .select(
        'wqr.id',
        'l.id as location_id',
        'l.name as location_name',
        'l.state',
        'l.district',
        'l.latitude',
        'l.longitude',
        'wqp.parameter_name as parameter',
        'wqp.parameter_code',
        'wqr.value',
        'wqp.unit',
        'wqr.measurement_date',
        'wqr.risk_level',
        'wqr.quality_score',
        'wqr.source',
        'wqr.is_validated',
        'wqr.validation_notes',
        'wqr.created_at'
      )
      .first();

    if (!reading) {
      return res.status(404).json({
        success: false,
        error: 'Water quality reading not found',
      });
    }

    res.json({
      success: true,
      data: reading,
    });
  })
);

module.exports = router;
