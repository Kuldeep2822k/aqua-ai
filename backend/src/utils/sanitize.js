/**
 * Input Sanitization Utilities
 * Prevents SQL injection and XSS attacks
 */

/**
 * Sanitize string input for SQL queries
 * Removes special characters that could be used for SQL injection
 */
function sanitizeInput(input, maxLength = 100) {
    if (typeof input !== 'string') return '';

    // Remove SQL special characters, keep alphanumeric, spaces, hyphens, underscores
    const sanitized = input
        .replace(/[^\w\s-]/g, '')
        .trim()
        .substring(0, maxLength);

    return sanitized;
}

/**
 * Escape LIKE wildcards in SQL queries
 */
function escapeLikeWildcards(input) {
    if (typeof input !== 'string') return '';

    // Escape % and _ characters used in LIKE queries
    return input.replace(/[%_]/g, '\\$&');
}

/**
 * Sanitize email input
 */
function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';

    // Basic email validation and sanitization
    const sanitized = email.toLowerCase().trim();

    // Check if it matches basic email pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
        return '';
    }

    return sanitized;
}

/**
 * Sanitize numeric input
 */
function sanitizeNumber(input, min = null, max = null) {
    const num = parseFloat(input);

    if (isNaN(num)) return null;

    if (min !== null && num < min) return min;
    if (max !== null && num > max) return max;

    return num;
}

/**
 * Sanitize array of strings
 */
function sanitizeArray(arr, maxLength = 50) {
    if (!Array.isArray(arr)) return [];

    return arr
        .filter(item => typeof item === 'string')
        .map(item => sanitizeInput(item, maxLength))
        .filter(item => item.length > 0)
        .slice(0, 100); // Max 100 items
}

module.exports = {
    sanitizeInput,
    escapeLikeWildcards,
    sanitizeEmail,
    sanitizeNumber,
    sanitizeArray
};
