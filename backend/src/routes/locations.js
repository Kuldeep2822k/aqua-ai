/**
 * Locations Routes
 * Thin wiring layer.
 * Named routes (/states, /geojson, /stats, /risk-summary) before /:id param.
 */

const express = require('express');

const router = express.Router();
const { validate, validationRules } = require('../middleware/validation');
const { optionalAuth } = require('../middleware/auth');
const locationsController = require('../controllers/locationsController');

router.get(
  '/',
  validate(validationRules.pagination, validationRules.state),
  optionalAuth,
  locationsController.getAll
);

router.get('/states', locationsController.getStates);
router.get('/geojson', locationsController.getGeoJSON);
router.get('/stats', locationsController.getStats);
router.get('/risk-summary', locationsController.getRiskSummary);
router.get('/search', optionalAuth, locationsController.search);

// Must be LAST so named routes above match first
router.get(
  '/:id',
  validate(validationRules.locationId),
  optionalAuth,
  locationsController.getById
);

module.exports = router;
