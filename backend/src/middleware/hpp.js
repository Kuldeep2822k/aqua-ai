/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * This middleware prevents HPP attacks by ensuring that query parameters are single values.
 * If duplicate parameters are provided (resulting in an array), it takes the last value.
 * This prevents filter bypasses and logic errors in downstream code that expects strings.
 */

const hpp = (req, res, next) => {
  // Check if we need to process query params
  if (!req.query) {
    return next();
  }

  const newQuery = { ...req.query };
  let hasChanges = false;

  for (const key in newQuery) {
    if (Array.isArray(newQuery[key])) {
      // Take the last value (Last Value Wins strategy)
      const lastValue = newQuery[key][newQuery[key].length - 1];
      newQuery[key] = lastValue;
      hasChanges = true;
    }
  }

  if (hasChanges) {
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
};

module.exports = hpp;
