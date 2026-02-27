/**
 * Locations Routes - Supabase REST API Version
 * IMPORTANT: Named routes (/states, /geojson, /stats, /risk-summary) must come
 * BEFORE the /:id param route to avoid the integer validation catching them.
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
 * @route   GET /api/locations
 * @desc    Get all locations with latest WQI summary
 * @access  Public
 */
router.get(
  '/',
  validate(validationRules.pagination, validationRules.state),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const state = lastValue(req.query.state);
    const risk_level = lastValue(req.query.risk_level);
    const limit = parseInt(lastValue(req.query.limit) ?? 100);
    const offset = parseInt(lastValue(req.query.offset) ?? 0);

    let query = supabase
      .from('location_summary')
      .select('*', { count: 'exact' });

    if (state) query = query.ilike('state', `%${state}%`);
    if (risk_level) query = query.eq('risk_level', risk_level);

    const { data, count, error } = await query
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    res.json({
      success: true,
      data: data || [],
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
 * @route   GET /api/locations/states
 * @desc    Get list of unique states
 * @access  Public
 */
router.get(
  '/states',
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from('locations')
      .select('state')
      .order('state');

    if (error) throw new Error(error.message);

    const states = [
      ...new Set((data || []).map((r) => r.state).filter(Boolean)),
    ];
    res.json({ success: true, data: states });
  })
);

/**
 * @route   GET /api/locations/geojson
 * @desc    Get all locations as a GeoJSON FeatureCollection
 * @access  Public
 */
router.get(
  '/geojson',
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from('location_summary')
      .select('*')
      .order('name');

    if (error) throw new Error(error.message);

    const features = (data || []).map((loc) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [loc.longitude, loc.latitude],
      },
      properties: loc,
    }));

    res.json({
      success: true,
      data: {
        type: 'FeatureCollection',
        features,
      },
    });
  })
);

/**
 * @route   GET /api/locations/stats
 * @desc    Get location statistics summary
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    // Optimized: Use a single Knex query instead of fetching all rows
    const result = await db('location_summary')
      .select(
        db.raw('COUNT(*) as total_locations'),
        db.raw('COUNT(DISTINCT state) as states_covered'),
        db.raw(
          "COUNT(CASE WHEN active_alerts > 0 THEN 1 END) as locations_with_alerts"
        ),
        db.raw('AVG(avg_wqi_score) as average_wqi_score')
      )
      .first();

    // Fetch distinct water body types separately (Postgres specific ARRAY_AGG can be complex across environments)
    const typesResult = await db('location_summary')
      .distinct('water_body_type')
      .whereNotNull('water_body_type')
      .pluck('water_body_type');

    res.json({
      success: true,
      data: {
        total_locations: parseInt(result?.total_locations || 0),
        states_covered: parseInt(result?.states_covered || 0),
        water_body_types: typesResult || [],
        locations_with_alerts: parseInt(result?.locations_with_alerts || 0),
        average_wqi_score:
          result?.average_wqi_score != null
            ? parseFloat(result.average_wqi_score).toFixed(2)
            : null,
      },
    });
  })
);

/**
 * @route   GET /api/locations/risk-summary
 * @desc    Get risk level summary counts
 * @access  Public
 */
router.get(
  '/risk-summary',
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from('location_summary')
      .select('risk_level');

    if (error) throw new Error(error.message);

    const counts = { safe: 0, moderate: 0, poor: 0, critical: 0, unknown: 0 };
    for (const row of data || []) {
      const level = row.risk_level || 'unknown';
      counts[level] = (counts[level] || 0) + 1;
    }

    res.json({ success: true, data: counts });
  })
);

router.get(
  '/search',
  optionalAuth,
  asyncHandler(async (req, res) => {
    const q = lastValue(req.query.q);
    const limit = parseInt(lastValue(req.query.limit) ?? 20);

    let query = supabase.from('location_summary').select('*');

    if (q) query = query.ilike('name', `%${q}%`);

    const { data, error } = await query.order('name').limit(limit);

    if (error) throw new Error(error.message);

    res.json({ success: true, data: data || [] });
  })
);

/**
 * @route   GET /api/locations/:id
 * @desc    Get a specific location with latest readings
 * @access  Public
 * NOTE: This must be LAST so named routes above are matched first.
 */
router.get(
  '/:id',
  validate(validationRules.locationId),
  optionalAuth,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (locError || !location) {
      return res
        .status(404)
        .json({ success: false, error: 'Location not found' });
    }

    const { data: readings, error: readingsError } = await supabase
      .from('water_quality_readings')
      .select(
        `
        id, value, measurement_date, risk_level, quality_score, source,
        water_quality_parameters!inner ( parameter_name, parameter_code, unit )
      `
      )
      .eq('location_id', id)
      .order('measurement_date', { ascending: false })
      .limit(20);

    if (readingsError) throw new Error(readingsError.message);

    const { data: summary } = await supabase
      .from('location_summary')
      .select('*')
      .eq('id', id)
      .single();

    const latestReadings = (readings || []).map((row) => ({
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

    res.json({
      success: true,
      data: {
        ...location,
        wqi_score: summary?.avg_wqi_score ?? null,
        risk_level: summary?.risk_level ?? null,
        latest_readings: latestReadings,
      },
    });
  })
);

module.exports = router;
