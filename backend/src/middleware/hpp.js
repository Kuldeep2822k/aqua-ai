/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 * Prevents HPP attacks by ensuring query parameters are strings, not arrays.
 * If a parameter is repeated, only the last value is used.
 */

const hppProtection = (req, res, next) => {
  if (req.query) {
    const newQuery = { ...req.query };
    let modified = false;

    for (const key in newQuery) {
      if (Array.isArray(newQuery[key])) {
        // Take the last value
        const arr = newQuery[key];
        newQuery[key] = arr[arr.length - 1];
        modified = true;
      }
    }

    if (modified) {
      // Force overwrite using Object.defineProperty to bypass potential getters/setters or read-only properties
      Object.defineProperty(req, 'query', {
        value: newQuery,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    }
  }
  next();
};

module.exports = hppProtection;
