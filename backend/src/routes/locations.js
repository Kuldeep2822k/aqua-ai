/**
 * Locations Routes with Database Integration
 * Provides API endpoints for monitoring locations
 */

const express = require('express');
const router = express.Router();
const { db } = require('../db/connection');
const { validate, validationRules } = require('../middleware/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sanitizeLikeSearch } = require('../utils/security');
const { computeDerivedWqi } = require('../utils/wqi');

async function getDerivedWqiByLocationIds(locationIds) {
  if (!Array.isArray(locationIds) || locationIds.length === 0) return new Map();

  const rows = await db('water_quality_readings as wqr')
    .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
    .whereIn('wqr.location_id', locationIds)
    .distinctOn('wqr.location_id', 'wqr.parameter_id')
    .orderBy('wqr.location_id')
    .orderBy('wqr.parameter_id')
    .orderBy('wqr.measurement_date', 'desc')
    .select(
      'wqr.location_id',
      'wqp.parameter_code',
      'wqr.value',
      'wqp.safe_limit',
      'wqp.moderate_limit',
      'wqp.high_limit',
      'wqp.critical_limit'
    );

  const grouped = new Map();
  for (const row of rows) {
    const key = String(row.location_id);
    const list = grouped.get(key) || [];
    list.push(row);
    grouped.set(key, list);
  }

  const derived = new Map();
  for (const [locationId, readings] of grouped.entries()) {
    derived.set(locationId, computeDerivedWqi(readings));
  }
  return derived;
}

/**
 * @route   GET /api/locations
 * @desc    Get all monitoring locations
 * @access  Public
 */
router.get(
  '/',
  validate(
    validationRules.pagination,
    validationRules.state,
    validationRules.riskLevel
  ),
  asyncHandler(async (req, res) => {
    const {
      state,
      water_body_type,
      has_alerts,
      limit = 100,
      offset = 0,
    } = req.query;

    // Use the location_summary view for efficient querying
    let query = db('location_summary as ls').join('locations as l', 'ls.id', 'l.id');

    // Apply filters
    if (state) {
      query = query.where(
        'ls.state',
        'like',
        `%${sanitizeLikeSearch(state)}%`
      );
    }

    if (water_body_type) {
      query = query.where('l.water_body_type', water_body_type);
    }

    if (has_alerts === 'true') {
      query = query.where('ls.active_alerts', '>', 0);
    }

    // Get total count
    const countQuery = query.clone().count('* as count');
    const [{ count }] = await countQuery;
    const total = parseInt(count);

    // Get paginated data
    const locations = await query
      .select(
        'ls.*',
        'l.water_body_type',
        'l.water_body_name',
        'l.population_affected'
      )
      .limit(limit)
      .offset(offset)
      .orderBy('ls.name');

    const derived = await getDerivedWqiByLocationIds(
      locations.map((l) => l.id)
    );
    const data = locations.map((loc) => {
      const wqi = derived.get(String(loc.id));
      return {
        ...loc,
        derived_wqi_score: wqi?.score ?? null,
        derived_wqi_category: wqi?.category ?? null,
        derived_risk_level: wqi?.risk_level ?? null,
        derived_parameters_used: wqi?.parameters_used ?? 0,
      };
    });

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
 * @route   GET /api/locations/stats
 * @desc    Get location statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    // Total locations
    const [{ count: total_locations }] =
      await db('locations').count('* as count');

    // States covered
    const states = await db('locations').distinct('state').pluck('state');

    // Water body types
    const waterBodyTypes = await db('locations')
      .distinct('water_body_type')
      .whereNotNull('water_body_type')
      .pluck('water_body_type');

    // Locations with alerts
    const [{ count: locations_with_alerts }] = await db('location_summary')
      .where('active_alerts', '>', 0)
      .count('* as count');

    // Average WQI score
    const [{ avg_score }] = await db('location_summary').avg(
      'avg_wqi_score as avg_score'
    );
    let averageWqiScore = avg_score ? parseFloat(avg_score) : null;
    if (averageWqiScore === null || Number.isNaN(averageWqiScore)) {
      const locationIds = await db('locations').pluck('id');
      const derived = await getDerivedWqiByLocationIds(locationIds);
      let sum = 0;
      let count = 0;
      for (const wqi of derived.values()) {
        if (wqi?.score !== null && Number.isFinite(Number(wqi.score))) {
          sum += Number(wqi.score);
          count += 1;
        }
      }
      if (count > 0) averageWqiScore = sum / count;
    }

    // Total population affected
    const [{ total_pop }] = await db('locations').sum(
      'population_affected as total_pop'
    );

    const stats = {
      total_locations: parseInt(total_locations),
      states_covered: states.length,
      water_body_types: waterBodyTypes,
      total_population_affected: parseInt(total_pop) || 0,
      locations_with_alerts: parseInt(locations_with_alerts),
      average_wqi_score:
        averageWqiScore !== null && Number.isFinite(averageWqiScore)
          ? averageWqiScore.toFixed(2)
          : null,
    };

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * @route   GET /api/locations/geojson
 * @desc    Get locations as GeoJSON for mapping
 * @access  Public
 */
router.get(
  '/geojson',
  asyncHandler(async (req, res) => {
    const locations = await db('locations as l')
      .leftJoin('location_summary as ls', 'l.id', 'ls.id')
      .select(
        'l.id',
        'l.name',
        'l.state',
        'l.district',
        'l.latitude',
        'l.longitude',
        'l.water_body_type',
        'l.water_body_name',
        'l.population_affected',
        'ls.avg_wqi_score',
        'ls.active_alerts',
        'ls.last_reading'
      );

    const derived = await getDerivedWqiByLocationIds(
      locations.map((l) => l.id)
    );
    const geojson = {
      type: 'FeatureCollection',
      features: locations.map((location) => {
        const wqi = derived.get(String(location.id));
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [
              parseFloat(location.longitude),
              parseFloat(location.latitude),
            ],
          },
          properties: {
            id: location.id,
            name: location.name,
            state: location.state,
            district: location.district,
            water_body_type: location.water_body_type,
            water_body_name: location.water_body_name,
            population_affected: location.population_affected,
            avg_wqi_score: location.avg_wqi_score,
            derived_wqi_score: wqi?.score ?? null,
            derived_wqi_category: wqi?.category ?? null,
            derived_risk_level: wqi?.risk_level ?? null,
            derived_parameters_used: wqi?.parameters_used ?? 0,
            active_alerts: location.active_alerts,
            last_reading: location.last_reading,
          },
        };
      }),
    };

    res.json({
      success: true,
      data: geojson,
    });
  })
);

/**
 * @route   GET /api/locations/search
 * @desc    Search locations by name, state, or district
 * @access  Public
 */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Search query parameter "q" is required',
      });
    }

    const searchTerm = `%${sanitizeLikeSearch(q)}%`;
    const results = await db('locations')
      .where('name', 'like', searchTerm)
      .orWhere('state', 'like', searchTerm)
      .orWhere('district', 'like', searchTerm)
      .limit(parseInt(limit))
      .select(
        'id',
        'name',
        'state',
        'district',
        'latitude',
        'longitude',
        'water_body_type'
      );

    res.json({
      success: true,
      data: results,
      count: results.length,
    });
  })
);

/**
 * @route   GET /api/locations/:id
 * @desc    Get specific location with detailed information
 * @access  Public
 */
router.get(
  '/:id',
  validate(validationRules.id),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const location = await db('locations as l')
      .leftJoin('location_summary as ls', 'l.id', 'ls.id')
      .where('l.id', id)
      .select(
        'l.*',
        'ls.parameters_monitored',
        'ls.last_reading',
        'ls.avg_wqi_score',
        'ls.active_alerts'
      )
      .first();

    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Location not found',
      });
    }

    const derived = await getDerivedWqiByLocationIds([location.id]);
    const wqi = derived.get(String(location.id));
    res.json({
      success: true,
      data: {
        ...location,
        derived_wqi_score: wqi?.score ?? null,
        derived_wqi_category: wqi?.category ?? null,
        derived_risk_level: wqi?.risk_level ?? null,
        derived_parameters_used: wqi?.parameters_used ?? 0,
      },
    });
  })
);

module.exports = router;
