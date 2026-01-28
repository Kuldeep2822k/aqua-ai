/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * Prevents HPP attacks by ensuring query parameters are strings, not arrays.
 * If a parameter is duplicated in the query string (e.g., ?id=1&id=2),
 * Express parses it as an array ([1, 2]). This middleware selects the last value.
 *
 * Note: Express 5 makes req.query a getter/setter, so we use Object.defineProperty
 * to ensure the sanitized query object is correctly assigned.
 */
const hpp = (req, res, next) => {
  if (!req.query) {
    return next();
  }

  const newQuery = { ...req.query };
  let modified = false;

  for (const key in newQuery) {
    if (Array.isArray(newQuery[key])) {
      // Take the last value (standard HPP behavior)
      newQuery[key] = newQuery[key][newQuery[key].length - 1];
      modified = true;
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
};

module.exports = hpp;
