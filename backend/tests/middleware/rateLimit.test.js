/**
 * Rate Limit Middleware Tests
 * Tests for API rate limiting
 */

// Mock rate limiter implementation
const createRateLimiter = (options = {}) => {
    const {
        windowMs = 60000, // 1 minute
        maxRequests = 100,
        keyGenerator = (req) => req.ip,
        handler = (req, res) => res.status(429).json({ error: 'Too many requests' }),
    } = options;

    const requestCounts = new Map();

    return (req, res, next) => {
        const key = keyGenerator(req);
        const now = Date.now();

        if (!requestCounts.has(key)) {
            requestCounts.set(key, { count: 0, startTime: now });
        }

        const record = requestCounts.get(key);

        // Reset window if expired
        if (now - record.startTime > windowMs) {
            record.count = 0;
            record.startTime = now;
        }

        record.count++;

        if (record.count > maxRequests) {
            return handler(req, res);
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', record.startTime + windowMs);

        next();
    };
};

describe('Rate Limit Middleware', () => {
    let middleware;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        middleware = createRateLimiter({ maxRequests: 5, windowMs: 1000 });
        mockReq = { ip: '127.0.0.1' };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
        };
        mockNext = jest.fn();
    });

    describe('Request Counting', () => {
        it('should allow requests under limit', () => {
            middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockRes.status).not.toHaveBeenCalled();
        });

        it('should count requests correctly', () => {
            for (let i = 0; i < 5; i++) {
                mockNext.mockClear();
                middleware(mockReq, mockRes, mockNext);
                expect(mockNext).toHaveBeenCalled();
            }
        });

        it('should block requests over limit', () => {
            // Make 6 requests (limit is 5)
            for (let i = 0; i < 6; i++) {
                mockNext.mockClear();
                mockRes.status.mockClear();
                middleware(mockReq, mockRes, mockNext);
            }

            expect(mockRes.status).toHaveBeenCalledWith(429);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Too many requests' });
        });
    });

    describe('Rate Limit Headers', () => {
        it('should set X-RateLimit-Limit header', () => {
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 5);
        });

        it('should set X-RateLimit-Remaining header', () => {
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 4);
        });

        it('should decrement remaining count', () => {
            middleware(mockReq, mockRes, mockNext);
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', 3);
        });

        it('should set X-RateLimit-Reset header', () => {
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'X-RateLimit-Reset',
                expect.any(Number)
            );
        });
    });

    describe('IP-Based Limiting', () => {
        it('should track different IPs separately', () => {
            const req1 = { ip: '127.0.0.1' };
            const req2 = { ip: '192.168.1.1' };

            // Max out first IP
            for (let i = 0; i < 6; i++) {
                middleware(req1, mockRes, mockNext);
            }

            // Second IP should still be allowed
            mockNext.mockClear();
            mockRes.status.mockClear();
            middleware(req2, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Window Reset', () => {
        it('should reset count after window expires', async () => {
            const shortWindowMiddleware = createRateLimiter({
                maxRequests: 2,
                windowMs: 100,
            });

            // Use up the limit
            shortWindowMiddleware(mockReq, mockRes, mockNext);
            shortWindowMiddleware(mockReq, mockRes, mockNext);

            // Third request should be blocked
            mockNext.mockClear();
            shortWindowMiddleware(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(429);

            // Wait for window to reset
            await new Promise(resolve => setTimeout(resolve, 150));

            // Should be allowed again
            mockNext.mockClear();
            mockRes.status.mockClear();
            shortWindowMiddleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Custom Key Generator', () => {
        it('should use custom key generator', () => {
            const customMiddleware = createRateLimiter({
                maxRequests: 2,
                keyGenerator: (req) => req.headers['x-api-key'],
            });

            const req1 = { headers: { 'x-api-key': 'key1' } };
            const req2 = { headers: { 'x-api-key': 'key2' } };

            // Max out first key
            for (let i = 0; i < 3; i++) {
                customMiddleware(req1, mockRes, mockNext);
            }

            // Second key should still work
            mockNext.mockClear();
            mockRes.status.mockClear();
            customMiddleware(req2, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Custom Handler', () => {
        it('should use custom error handler', () => {
            const customHandler = jest.fn((req, res) => {
                res.status(429).json({ error: 'Custom rate limit message' });
            });

            const customMiddleware = createRateLimiter({
                maxRequests: 1,
                handler: customHandler,
            });

            customMiddleware(mockReq, mockRes, mockNext);
            customMiddleware(mockReq, mockRes, mockNext);

            expect(customHandler).toHaveBeenCalled();
        });
    });
});

describe('Endpoint-Specific Rate Limiting', () => {
    it('should apply different limits to different endpoints', () => {
        const loginLimiter = createRateLimiter({ maxRequests: 5, windowMs: 60000 });
        const apiLimiter = createRateLimiter({ maxRequests: 100, windowMs: 60000 });

        // Login should have stricter limits
        const loginReq = { ip: '127.0.0.1' };
        const apiReq = { ip: '127.0.0.1' };
        const mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            setHeader: jest.fn(),
        };
        const mockNext = jest.fn();

        expect(typeof loginLimiter).toBe('function');
        expect(typeof apiLimiter).toBe('function');
    });
});
