/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * This middleware prevents HPP attacks by ensuring that query parameters are single values.
 * If duplicate parameters are provided (resulting in an array), it takes the last value.
 * This prevents filter bypasses and logic errors in downstream code that expects strings.
 */

const logger = require('../utils/logger');

const hpp = (req, res, next) => {
  // Check if we need to process query params
  if (!req.query) {
    return next();
  }

  try {
    const newQuery = { ...req.query };
    let hasChanges = false;
    let hppDetails = {};

    for (const key of Object.keys(newQuery)) {
      if (Array.isArray(newQuery[key])) {
        // Take the last value (Last Value Wins strategy)
        // Guard against empty arrays
        if (newQuery[key].length > 0) {
          const lastValue = newQuery[key][newQuery[key].length - 1];
          newQuery[key] = lastValue;
          hasChanges = true;
          // Sanitize value for logging to prevent injection
          const sanitizedValue = String(lastValue).substring(0, 50).replace(/[\r\n]/g, '');
          hppDetails[key] = { action: 'flattened', value: sanitizedValue };
        } else {
          // Handle edge case of empty array - remove key or set to undefined
          delete newQuery[key];
          hasChanges = true;
          hppDetails[key] = { action: 'removed_empty_array' };
        }
      }
    }

    if (hasChanges) {
      // Log the security event
      logger.warn('HPP: Duplicate query params detected and normalized', {
        ip: req.ip,
        path: req.path,
        details: hppDetails
      });

      // In Express 5, req.query is a getter. To overwrite it, we must define a property
      // on the req instance that shadows the getter on the prototype.
      Object.defineProperty(req, 'query', {
        value: newQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    next();
  } catch (error) {
    // Fail safe: log error and reject request to prevent bypass
    logger.error('HPP middleware error:', error);
    return res.status(400).json({ error: 'Bad Request' });
  }
};

module.exports = hpp;
