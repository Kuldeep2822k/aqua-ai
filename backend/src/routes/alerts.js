/**
 * Alerts Routes
 * Thin wiring layer connecting endpoints to controllers via middleware.
 */

const express = require('express');

const router = express.Router();
const { validate, validationRules } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const alertsController = require('../controllers/alertsController');

router.get(
  '/',
  validate(
    validationRules.pagination,
    validationRules.dateRange,
    validationRules.parameter
  ),
  alertsController.getAll
);

router.get(
  '/active',
  validate(validationRules.pagination),
  alertsController.getActive
);

router.get(
  '/stats',
  validate(validationRules.dateRange),
  alertsController.getStats
);

router.get('/:id', validate(validationRules.id), alertsController.getById);

router.put(
  '/:id/resolve',
  authenticate,
  authorize('admin', 'moderator'),
  validate(validationRules.id, validationRules.alertResolution),
  alertsController.resolve
);

router.put(
  '/:id/dismiss',
  authenticate,
  authorize('admin', 'moderator'),
  validate(validationRules.id, validationRules.alertDismissal),
  alertsController.dismiss
);

module.exports = router;
