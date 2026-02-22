/**
 * Alerts Routes - Supabase REST API Version
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
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
  validate(validationRules.pagination, validationRules.dateRange, validationRules.parameter),
  asyncHandler(async (req, res) => {
    const status = lastValue(req.query.status);
    const severity = lastValue(req.query.severity);
    const location_id = lastValue(req.query.location_id);
    const parameter = lastValue(req.query.parameter);
    const alert_type = lastValue(req.query.alert_type);
    const start_date = lastValue(req.query.start_date);
    const end_date = lastValue(req.query.end_date);
    const limit = parseInt(lastValue(req.query.limit) ?? 100);
    const offset = parseInt(lastValue(req.query.offset) ?? 0);

    let query = supabase
      .from('alerts')
      .select(`
        id, location_id, alert_type, severity, message, threshold_value, actual_value,
        status, triggered_at, resolved_at, notification_sent, created_at,
        locations!inner ( name, state ),
        water_quality_parameters!inner ( parameter_name, parameter_code )
      `, { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (severity) query = query.eq('severity', severity);
    if (location_id) query = query.eq('location_id', location_id);
    if (parameter) query = query.eq('water_quality_parameters.parameter_code', parameter.toUpperCase());
    if (alert_type) query = query.eq('alert_type', alert_type);
    if (start_date) query = query.gte('triggered_at', start_date);
    if (end_date) query = query.lte('triggered_at', end_date);

    const { data, count, error } = await query
      .order('triggered_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    const alerts = (data || []).map((row) => ({
      id: row.id,
      location_id: row.location_id,
      location_name: row.locations?.name,
      state: row.locations?.state,
      parameter: row.water_quality_parameters?.parameter_name,
      alert_type: row.alert_type,
      severity: row.severity,
      message: row.message,
      threshold_value: row.threshold_value,
      actual_value: row.actual_value,
      status: row.status,
      triggered_at: row.triggered_at,
      resolved_at: row.resolved_at,
      notification_sent: row.notification_sent,
      created_at: row.created_at,
    }));

    res.json({
      success: true,
      data: alerts,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: offset + limit < (count || 0),
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
    const limit = parseInt(lastValue(req.query.limit) ?? 50);

    let query = supabase
      .from('active_alerts')
      .select('*');

    if (severity) query = query.eq('severity', severity);

    const { data, error } = await query
      .order('triggered_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    res.json({ success: true, data: data || [], count: (data || []).length });
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

    let query = supabase
      .from('alerts')
      .select(`
        status, severity, alert_type, location_id, triggered_at, resolved_at,
        water_quality_parameters!inner ( parameter_code )
      `);

    if (start_date) query = query.gte('triggered_at', start_date);
    if (end_date) query = query.lte('triggered_at', end_date);

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const all = rows || [];
    const statusCounts = { active: 0, resolved: 0, dismissed: 0 };
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    const alertTypeCounts = {};
    const parameterSet = new Set();
    const locationSet = new Set();
    const resolvedAlerts = [];

    for (const row of all) {
      if (row.status && statusCounts[row.status] !== undefined) statusCounts[row.status]++;
      if (row.severity && severityCounts[row.severity] !== undefined) severityCounts[row.severity]++;
      if (row.alert_type) alertTypeCounts[row.alert_type] = (alertTypeCounts[row.alert_type] || 0) + 1;
      if (row.water_quality_parameters?.parameter_code) parameterSet.add(row.water_quality_parameters.parameter_code);
      if (row.location_id) locationSet.add(row.location_id);
      if (row.status === 'resolved' && row.resolved_at) resolvedAlerts.push(row);
    }

    let avgResolutionTime = null;
    if (resolvedAlerts.length > 0) {
      const totalMs = resolvedAlerts.reduce((sum, a) => {
        return sum + (new Date(a.resolved_at) - new Date(a.triggered_at));
      }, 0);
      avgResolutionTime = (totalMs / resolvedAlerts.length / (1000 * 60 * 60)).toFixed(2);
    }

    res.json({
      success: true,
      data: {
        total_alerts: all.length,
        active_alerts: statusCounts.active,
        resolved_alerts: statusCounts.resolved,
        dismissed_alerts: statusCounts.dismissed,
        severity_distribution: severityCounts,
        alert_types: alertTypeCounts,
        parameters_with_alerts: [...parameterSet],
        locations_with_alerts: locationSet.size,
        average_resolution_time_hours: avgResolutionTime,
      },
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

    const { data, error } = await supabase
      .from('alerts')
      .select(`
        *,
        locations!inner ( name, state, district, latitude, longitude ),
        water_quality_parameters!inner ( parameter_name, parameter_code, unit )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    res.json({
      success: true,
      data: {
        ...data,
        location_name: data.locations?.name,
        state: data.locations?.state,
        district: data.locations?.district,
        latitude: data.locations?.latitude,
        longitude: data.locations?.longitude,
        parameter: data.water_quality_parameters?.parameter_name,
        parameter_code: data.water_quality_parameters?.parameter_code,
        unit: data.water_quality_parameters?.unit,
        locations: undefined,
        water_quality_parameters: undefined,
      },
    });
  })
);

/**
 * @route   PUT /api/alerts/:id/resolve
 * @desc    Resolve an alert
 */
router.put(
  '/:id/resolve',
  authenticate,
  authorize('admin', 'moderator'),
  validate(validationRules.id, validationRules.alertResolution),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const { data: alert } = await supabase.from('alerts').select('id, status').eq('id', id).single();
    if (!alert) throw new APIError('Alert not found', 404);
    if (alert.status === 'resolved') throw new APIError('Alert is already resolved', 400);

    const { data: updated, error } = await supabase
      .from('alerts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolution_notes: resolution_notes || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    logger.info(`Alert ${id} resolved by user ${req.user.id}`);
    res.json({ success: true, message: 'Alert resolved successfully', data: updated });
  })
);

/**
 * @route   PUT /api/alerts/:id/dismiss
 * @desc    Dismiss an alert
 */
router.put(
  '/:id/dismiss',
  authenticate,
  authorize('admin', 'moderator'),
  validate(validationRules.id, validationRules.alertDismissal),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dismissal_reason } = req.body;

    const { data: alert } = await supabase.from('alerts').select('id, status').eq('id', id).single();
    if (!alert) throw new APIError('Alert not found', 404);
    if (alert.status !== 'active') throw new APIError('Only active alerts can be dismissed', 400);

    const { data: updated, error } = await supabase
      .from('alerts')
      .update({ status: 'dismissed', dismissal_reason: dismissal_reason || null })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    logger.info(`Alert ${id} dismissed by user ${req.user.id}`);
    res.json({ success: true, message: 'Alert dismissed successfully', data: updated });
  })
);

module.exports = router;
