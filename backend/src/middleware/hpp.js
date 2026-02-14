/**
 * HTTP Parameter Pollution Protection Middleware
 * Prevents array parameters in query strings where single values are expected.
 * Selects the last value if duplicates are found.
 */
const hppProtection = (req, res, next) => {
  if (req.query) {
    const newQuery = { ...req.query };
    let changed = false;

    for (const key in newQuery) {
      if (Array.isArray(newQuery[key])) {
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

module.exports = hppProtection;
