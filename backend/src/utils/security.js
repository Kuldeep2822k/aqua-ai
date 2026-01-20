/**
 * Security Utilities
 * Helper functions for security-related operations
 */

/**
 * Sanitizes a string for use in SQL LIKE queries to prevent wildcard injection/DoS.
 * Escapes % and _ characters.
 *
 * @param {string} input - The user input string
 * @returns {string} - The sanitized string safe for LIKE queries (e.g. "foo%" -> "foo\%")
 */
const sanitizeLikeSearch = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  // Escape backslash first to prevent escaping the escape character
  // Then escape % and _
  return input.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
};

module.exports = {
  sanitizeLikeSearch,
};
