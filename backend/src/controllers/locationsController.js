/**
 * Locations Controller
 * Handles HTTP request parsing and delegates to the service layer.
 */

const locationsService = require('../services/locationsService');
const { asyncHandler } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../constants');
const { lastValue } = require('../utils/queryHelpers');

const getAll = asyncHandler(async (req, res) => {
  const result = await locationsService.getLocations({
    state: lastValue(req.query.state),
    risk_level: lastValue(req.query.risk_level),
    limit: parseInt(lastValue(req.query.limit) ?? 100, 10),
    offset: parseInt(lastValue(req.query.offset) ?? 0, 10),
  });

  res.json({ success: true, ...result });
});

const getStates = asyncHandler(async (_req, res) => {
  const states = await locationsService.getStates();
  res.json({ success: true, data: states });
});

const getGeoJSON = asyncHandler(async (_req, res) => {
  const geoJSON = await locationsService.getGeoJSON();
  res.json({ success: true, data: geoJSON });
});

const getStats = asyncHandler(async (_req, res) => {
  const stats = await locationsService.getLocationStats();
  res.json({ success: true, data: stats });
});

const getRiskSummary = asyncHandler(async (_req, res) => {
  const counts = await locationsService.getRiskSummary();
  res.json({ success: true, data: counts });
});

const search = asyncHandler(async (req, res) => {
  const data = await locationsService.searchLocations(
    lastValue(req.query.q),
    parseInt(lastValue(req.query.limit) ?? 20, 10)
  );
  res.json({ success: true, data });
});

const getById = asyncHandler(async (req, res) => {
  const location = await locationsService.getLocationById(req.params.id);

  if (!location) {
    return res
      .status(HTTP_STATUS.NOT_FOUND)
      .json({ success: false, error: 'Location not found' });
  }

  res.json({ success: true, data: location });
});

module.exports = {
  getAll,
  getStates,
  getGeoJSON,
  getStats,
  getRiskSummary,
  search,
  getById,
};
