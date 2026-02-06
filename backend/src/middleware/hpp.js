/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * Prevents HPP attacks by flattening duplicate query parameters.
 * If a parameter is provided multiple times (e.g., ?id=1&id=2),
 * it selects the last value (e.g., id='2').
 *
 * This protects against:
 * 1. Validation bypass (expecting string, getting array)
 * 2. Logic bypass (SQL IN clauses vs equality checks)
 * 3. Crashes/DoS (unexpected types)
 */

const hpp = (req, res, next) => {
  if (req.query) {
    let newQuery = req.query;
    let modified = false;

    const keys = Object.keys(req.query);
    for (const key of keys) {
      if (Array.isArray(req.query[key])) {
        if (!modified) {
          newQuery = { ...req.query };
          modified = true;
        }
        // Take the last value
        newQuery[key] = req.query[key][req.query[key].length - 1];
      }
    }

    if (modified) {
      // Direct assignment might fail or be ignored in some Express versions/setups
      // so we use Object.defineProperty to ensure the new query object is set.
      try {
        Object.defineProperty(req, 'query', {
          value: newQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } catch (e) {
        // Fallback: try direct assignment if defineProperty fails
        try {
          req.query = newQuery;
        } catch (e2) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('[HPP] Failed to update req.query', e2);
          }
        }
      }
    }
  }
  next();
};

module.exports = hpp;
