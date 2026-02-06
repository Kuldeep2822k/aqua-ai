/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * This middleware prevents parameter pollution attacks by ensuring that query parameters
 * are always single values (strings) rather than arrays.
 *
 * Attack Scenario:
 * An attacker sends `?param=value1&param=value2`.
 * Express parses this as `req.query.param = ['value1', 'value2']`.
 * If the application expects a string, this can bypass validation or cause errors.
 *
 * Fix:
 * This middleware iterates through `req.query` and if any value is an array,
 * it replaces it with the last value in the array (last-value-wins strategy).
 *
 * Note: In Express 5, `req.query` might be read-only or a getter, so we use `Object.defineProperty`
 * to update the query object.
 */
const logger = require('../utils/logger');

const hppProtection = (req, res, next) => {
  if (req.query) {
    const newQuery = { ...req.query };
    let modified = false;

    for (const key in newQuery) {
      if (Array.isArray(newQuery[key])) {
        // Take the last value (standard behavior for query params)
        newQuery[key] = newQuery[key][newQuery[key].length - 1];
        modified = true;
      }
    }

    if (modified) {
      // In Express 5, req.query might be read-only or a getter, so we need to redefine it
      Object.defineProperty(req, 'query', {
        value: newQuery,
        writable: true,
        configurable: true,
      });
    }
  }
  next();
};

module.exports = hppProtection;
