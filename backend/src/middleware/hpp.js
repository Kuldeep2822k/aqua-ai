/**
 * HTTP Parameter Pollution Protection Middleware
 *
 * Prevents multiple parameters with the same name from being passed as an array.
 * This prevents attackers from bypassing input validation or causing unexpected behavior.
 *
 * Strategy: Last Value Wins
 */
const hpp = (req, res, next) => {
  if (req.query) {
    const newQuery = { ...req.query };
    let changed = false;
    for (const key in newQuery) {
      if (Array.isArray(newQuery[key])) {
        // Take the last value
        newQuery[key] = newQuery[key][newQuery[key].length - 1];
        changed = true;
      }
    }
    if (changed) {
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

module.exports = hpp;
