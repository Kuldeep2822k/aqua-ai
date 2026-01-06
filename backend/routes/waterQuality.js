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
      offset = 0
    } = req.query;

    // Build query
    let query = db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
      .select(
        'wqr.id',
        'l.name as location_name',
        'l.state',
        'l.district',
        'l.latitude',
        'l.longitude',
        'wqp.parameter_name as parameter',
        'wqr.value',
        'wqp.unit',
        'wqr.measurement_date',
        'wqr.risk_level',
        'wqr.quality_score',
        'wqr.source'
      );

    // Apply filters
    if (location_id) {
      query = query.where('wqr.location_id', location_id);
    }

    if (parameter) {
      query = query.where('wqp.parameter_code', parameter.toUpperCase());
    }

    if (state) {
      query = query.where('l.state', 'ilike', `%${state}%`);
    }

    if (risk_level) {
      query = query.where('wqr.risk_level', risk_level);
    }

    if (start_date) {
      query = query.where('wqr.measurement_date', '>=', start_date);
    }

    if (end_date) {
      query = query.where('wqr.measurement_date', '<=', end_date);
    }

    // Get total count
    const countQuery = query.clone().clearSelect().count('* as count');
    const [{ count }] = await countQuery;
    const total = parseInt(count);

    // Apply pagination and ordering
    const data = await query
      .orderBy('wqr.measurement_date', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  })
);

/**
 * @route   GET /api/water-quality/parameters
 * @desc    Get available water quality parameters
 * @access  Public
 */
router.get(
  '/parameters',
  asyncHandler(async (req, res) => {
    const parameters = await db('water_quality_parameters')
      .select(
        'parameter_code as code',
        'parameter_name as name',
        'unit',
        'safe_limit',
        'moderate_limit',
        'high_limit',
        'critical_limit',
        'description'
      )
      .orderBy('parameter_name');

    res.json({
      success: true,
      data: parameters
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

    // Build base query
    let query = db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id');

    // Apply filters
    if (state) {
      query = query.where('l.state', 'ilike', `%${state}%`);
    }

    if (parameter) {
      query = query.where('wqp.parameter_code', parameter.toUpperCase());
    }

    // Get risk level distribution
    const riskDistribution = await query.clone()
      .select('wqr.risk_level')
      .count('* as count')
      .groupBy('wqr.risk_level');

    const riskLevelCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    riskDistribution.forEach(row => {
      if (row.risk_level) {
        riskLevelCounts[row.risk_level] = parseInt(row.count);
      }
    });

    // Get average quality score
    const [avgScore] = await query.clone()
      .avg('wqr.quality_score as avg_score');

    // Get unique parameters
    const parameters = await query.clone()
      .distinct('wqp.parameter_code')
      .pluck('wqp.parameter_code');

    // Get unique states
    const states = await query.clone()
      .distinct('l.state')
      .pluck('l.state');

    // Get latest reading
    const [latestReading] = await query.clone()
      .select('wqr.measurement_date')
      .orderBy('wqr.measurement_date', 'desc')
      .limit(1);

    // Get total readings
    const [{ count }] = await query.clone().count('* as count');

    const stats = {
      total_readings: parseInt(count),
      risk_level_distribution: riskLevelCounts,
      average_quality_score: avgScore.avg_score ? parseFloat(avgScore.avg_score).toFixed(2) : null,
      parameters_monitored: parameters,
      states_monitored: states,
      latest_reading: latestReading?.measurement_date || null
    };

    res.json({
      success: true,
      data: stats
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
  validate(validationRules.locationId, validationRules.parameter, validationRules.pagination),
  asyncHandler(async (req, res) => {
    const { locationId } = req.params;
    const { parameter, limit = 50 } = req.query;

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
      query = query.where('wqp.parameter_code', parameter.toUpperCase());
    }

    const readings = await query
      .orderBy('wqr.measurement_date', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: readings,
      count: readings.length
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
        error: 'Water quality reading not found'
      });
    }

    res.json({
      success: true,
      data: reading
    });
  })
);

module.exports = router;
