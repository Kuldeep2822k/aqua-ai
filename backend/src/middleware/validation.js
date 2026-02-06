/**
 * Input Validation Middleware
 * Provides validation schemas and middleware for request validation
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // Pagination
  pagination: [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Limit must be between 1 and 1000')
      .toInt(),
    query('offset')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Offset must be a non-negative integer')
      .toInt(),
  ],

  // ID parameter
  id: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID must be a positive integer')
      .toInt(),
  ],

  // Location ID
  locationId: [
    param('locationId')
      .isInt({ min: 1 })
      .withMessage('Location ID must be a positive integer')
      .toInt(),
  ],

  // Date range
  dateRange: [
    query('start_date')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('end_date')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
  ],

  // Risk level
  riskLevel: [
    query('risk_level')
      .optional()
      .isIn(['low', 'medium', 'high', 'critical'])
      .withMessage('Risk level must be one of: low, medium, high, critical'),
  ],

  // State
  state: [
    query('state')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('State must be between 2 and 100 characters'),
  ],

  // Parameter
  parameter: [
    query('parameter')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Parameter must be between 2 and 50 characters'),
  ],

  // User registration
  userRegistration: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number'
      ),
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[\p{L}\s\-'.]+$/u)
      .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and dots'),
  ],

  // User login
  userLogin: [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],

  // Alert resolution
  alertResolution: [
    body('resolution_notes')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Resolution notes cannot exceed 1000 characters'),
  ],

  // Alert dismissal
  alertDismissal: [
    body('dismissal_reason')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Dismissal reason cannot exceed 1000 characters'),
  ],
};

/**
 * Combine validation rules
 */
const validate = (...rules) => {
  return [...rules.flat(), handleValidationErrors];
};

module.exports = {
  validationRules,
  validate,
  handleValidationErrors,
};
