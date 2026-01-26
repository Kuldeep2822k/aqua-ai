/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Dummy hash for timing attack mitigation (valid bcrypt hash)
const DUMMY_PASSWORD_HASH =
  '$2a$10$oDVAl7ocw0lEobg94NoAl.agsTwIcwFrp3ejm7ZktOroFedC.QJw.';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  validate(validationRules.userRegistration),
  asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new APIError('User already exists with this email', 400);
    }

    // Create user
    const user = await User.create({ email, password, name });

    // Generate token
    const token = generateToken(user);

    logger.info(`New user registered: ${email}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  validate(validationRules.userLogin),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);

    // Timing Attack Mitigation:
    // Always perform password verification to ensure the request time is consistent
    // regardless of whether the user exists or not.
    const hashToVerify = user ? user.password : DUMMY_PASSWORD_HASH;
    const isMatch = await User.verifyPassword(password, hashToVerify);

    if (!user || !isMatch) {
      throw new APIError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user);

    logger.info(`User logged in: ${email}`);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      throw new APIError('User not found', 404);
    }

    res.json({
      success: true,
      data: user,
    });
  })
);

/**
 * @route   PUT /api/auth/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/me',
  authenticate,
  [
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be 2-100 characters')
      .matches(/^[\p{L}\s\-'.]+$/u)
      .withMessage('Name can only contain letters, spaces, hyphens, apostrophes, and dots'),
    body('email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Invalid email format'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new APIError('Validation failed', 400, errors.array());
    }

    const { name, email } = req.body;

    // Check if email already exists
    if (email && email !== req.user.email) {
      const existing = await User.findByEmail(email);
      if (existing) {
        throw new APIError('Email already in use', 400);
      }
    }

    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;

    const user = await User.update(req.user.id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  })
);

module.exports = router;
