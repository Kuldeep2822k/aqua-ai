/**
 * Auth Controller
 * Handles HTTP request parsing, calls the service layer, and formats responses.
 * Contains zero business logic.
 */

const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const { asyncHandler, APIError } = require('../middleware/errorHandler');
const { HTTP_STATUS } = require('../constants');

/**
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  const result = await authService.registerUser({ email, password, name });

  res.status(HTTP_STATUS.CREATED).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

/**
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.loginUser({ email, password });

  res.json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

/**
 * GET /api/auth/me
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);

  res.json({
    success: true,
    data: user,
  });
});

/**
 * PUT /api/auth/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new APIError(
      'Validation failed',
      HTTP_STATUS.BAD_REQUEST,
      errors.array()
    );
  }

  const { name, email } = req.body;
  const user = await authService.updateUserProfile(
    req.user.id,
    { name, email },
    req.user.email
  );

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user,
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};
