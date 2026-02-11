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

    let query = db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
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
        'wqr.source',
        'wqr.risk_level',
        'wqr.quality_score'
      );

    // Apply filters
    if (location_id) {
      const parsedId = Number(location_id);
      if (Number.isFinite(parsedId)) {
        query = query.where('wqr.location_id', parsedId);
      } else {
        query = query.where(
          'l.name',
          'like',
          `%${sanitizeLikeSearch(String(location_id))}%`
        );
      }
    }

    if (parameter) {
      query = query.whereRaw('UPPER(wqp.parameter_code) = ?', [
        parameter.toUpperCase(),
      ]);
    }

    if (state) {
      query = query.where('l.state', 'like', `%${sanitizeLikeSearch(state)}%`);
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
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total,
      },
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
  asyncHandler(async (_req, res) => {
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
      .orderBy('parameter_code');

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

    let baseQuery = db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id');

    // Apply filters
    if (state) {
      baseQuery = baseQuery.where(
        'l.state',
        'like',
        `%${sanitizeLikeSearch(state)}%`
      );
    }

    if (parameter) {
      baseQuery = baseQuery.whereRaw('UPPER(wqp.parameter_code) = ?', [
        String(parameter).toUpperCase(),
      ]);
    }

    const [{ count }] = await baseQuery.clone().count('* as count');

    const distributionRows = await baseQuery
      .clone()
      .select('wqr.risk_level')
      .count('* as count')
      .groupBy('wqr.risk_level');

    const riskLevelCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    for (const row of distributionRows) {
      if (row.risk_level && riskLevelCounts[row.risk_level] !== undefined) {
        riskLevelCounts[row.risk_level] = parseInt(row.count);
      }
    }

    const parameters = await baseQuery
      .clone()
      .distinct('wqp.parameter_code')
      .pluck('wqp.parameter_code');

    const states = await baseQuery.clone().distinct('l.state').pluck('l.state');

    const [latestReading] = await baseQuery
      .clone()
      .select('wqr.measurement_date')
      .orderBy('wqr.measurement_date', 'desc')
      .limit(1);

    const [{ avg_quality_score }] = await baseQuery
      .clone()
      .whereNotNull('wqr.quality_score')
      .avg('wqr.quality_score as avg_quality_score');

    let avgScore =
      avg_quality_score === null || avg_quality_score === undefined
        ? null
        : Number(avg_quality_score).toFixed(2);

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
