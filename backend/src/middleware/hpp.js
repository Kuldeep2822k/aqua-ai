/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * Vulnerability:
 * Express populates `req.query` with arrays when a query parameter is repeated.
 * Example: `?status=active&status=resolved` -> `req.query.status = ['active', 'resolved']`
 *
 * Impact:
 * - Can bypass input validation that expects strings (if validators are not strict).
 * - Can cause database errors or unexpected behavior in logic expecting strings.
 * - Can be used for DoS attacks if logic iterates over what it expects to be a string.
 *
 * Fix:
 * This middleware flattens repeated query parameters to the last value (last-value-wins),
 * ensuring `req.query` properties are always strings (or whatever the query parser produces for a single value).
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const hpp = (req, res, next) => {
  // If no query parameters, skip
  if (!req.query) return next();

  const newQuery = { ...req.query };
  let changed = false;

  for (const key in newQuery) {
    if (Object.prototype.hasOwnProperty.call(newQuery, key)) {
      if (Array.isArray(newQuery[key])) {
        // Take the last value in the array
        newQuery[key] = newQuery[key][newQuery[key].length - 1];
        changed = true;
      }
    }
  }

  // If changes were made, update req.query
  if (changed) {
    // In Express 5, direct assignment to req.query might not work if it's a getter/setter.
    // We use Object.defineProperty to force update the property.
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
