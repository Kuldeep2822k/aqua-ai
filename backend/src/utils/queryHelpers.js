/**
 * Query Helpers
 * Shared utility functions for HTTP query parameter handling.
 */

/**
 * Normalize array query values (HPP protection leaves the last value).
 * @param {*} value
 * @returns {*}
 */
const lastValue = (value) =>
  Array.isArray(value) ? value[value.length - 1] : value;

module.exports = { lastValue };
