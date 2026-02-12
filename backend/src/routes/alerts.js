/**
 * Alerts Routes with Database Integration
 * Provides API endpoints for water quality alerts
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { validate, validationRules } = require('../middleware/validation');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const { authenticate, authorize } = require('../middleware/auth');
const logger = require('../utils/logger');

const lastValue = (value) =>
  Array.isArray(value) ? value[value.length - 1] : value;

/**
 * @route   GET /api/alerts
 * @desc    Get all alerts with filtering
 * @access  Public
 */
router.get(
  '/',
  validate(
    validationRules.pagination,
    validationRules.dateRange,
    validationRules.parameter
  ),
  asyncHandler(async (req, res) => {
    const status = lastValue(req.query.status);
    const severity = lastValue(req.query.severity);
    const location_id = lastValue(req.query.location_id);
    const parameter = lastValue(req.query.parameter);
    const alert_type = lastValue(req.query.alert_type);
    const start_date = lastValue(req.query.start_date);
    const end_date = lastValue(req.query.end_date);
    const limit = lastValue(req.query.limit) ?? 100;
    const offset = lastValue(req.query.offset) ?? 0;

    let query = db('alerts as a')
      .join('locations as l', 'a.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'a.parameter_id', 'wqp.id')
      .select(
        'a.id',
        'a.location_id',
        'l.name as location_name',
        'l.state',
        'wqp.parameter_name as parameter',
        'a.alert_type',
        'a.severity',
        'a.message',
        'a.threshold_value',
        'a.actual_value',
        'a.status',
        'a.triggered_at',
        'a.resolved_at',
        'a.notification_sent',
        'a.created_at'
      );

    // Apply filters
    if (status) {
      query = query.where('a.status', status);
    }

    if (severity) {
      query = query.where('a.severity', severity);
    }

    if (location_id) {
      query = query.where('a.location_id', location_id);
    }

    if (parameter) {
      query = query.where(
        'wqp.parameter_code',
        String(parameter).toUpperCase()
      );
    }

    if (alert_type) {
      query = query.where('a.alert_type', alert_type);
    }

    if (start_date) {
      query = query.where('a.triggered_at', '>=', start_date);
    }

    if (end_date) {
      query = query.where('a.triggered_at', '<=', end_date);
    }

    // Get total count
    const countQuery = query.clone().clearSelect().count('* as count');
    const [{ count }] = await countQuery;
    const total = parseInt(count);

    // Get paginated data
    const alerts = await query
      .orderBy('a.triggered_at', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    res.json({
      success: true,
      data: alerts,
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
 * @route   GET /api/alerts/active
 * @desc    Get active alerts only
 * @access  Public
 */
router.get(
  '/active',
  validate(validationRules.pagination),
  asyncHandler(async (req, res) => {
    const severity = lastValue(req.query.severity);
    const limit = lastValue(req.query.limit) ?? 50;

    // Use the active_alerts view for efficient querying
    let query = db('active_alerts');

    if (severity) {
      query = query.where('severity', severity);
    }

    const alerts = await query
      .orderBy('triggered_at', 'desc')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: alerts,
      count: alerts.length,
    });
  })
);

/**
 * @route   GET /api/alerts/stats
 * @desc    Get alert statistics
 * @access  Public
 */
router.get(
  '/stats',
  validate(validationRules.dateRange),
  asyncHandler(async (req, res) => {
    const start_date = lastValue(req.query.start_date);
    const end_date = lastValue(req.query.end_date);

    let baseQuery = db('alerts');

    if (start_date) {
      baseQuery = baseQuery.where('triggered_at', '>=', start_date);
    }

    if (end_date) {
      baseQuery = baseQuery.where('triggered_at', '<=', end_date);
    }

    // Total alerts
    const [{ count: total_alerts }] = await baseQuery
      .clone()
      .count('* as count');

    // Status distribution
    const statusDistribution = await baseQuery
      .clone()
      .select('status')
      .count('* as count')
      .groupBy('status');

    const statusCounts = {
      active: 0,
      resolved: 0,
      dismissed: 0,
    };

    statusDistribution.forEach((row) => {
      if (row.status) {
        statusCounts[row.status] = parseInt(row.count);
      }
    });

    // Severity distribution
    const severityDistribution = await baseQuery
      .clone()
      .select('severity')
      .count('* as count')
      .groupBy('severity');

    const severityCounts = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    severityDistribution.forEach((row) => {
      if (row.severity) {
        severityCounts[row.severity] = parseInt(row.count);
      }
    });

    // Alert types
    const alertTypes = await baseQuery
      .clone()
      .select('alert_type')
      .count('* as count')
      .groupBy('alert_type');

    // Parameters with alerts
    const parameters = await baseQuery
      .clone()
      .join('water_quality_parameters as wqp', 'alerts.parameter_id', 'wqp.id')
      .distinct('wqp.parameter_code')
      .pluck('wqp.parameter_code');

    // Locations with alerts
    const [{ count: locations_with_alerts }] = await baseQuery
      .clone()
      .countDistinct('location_id as count');

    // Average resolution time (in hours)
    const resolvedAlerts = await baseQuery
      .clone()
      .where('status', 'resolved')
      .whereNotNull('resolved_at')
      .select('triggered_at', 'resolved_at');

    let avgResolutionTime = null;
    if (resolvedAlerts.length > 0) {
      const totalTime = resolvedAlerts.reduce((sum, alert) => {
        const triggered = new Date(alert.triggered_at);
        const resolved = new Date(alert.resolved_at);
        return sum + (resolved - triggered);
      }, 0);
      avgResolutionTime = (
        totalTime /
        resolvedAlerts.length /
        (1000 * 60 * 60)
      ).toFixed(2); // Convert to hours
    }

    const stats = {
      total_alerts: parseInt(total_alerts),
      active_alerts: statusCounts.active,
      resolved_alerts: statusCounts.resolved,
      dismissed_alerts: statusCounts.dismissed,
      severity_distribution: severityCounts,
      alert_types: alertTypes.reduce((acc, row) => {
        acc[row.alert_type] = parseInt(row.count);
        return acc;
      }, {}),
      parameters_with_alerts: parameters,
      locations_with_alerts: parseInt(locations_with_alerts),
      average_resolution_time_hours: avgResolutionTime,
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   GET /api/alerts/:id
 * @desc    Get specific alert
 * @access  Public
 */
router.get(
  '/:id',
  validate(validationRules.id),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const alert = await db('alerts as a')
      .join('locations as l', 'a.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'a.parameter_id', 'wqp.id')
      .where('a.id', id)
      .select(
        'a.*',
        'l.name as location_name',
        'l.state',
        'l.district',
        'l.latitude',
        'l.longitude',
        'wqp.parameter_name as parameter',
        'wqp.parameter_code',
        'wqp.unit'
      )
      .first();

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found',
      });
    }

    res.json({
      success: true,
      data: alert,
    });
  })
);

/**
 * @route   PUT /api/alerts/:id/resolve
 * @desc    Resolve an alert
 * @access  Private (requires admin/moderator role)
 */
router.put(
  '/:id/resolve',
  authenticate,
  authorize('admin', 'moderator'),
  validate(validationRules.id, validationRules.alertResolution),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    // Check if alert exists and is active
    const alert = await db('alerts').where({ id }).first();

    if (!alert) {
      throw new APIError('Alert not found', 404);
    }

    if (alert.status === 'resolved') {
      throw new APIError('Alert is already resolved', 400);
    }

    // Update alert
    const [updatedAlert] = await db('alerts')
      .where({ id })
      .update({
        status: 'resolved',
        resolved_at: new Date(),
        resolution_notes: resolution_notes || null,
      })
      .returning('*');

    logger.info(`Alert ${id} resolved by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Alert resolved successfully',
      data: updatedAlert,
    });
  })
);

/**
 * @route   PUT /api/alerts/:id/dismiss
 * @desc    Dismiss an alert
 * @access  Private (requires admin/moderator role)
 */
router.put(
  '/:id/dismiss',
  authenticate,
  authorize('admin', 'moderator'),
  validate(validationRules.id, validationRules.alertDismissal),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dismissal_reason } = req.body;

    // Check if alert exists and is active
    const alert = await db('alerts').where({ id }).first();

    if (!alert) {
      throw new APIError('Alert not found', 404);
    }

    if (alert.status !== 'active') {
      throw new APIError('Only active alerts can be dismissed', 400);
    }

    // Update alert
    const [updatedAlert] = await db('alerts')
      .where({ id })
      .update({
        status: 'dismissed',
        dismissal_reason: dismissal_reason || null,
      })
      .returning('*');

    logger.info(`Alert ${id} dismissed by user ${req.user.id}`);

    res.json({
      success: true,
      message: 'Alert dismissed successfully',
      data: updatedAlert,
    });
  })
);

module.exports = router;
