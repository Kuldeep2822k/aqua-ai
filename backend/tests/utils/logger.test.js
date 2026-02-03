/**
 * Logger Utility Tests
 * Tests for logging functionality
 */

// Mock console methods
const originalConsole = { ...console };

describe('Logger Utility', () => {
    // Simple logger implementation for testing
    const createLogger = (options = {}) => {
        const { level = 'info', prefix = '' } = options;
        const levels = { error: 0, warn: 1, info: 2, debug: 3 };
        const currentLevel = levels[level] ?? 2;

        const formatMessage = (lvl, message, meta = {}) => {
            const timestamp = new Date().toISOString();
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `[${timestamp}] [${lvl.toUpperCase()}]${prefix ? ` [${prefix}]` : ''} ${message} ${metaStr}`.trim();
        };

        return {
            error: (message, meta) => {
                if (currentLevel >= levels.error) {
                    console.error(formatMessage('error', message, meta));
                }
            },
            warn: (message, meta) => {
                if (currentLevel >= levels.warn) {
                    console.warn(formatMessage('warn', message, meta));
                }
            },
            info: (message, meta) => {
                if (currentLevel >= levels.info) {
                    console.info(formatMessage('info', message, meta));
                }
            },
            debug: (message, meta) => {
                if (currentLevel >= levels.debug) {
                    console.debug(formatMessage('debug', message, meta));
                }
            },
        };
    };

    beforeEach(() => {
        console.error = jest.fn();
        console.warn = jest.fn();
        console.info = jest.fn();
        console.debug = jest.fn();
    });

    afterEach(() => {
        console.error = originalConsole.error;
        console.warn = originalConsole.warn;
        console.info = originalConsole.info;
        console.debug = originalConsole.debug;
    });

    describe('Log Levels', () => {
        it('should log error messages', () => {
            const logger = createLogger();
            logger.error('Test error message');

            expect(console.error).toHaveBeenCalled();
            expect(console.error.mock.calls[0][0]).toContain('ERROR');
            expect(console.error.mock.calls[0][0]).toContain('Test error message');
        });

        it('should log warning messages', () => {
            const logger = createLogger();
            logger.warn('Test warning message');

            expect(console.warn).toHaveBeenCalled();
            expect(console.warn.mock.calls[0][0]).toContain('WARN');
        });

        it('should log info messages', () => {
            const logger = createLogger();
            logger.info('Test info message');

            expect(console.info).toHaveBeenCalled();
            expect(console.info.mock.calls[0][0]).toContain('INFO');
        });

        it('should log debug messages when level is debug', () => {
            const logger = createLogger({ level: 'debug' });
            logger.debug('Test debug message');

            expect(console.debug).toHaveBeenCalled();
            expect(console.debug.mock.calls[0][0]).toContain('DEBUG');
        });

        it('should not log debug messages when level is info', () => {
            const logger = createLogger({ level: 'info' });
            logger.debug('Test debug message');

            expect(console.debug).not.toHaveBeenCalled();
        });
    });

    describe('Message Formatting', () => {
        it('should include timestamp', () => {
            const logger = createLogger();
            logger.info('Test message');

            expect(console.info.mock.calls[0][0]).toMatch(/\[\d{4}-\d{2}-\d{2}T/);
        });

        it('should include prefix when provided', () => {
            const logger = createLogger({ prefix: 'API' });
            logger.info('Request received');

            expect(console.info.mock.calls[0][0]).toContain('[API]');
        });

        it('should include metadata as JSON', () => {
            const logger = createLogger();
            logger.info('User action', { userId: 123, action: 'login' });

            expect(console.info.mock.calls[0][0]).toContain('"userId":123');
            expect(console.info.mock.calls[0][0]).toContain('"action":"login"');
        });
    });

    describe('Log Level Filtering', () => {
        it('should respect error level (only errors)', () => {
            const logger = createLogger({ level: 'error' });

            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');

            expect(console.error).toHaveBeenCalled();
            expect(console.warn).not.toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
        });

        it('should respect warn level (errors and warnings)', () => {
            const logger = createLogger({ level: 'warn' });

            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');

            expect(console.error).toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalled();
            expect(console.info).not.toHaveBeenCalled();
        });

        it('should respect info level (errors, warnings, info)', () => {
            const logger = createLogger({ level: 'info' });

            logger.error('Error message');
            logger.warn('Warning message');
            logger.info('Info message');
            logger.debug('Debug message');

            expect(console.error).toHaveBeenCalled();
            expect(console.warn).toHaveBeenCalled();
            expect(console.info).toHaveBeenCalled();
            expect(console.debug).not.toHaveBeenCalled();
        });
    });
});

describe('Request Logger Middleware', () => {
    const createRequestLogger = () => {
        return (req, res, next) => {
            const start = Date.now();

            res.on('finish', () => {
                const duration = Date.now() - start;
                console.info(`${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
            });

            next();
        };
    };

    beforeEach(() => {
        console.info = jest.fn();
    });

    afterEach(() => {
        console.info = originalConsole.info;
    });

    it('should log request method and URL', () => {
        const middleware = createRequestLogger();
        const mockReq = { method: 'GET', url: '/api/locations' };
        const mockRes = {
            statusCode: 200,
            on: jest.fn((event, callback) => {
                if (event === 'finish') callback();
            }),
        };
        const mockNext = jest.fn();

        middleware(mockReq, mockRes, mockNext);

        expect(console.info).toHaveBeenCalled();
        expect(console.info.mock.calls[0][0]).toContain('GET');
        expect(console.info.mock.calls[0][0]).toContain('/api/locations');
    });

    it('should log response status code', () => {
        const middleware = createRequestLogger();
        const mockReq = { method: 'POST', url: '/api/alerts' };
        const mockRes = {
            statusCode: 201,
            on: jest.fn((event, callback) => {
                if (event === 'finish') callback();
            }),
        };
        const mockNext = jest.fn();

        middleware(mockReq, mockRes, mockNext);

        expect(console.info.mock.calls[0][0]).toContain('201');
    });

    it('should call next()', () => {
        const middleware = createRequestLogger();
        const mockReq = { method: 'GET', url: '/' };
        const mockRes = { on: jest.fn() };
        const mockNext = jest.fn();

        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });
});
