/**
 * AI Predictions Routes with Database Integration
 * Provides API endpoints for AI-generated water quality predictions
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { validate, validationRules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/predictions
 * @desc    Get all AI predictions
 * @access  Public
 */
router.get(
  '/',
  validate(validationRules.pagination, validationRules.riskLevel, validationRules.parameter),
  asyncHandler(async (req, res) => {
    const { location_id, parameter, risk_level, forecast_hours, model_version, limit = 100, offset = 0 } = req.query;

    let query = db('ai_predictions as ap')
      .join('locations as l', 'ap.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'ap.parameter_id', 'wqp.id')
      .select(
        'ap.id',
        'ap.location_id',
        'l.name as location_name',
        'l.state',
        'wqp.parameter_name as parameter',
        'wqp.parameter_code',
        'ap.predicted_value',
        'ap.confidence_score',
        'ap.prediction_date',
        'ap.forecast_hours',
        'ap.model_version',
        'ap.risk_level',
        'ap.created_at'
      );

    // Apply filters
    if (location_id) {
      query = query.where('ap.location_id', location_id);
    }

    if (parameter) {
      query = query.where('wqp.parameter_code', parameter.toUpperCase());
    }

    if (risk_level) {
      query = query.where('ap.risk_level', risk_level);
    }

    if (forecast_hours) {
      query = query.where('ap.forecast_hours', forecast_hours);
    }

    if (model_version) {
      query = query.where('ap.model_version', model_version);
    }

    // Get total count
    const countQuery = query.clone().clearSelect().count('* as count');
    const [{ count }] = await countQuery;
    const total = parseInt(count);

    // Get paginated data
    const predictions = await query
      .orderBy('ap.prediction_date', 'desc')
      .limit(limit)
      .offset(offset);

    res.json({
      success: true,
      data: predictions,
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
 * @route   GET /api/predictions/location/:locationId
 * @desc    Get predictions for specific location
 * @access  Public
 */
router.get(
  '/location/:locationId',
  validate(validationRules.locationId, validationRules.parameter, validationRules.pagination),
  asyncHandler(async (req, res) => {
    const { locationId } = req.params;
    const { parameter, forecast_hours, limit = 50 } = req.query;

    let query = db('ai_predictions as ap')
      .join('water_quality_parameters as wqp', 'ap.parameter_id', 'wqp.id')
      .where('ap.location_id', locationId)
      .select(
        'ap.id',
        'wqp.parameter_name as parameter',
        'wqp.parameter_code',
        'ap.predicted_value',
        'ap.confidence_score',
        'ap.prediction_date',
        'ap.forecast_hours',
        'ap.model_version',
        'ap.risk_level',
        'ap.created_at'
      );

    if (parameter) {
      query = query.where('wqp.parameter_code', parameter.toUpperCase());
    }

    if (forecast_hours) {
      query = query.where('ap.forecast_hours', forecast_hours);
    }

    const predictions = await query
      .orderBy('ap.prediction_date', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: predictions,
      count: predictions.length
    });
  })
);

/**
 * @route   GET /api/predictions/hotspots
 * @desc    Get pollution hotspots based on predictions
 * @access  Public
 */
router.get(
  '/hotspots',
  asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;

    // Get locations with high-risk predictions
    const hotspots = await db('ai_predictions as ap')
      .join('locations as l', 'ap.location_id', 'l.id')
      .select(
        'ap.location_id',
        'l.name as location_name',
        'l.state',
        'l.latitude',
        'l.longitude'
      )
      .count('* as prediction_count')
      .countDistinct('ap.parameter_id as high_risk_parameters')
      .avg('ap.confidence_score as avg_confidence')
      .whereIn('ap.risk_level', ['high', 'critical'])
      .groupBy('ap.location_id', 'l.name', 'l.state', 'l.latitude', 'l.longitude')
      .orderBy('prediction_count', 'desc')
      .orderBy('high_risk_parameters', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: hotspots,
      count: hotspots.length
    });
  })
);

/**
 * @route   GET /api/predictions/stats
 * @desc    Get prediction statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    // Total predictions
    const [{ count: total_predictions }] = await db('ai_predictions').count('* as count');

    // Average confidence
    const [{ avg_confidence }] = await db('ai_predictions').avg('confidence_score as avg_confidence');

    // Risk level distribution
    const riskDistribution = await db('ai_predictions')
      .select('risk_level')
      .count('* as count')
      .groupBy('risk_level');

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

    // Forecast hours distribution
    const forecastDistribution = await db('ai_predictions')
      .select('forecast_hours')
      .count('* as count')
      .groupBy('forecast_hours');

    // Parameters predicted
    const parameters = await db('ai_predictions as ap')
      .join('water_quality_parameters as wqp', 'ap.parameter_id', 'wqp.id')
      .distinct('wqp.parameter_code')
      .pluck('wqp.parameter_code');

    // Model versions
    const modelVersions = await db('ai_predictions')
      .distinct('model_version')
      .whereNotNull('model_version')
      .pluck('model_version');

    // Locations with predictions
    const [{ count: locations_with_predictions }] = await db('ai_predictions')
      .countDistinct('location_id as count');

    const stats = {
      total_predictions: parseInt(total_predictions),
      average_confidence: avg_confidence ? parseFloat(avg_confidence).toFixed(2) : null,
      risk_level_distribution: riskLevelCounts,
      forecast_hours_distribution: forecastDistribution.reduce((acc, row) => {
        acc[`${row.forecast_hours}h`] = parseInt(row.count);
        return acc;
      }, {}),
      parameters_predicted: parameters,
      model_versions: modelVersions,
      locations_with_predictions: parseInt(locations_with_predictions)
    };

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * @route   GET /api/predictions/:id
 * @desc    Get specific prediction
 * @access  Public
 */
router.get(
  '/:id',
  validate(validationRules.id),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const prediction = await db('ai_predictions as ap')
      .join('locations as l', 'ap.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'ap.parameter_id', 'wqp.id')
      .where('ap.id', id)
      .select(
        'ap.*',
        'l.name as location_name',
        'l.state',
        'l.district',
        'wqp.parameter_name as parameter',
        'wqp.parameter_code',
        'wqp.unit'
      )
      .first();

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
  })
);

module.exports = router;
