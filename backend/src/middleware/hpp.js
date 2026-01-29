/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * Prevents HPP attacks by replacing array parameters with the last value in the array.
 * This ensures that when an attacker sends duplicate query parameters (e.g. ?id=1&id=2),
 * the application processes only the last one, preventing array injection errors and filter bypasses.
 */

const logger = require('../utils/logger');

const hpp = (req, res, next) => {
  if (!req.query) {
    return next();
  }

  try {
    const newQuery = { ...req.query };
    let modified = false;

    for (const key in newQuery) {
      if (Object.prototype.hasOwnProperty.call(newQuery, key)) {
        if (Array.isArray(newQuery[key])) {
          // Take the last value (standard HPP protection strategy)
          newQuery[key] = newQuery[key][newQuery[key].length - 1];
          modified = true;
        }
      }
    }

    if (modified) {
      Object.defineProperty(req, 'query', {
        value: newQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }

    next();
  } catch (error) {
    logger.error('HPP Middleware Error:', error);
    next(error);
  }
};

module.exports = hpp;
