const { sanitizeLikeSearch } = require('./security');

describe('Security Utilities', () => {
    describe('sanitizeLikeSearch', () => {
        test('should return empty string for null or undefined', () => {
            expect(sanitizeLikeSearch(null)).toBe('');
            expect(sanitizeLikeSearch(undefined)).toBe('');
        });

        test('should return empty string for non-string input', () => {
            expect(sanitizeLikeSearch(123)).toBe('');
            expect(sanitizeLikeSearch({})).toBe('');
        });

        test('should return original string if no special characters', () => {
            expect(sanitizeLikeSearch('hello')).toBe('hello');
            expect(sanitizeLikeSearch('water')).toBe('water');
        });

        test('should escape % character', () => {
            expect(sanitizeLikeSearch('100%')).toBe('100\\%');
            expect(sanitizeLikeSearch('%start')).toBe('\\%start');
        });

        test('should escape _ character', () => {
            expect(sanitizeLikeSearch('user_name')).toBe('user\\_name');
            expect(sanitizeLikeSearch('_id')).toBe('\\_id');
        });

        test('should escape backslash', () => {
            expect(sanitizeLikeSearch('C:\\Windows')).toBe('C:\\\\Windows');
        });

        test('should escape multiple special characters', () => {
            expect(sanitizeLikeSearch('100%_guaranteed')).toBe('100\\%\\_guaranteed');
        });
    });
});
