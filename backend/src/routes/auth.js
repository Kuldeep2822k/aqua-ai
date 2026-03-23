/**
 * Authentication Routes
 * Thin wiring layer: connects HTTP endpoints to controllers via middleware.
 */

const express = require('express');

const router = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');
const authController = require('../controllers/authController');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(validationRules.userRegistration),
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate(validationRules.userLogin),
  authController.login
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/me',
  authenticate,
  validate([
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters')
      .matches(/^[\p{L}\s\-'.]+$/u)
      .withMessage(
        'Name can only contain letters, spaces, hyphens, apostrophes, and dots'
      ),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
  ]),
  authController.updateProfile
);

module.exports = router;
