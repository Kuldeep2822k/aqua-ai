/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 * Flattens duplicate query parameters to prevent array injection attacks.
 */

const hpp = (req, res, next) => {
  if (req.query) {
    const newQuery = {};

    for (const key in req.query) {
      if (Object.prototype.hasOwnProperty.call(req.query, key)) {
        let value = req.query[key];

        // If value is an array, take the last element (standard behavior)
        while (Array.isArray(value)) {
          value = value[value.length - 1];
        }

        newQuery[key] = value;
      }
    }

    // Replace req.query using Object.defineProperty as direct assignment might be blocked
    Object.defineProperty(req, 'query', {
      value: newQuery,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }
  next();
};

module.exports = hpp;
