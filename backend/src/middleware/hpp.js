/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * Prevents multiple parameters with the same name from being processed as arrays
 * in req.query. This protects against parameter pollution attacks where attackers
 * send repeated parameters to bypass validation or cause unexpected behavior.
 *
 * Defaults to selecting the last value provided (last-value-wins), which is
 * standard behavior for many frameworks and generally safe for filtering logic.
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
