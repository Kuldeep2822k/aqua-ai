/**
 * Authentication Routes
 * Handles user registration, login, and profile management
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, authenticate } = require('../middleware/auth');
const { validate, validationRules } = require('../middleware/validation');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

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
                    role: user.role
                },
                token
            }
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
        if (!user) {
            throw new APIError('Invalid credentials', 401);
        }

        // Verify password
        const isMatch = await User.verifyPassword(password, user.password);
        if (!isMatch) {
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
                    role: user.role
                },
                token
            }
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
            data: user
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
    asyncHandler(async (req, res) => {
        const { name, email } = req.body;

        const updates = {};
        if (name) updates.name = name;
        if (email) updates.email = email;

        const user = await User.update(req.user.id, updates);

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    })
);

module.exports = router;
