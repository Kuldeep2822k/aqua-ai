/**
 * Enhanced Error Handler Middleware
 * Provides structured error responses and logging
 */

const logger = require('../utils/logger');

/**
 * Custom API Error class
 */
class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
  });

  // Mongoose/Knex duplicate key error
  if (err.code === '23505') {
    error = new APIError('Duplicate field value entered', 400);
  }

  // Mongoose/Knex validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
    error = new APIError(message, 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new APIError('Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new APIError('Token expired', 401);
  }

  // Database connection errors
  if (err.code === 'ECONNREFUSED') {
    error = new APIError('Database connection failed', 503);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: error.details,
    }),
  });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
  const error = new APIError(`Route not found: ${req.originalUrl}`, 404);
  next(error);
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  APIError,
  errorHandler,
  notFound,
  asyncHandler,
};
