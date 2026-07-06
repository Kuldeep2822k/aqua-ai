/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { APIError } = require('./errorHandler');
const logger = require('../utils/logger');

// Validate JWT_SECRET exists
let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    logger.warn(
      'FATAL: JWT_SECRET environment variable is not set. Authentication will fail.'
    );
  } else {
    // In development/test, generate a random secret if none provided to ensure security (prevents hardcoded defaults)
    logger.warn(
      'JWT_SECRET not set, generating temporary secret for development'
    );
    const crypto = require('crypto');
    JWT_SECRET = crypto.randomBytes(32).toString('hex');
  }
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const verifyAuthHeader = (authHeader, requireToken = true) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (requireToken) {
      throw new APIError('No token provided', 401);
    }
    return null;
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    throw new APIError('Invalid token format', 401);
  }
  return jwt.verify(token, JWT_SECRET);
};

const handleJwtError = (error, next) => {
  if (error.name === 'JsonWebTokenError') {
    return next(new APIError('Invalid token', 401));
  }
  if (error.name === 'TokenExpiredError') {
    return next(new APIError('Token expired', 401));
  }
  return next(error);
};

/**
 * Verify JWT token and attach user to request
 */
const authenticate = (req, res, next) => {
  try {
    const decoded = verifyAuthHeader(req.headers.authorization, true);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    handleJwtError(error, next);
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  try {
    const decoded = verifyAuthHeader(req.headers.authorization, false);
    if (decoded) {
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
    }
    next();
  } catch (error) {
    logger.warn('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Check if user has required role
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new APIError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new APIError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Generate JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role || 'user',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  generateToken,
};
