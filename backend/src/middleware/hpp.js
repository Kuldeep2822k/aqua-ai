/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 * Prevents HPP attacks by enforcing a last-value-wins strategy for duplicate query parameters.
 *
 * Example: ?state=CA&state=NY -> req.query.state = 'NY'
 */

const hpp = (req, res, next) => {
  // If no query parameters, skip
  if (!req.query) {
    return next();
  }

  // Use a new object to avoid potential read-only issues with req.query properties
  const newQuery = { ...req.query };
  let modified = false;

  // Iterate over query parameters
  for (const key in newQuery) {
    if (Object.prototype.hasOwnProperty.call(newQuery, key)) {
      if (Array.isArray(newQuery[key])) {
        // Take the last value (last-value-wins strategy)
        newQuery[key] = newQuery[key][newQuery[key].length - 1];
        modified = true;
      }
    }
  }

  // If we modified anything, update req.query
  if (modified) {
    // In Express 5+, req.query might be read-only property, so we use Object.defineProperty
    // to force overwrite it.
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
