/**
 * Water Quality Routes - Supabase REST API Version
 */

const express = require('express');
const router = express.Router();
const { supabase } = require('../db/supabase');
const { db } = require('../db/connection');
const { validate, validationRules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { optionalAuth } = require('../middleware/auth');

const lastValue = (value) =>
  Array.isArray(value) ? value[value.length - 1] : value;

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
    const location_id = lastValue(req.query.location_id);
    const parameter = lastValue(req.query.parameter);
    const state = lastValue(req.query.state);
    const risk_level = lastValue(req.query.risk_level);
    const start_date = lastValue(req.query.start_date);
    const end_date = lastValue(req.query.end_date);
    const limit = parseInt(lastValue(req.query.limit) ?? 100);
    const offset = parseInt(lastValue(req.query.offset) ?? 0);

    let query = supabase.from('water_quality_readings').select(
      `
        id,
        value,
        measurement_date,
        source,
        risk_level,
        quality_score,
        locations!inner ( id, name, state, district, latitude, longitude ),
        water_quality_parameters!inner ( parameter_name, parameter_code, unit )
      `,
      { count: 'exact' }
    );

    if (location_id) {
      const parsedId = Number(location_id);
      if (Number.isFinite(parsedId)) {
        query = query.eq('location_id', parsedId);
      } else {
        query = query.ilike('locations.name', `%${location_id}%`);
      }
    }

    if (parameter) {
      query = query.eq(
        'water_quality_parameters.parameter_code',
        String(parameter).toUpperCase()
      );
    }

    if (state) {
      query = query.ilike('locations.state', `%${state}%`);
    }

    if (risk_level) {
      query = query.eq('risk_level', risk_level);
    }

    if (start_date) {
      query = query.gte('measurement_date', start_date);
    }

    if (end_date) {
      query = query.lte('measurement_date', end_date);
    }

    const { data, error, count } = await query
      .order('measurement_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    // Flatten nested objects to match original API shape
    const flattened = (data || []).map((row) => ({
      id: row.id,
      location_id: row.locations?.id,
      location_name: row.locations?.name,
      state: row.locations?.state,
      district: row.locations?.district,
      latitude: row.locations?.latitude,
      longitude: row.locations?.longitude,
      parameter: row.water_quality_parameters?.parameter_name,
      parameter_code: row.water_quality_parameters?.parameter_code,
      value: row.value,
      unit: row.water_quality_parameters?.unit,
      measurement_date: row.measurement_date,
      source: row.source,
      risk_level: row.risk_level,
      quality_score: row.quality_score,
    }));

    res.json({
      success: true,
      data: flattened,
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
 * @route   GET /api/water-quality/parameters
 * @desc    Get available water quality parameters
 * @access  Public
 */
router.get(
  '/parameters',
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from('water_quality_parameters')
      .select(
        'parameter_code, parameter_name, unit, safe_limit, moderate_limit, high_limit, critical_limit, description'
      )
      .order('parameter_code');

    if (error) throw new Error(error.message);

    const parameters = (data || []).map((p) => ({
      code: p.parameter_code,
      name: p.parameter_name,
      unit: p.unit,
      safe_limit: p.safe_limit,
      moderate_limit: p.moderate_limit,
      high_limit: p.high_limit,
      critical_limit: p.critical_limit,
      description: p.description,
    }));

    res.json({ success: true, data: parameters });
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
    const state = lastValue(req.query.state);
    const parameter = lastValue(req.query.parameter);

    // ⚡ Bolt: Use Knex server-side aggregations to avoid O(N) memory and serialization bottleneck
    // Previously, this endpoint pulled all records into Node.js memory.
    const baseQuery = db('water_quality_readings as wqr')
      .join('locations as l', 'wqr.location_id', 'l.id')
      .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id');

    if (state) {
      baseQuery.where('l.state', 'ilike', `%${state}%`);
    }

    if (parameter) {
      baseQuery.where(
        'wqp.parameter_code',
        '=',
        String(parameter).toUpperCase()
      );
    }

    // Clone base query for distinct operations
    const [
      totalResult,
      riskResult,
      avgResult,
      paramsResult,
      statesResult,
      latestResult,
    ] = await Promise.all([
      baseQuery.clone().count('* as total').first(),
      baseQuery
        .clone()
        .select('wqr.risk_level')
        .count('* as count')
        .whereNotNull('wqr.risk_level')
        .groupBy('wqr.risk_level'),
      baseQuery.clone().avg('wqr.quality_score as avg_score').first(),
      baseQuery
        .clone()
        .distinct('wqp.parameter_code')
        .whereNotNull('wqp.parameter_code'),
      baseQuery.clone().distinct('l.state').whereNotNull('l.state'),
      baseQuery.clone().max('wqr.measurement_date as latest_date').first(),
    ]);

    const totalCount = parseInt(totalResult?.total || 0, 10);

    const riskLevelCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    for (const row of riskResult) {
      if (row.risk_level && riskLevelCounts[row.risk_level] !== undefined) {
        riskLevelCounts[row.risk_level] = parseInt(row.count || 0, 10);
      }
    }

    const avgScore =
      avgResult?.avg_score != null
        ? Number(avgResult.avg_score).toFixed(2)
        : null;

    const parameters = paramsResult.map((row) => row.parameter_code);
    const states = statesResult.map((row) => row.state);
    const latestDate = latestResult?.latest_date || null;

    res.json({
      success: true,
      data: {
        total_readings: totalCount,
        risk_level_distribution: riskLevelCounts,
        average_quality_score: avgScore,
        parameters_monitored: parameters,
        states_monitored: states,
        latest_reading: latestDate,
      },
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
    const parameter = lastValue(req.query.parameter);
    const limit = parseInt(lastValue(req.query.limit) ?? 50);

    let query = supabase
      .from('water_quality_readings')
      .select(
        `
        id,
        value,
        measurement_date,
        risk_level,
        quality_score,
        source,
        water_quality_parameters!inner ( parameter_name, parameter_code, unit )
      `
      )
      .eq('location_id', locationId)
      .order('measurement_date', { ascending: false })
      .limit(limit);

    if (parameter) {
      query = query.eq(
        'water_quality_parameters.parameter_code',
        parameter.toUpperCase()
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const readings = (data || []).map((row) => ({
      id: row.id,
      parameter: row.water_quality_parameters?.parameter_name,
      parameter_code: row.water_quality_parameters?.parameter_code,
      value: row.value,
      unit: row.water_quality_parameters?.unit,
      measurement_date: row.measurement_date,
      risk_level: row.risk_level,
      quality_score: row.quality_score,
      source: row.source,
    }));

    res.json({ success: true, data: readings, count: readings.length });
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

    const { data, error } = await supabase
      .from('water_quality_readings')
      .select(
        `
        id,
        value,
        measurement_date,
        risk_level,
        quality_score,
        source,
        is_validated,
        validation_notes,
        created_at,
        locations!inner ( id, name, state, district, latitude, longitude ),
        water_quality_parameters!inner ( parameter_name, parameter_code, unit )
      `
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      return res
        .status(404)
        .json({ success: false, error: 'Water quality reading not found' });
    }

    res.json({
      success: true,
      data: {
        id: data.id,
        location_id: data.locations?.id,
        location_name: data.locations?.name,
        state: data.locations?.state,
        district: data.locations?.district,
        latitude: data.locations?.latitude,
        longitude: data.locations?.longitude,
        parameter: data.water_quality_parameters?.parameter_name,
        parameter_code: data.water_quality_parameters?.parameter_code,
        value: data.value,
        unit: data.water_quality_parameters?.unit,
        measurement_date: data.measurement_date,
        risk_level: data.risk_level,
        quality_score: data.quality_score,
        source: data.source,
        is_validated: data.is_validated,
        validation_notes: data.validation_notes,
        created_at: data.created_at,
      },
    });
  })
);

module.exports = router;
