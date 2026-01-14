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
        logger.warn('FATAL: JWT_SECRET environment variable is not set. Authentication will fail.');
    } else {
        logger.warn('JWT_SECRET not set, using default for development');
        JWT_SECRET = 'dev_secret_key_123';
    }
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new APIError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Attach user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new APIError('Invalid token', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new APIError('Token expired', 401));
        }
        next(error);
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);

            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };
        }

        next();
    } catch (error) {
        // Continue without user if token is invalid
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
            role: user.role || 'user'
        },
        JWT_SECRET,
        {
            expiresIn: JWT_EXPIRES_IN
        }
    );
};

module.exports = {
    authenticate,
    optionalAuth,
    authorize,
    generateToken
};
