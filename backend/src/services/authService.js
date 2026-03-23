/**
 * Auth Service
 * Pure business logic for authentication, separated from HTTP concerns.
 */

const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { APIError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Dummy hash for timing-attack mitigation (valid bcrypt hash)
const DUMMY_PASSWORD_HASH =
  '$2a$10$oDVAl7ocw0lEobg94NoAl.agsTwIcwFrp3ejm7ZktOroFedC.QJw.';

/**
 * Register a new user.
 * @param {{ email: string, password: string, name: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
async function registerUser({ email, password, name }) {
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new APIError('User already exists with this email', 400);
  }

  const user = await User.create({ email, password, name });
  const token = generateToken(user);

  logger.info(`New user registered: ${email}`);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

/**
 * Authenticate user credentials.
 * Uses constant-time comparison to mitigate timing attacks.
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ user: object, token: string }>}
 */
async function loginUser({ email, password }) {
  const user = await User.findByEmail(email);

  // Timing Attack Mitigation: always verify to keep response time consistent
  const hashToVerify = user ? user.password : DUMMY_PASSWORD_HASH;
  const isMatch = await User.verifyPassword(password, hashToVerify);

  if (!user || !isMatch) {
    throw new APIError('Invalid credentials', 401);
  }

  const token = generateToken(user);

  logger.info(`User logged in: ${email}`);

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    token,
  };
}

/**
 * Get user profile by ID.
 * @param {number|string} userId
 * @returns {Promise<object>}
 */
async function getUserProfile(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new APIError('User not found', 404);
  }
  return user;
}

/**
 * Update user profile.
 * @param {number|string} userId
 * @param {{ name?: string, email?: string }} updates
 * @param {string} currentEmail - the user's current email for conflict check
 * @returns {Promise<object>}
 */
async function updateUserProfile(userId, updates, currentEmail) {
  if (updates.email && updates.email !== currentEmail) {
    const existing = await User.findByEmail(updates.email);
    if (existing) {
      throw new APIError('Email already in use', 400);
    }
  }

  const cleanUpdates = {};
  if (updates.name) {
    cleanUpdates.name = updates.name;
  }
  if (updates.email) {
    cleanUpdates.email = updates.email;
  }

  return User.update(userId, cleanUpdates);
}

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
};
