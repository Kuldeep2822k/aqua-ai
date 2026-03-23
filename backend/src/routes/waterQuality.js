/**
 * Water Quality Routes
 * Thin wiring layer connecting endpoints to controllers via middleware.
 */

const express = require('express');

const router = express.Router();
const { validate, validationRules } = require('../middleware/validation');
const { optionalAuth } = require('../middleware/auth');
const waterQualityController = require('../controllers/waterQualityController');

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
  waterQualityController.getReadings
);

router.get('/parameters', waterQualityController.getParameters);

router.get(
  '/stats',
  validate(validationRules.state, validationRules.parameter),
  waterQualityController.getStats
);

router.get(
  '/location/:locationId',
  validate(
    validationRules.locationId,
    validationRules.parameter,
    validationRules.pagination
  ),
  waterQualityController.getByLocation
);

router.get(
  '/:id',
  validate(validationRules.id),
  waterQualityController.getById
);

module.exports = router;
