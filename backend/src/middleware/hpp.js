/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 * Prevents HPP attacks by enforcing a last-value-wins strategy for query parameters.
 *
 * Example:
 * ?state=A&state=B -> req.query.state = 'B'
 */
const hpp = (req, res, next) => {
  if (req.query) {
    const newQuery = { ...req.query };
    let hasChanges = false;

    for (const key in newQuery) {
      if (Array.isArray(newQuery[key])) {
        // Last value wins
        newQuery[key] = newQuery[key][newQuery[key].length - 1];
        hasChanges = true;
      }
    }

    if (hasChanges) {
      // Force update of req.query
      // In some Express versions, req.query is a getter/setter.
      // We use Object.defineProperty to override it on the instance.
      try {
        Object.defineProperty(req, 'query', {
          value: newQuery,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } catch (e) {
        console.error('HPP Error defining property:', e);
      }
    }
  }
  next();
};

module.exports = hpp;
