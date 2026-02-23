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

    // Optimized aggregation using Knex instead of fetching all rows
    const baseQuery = db('water_quality_readings')
      .join('locations', 'water_quality_readings.location_id', 'locations.id')
      .join(
        'water_quality_parameters',
        'water_quality_readings.parameter_id',
        'water_quality_parameters.id'
      );

    if (state) {
      baseQuery.whereILike('locations.state', `%${state}%`);
    }

    if (parameter) {
      baseQuery.where(
        'water_quality_parameters.parameter_code',
        String(parameter).toUpperCase()
      );
    }

    // Execute queries in parallel for better performance
    const [overview, riskLevels, parameters, states] = await Promise.all([
      // Get aggregate stats
      baseQuery.clone().first(
        db.raw('COUNT(*) as total_readings'),
        db.raw('AVG(quality_score) as average_score'),
        db.raw('MAX(measurement_date) as latest_date')
      ),
      // Get risk distribution
      baseQuery
        .clone()
        .select('risk_level')
        .count('* as count')
        .groupBy('risk_level'),
      // Get distinct parameters
      baseQuery
        .clone()
        .distinct('water_quality_parameters.parameter_code')
        .pluck('water_quality_parameters.parameter_code')
        .orderBy('water_quality_parameters.parameter_code'),
      // Get distinct states
      baseQuery
        .clone()
        .distinct('locations.state')
        .pluck('locations.state')
        .orderBy('locations.state'),
    ]);

    const riskLevelDistribution = { low: 0, medium: 0, high: 0, critical: 0 };
    (riskLevels || []).forEach((r) => {
      if (r.risk_level && riskLevelDistribution[r.risk_level] !== undefined) {
        riskLevelDistribution[r.risk_level] = parseInt(r.count, 10);
      }
    });

    res.json({
      success: true,
      data: {
        total_readings: parseInt(overview?.total_readings || 0, 10),
        risk_level_distribution: riskLevelDistribution,
        average_quality_score: overview?.average_score
          ? parseFloat(overview.average_score).toFixed(2)
          : null,
        parameters_monitored: parameters || [],
        states_monitored: states || [],
        latest_reading: overview?.latest_date || null,
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
