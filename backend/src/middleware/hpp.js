/**
 * HTTP Parameter Pollution (HPP) Protection Middleware
 *
 * Express populates req.query with an array when multiple parameters with the same name are present.
 * This can bypass validation or cause unexpected behavior in database queries.
 * This middleware enforces a "last value wins" strategy, ensuring all query parameters are strings.
 */

const hpp = (req, res, next) => {
  if (req.query) {
    // Create a copy to modify
    const newQuery = { ...req.query };
    let hasChanges = false;

    Object.keys(newQuery).forEach((key) => {
      const value = newQuery[key];
      if (Array.isArray(value)) {
        // Take the last value (last-value-wins)
        newQuery[key] = value[value.length - 1];
        hasChanges = true;
      }
    });

    // Only reassign if changes were made
    if (hasChanges) {
      // In Express 5, req.query is a getter, so we must use Object.defineProperty
      // to shadow it with our sanitized object.
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
