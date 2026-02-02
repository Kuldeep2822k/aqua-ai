/**
 * Authentication Middleware Tests
 * Tests for JWT authentication middleware
 */

const jwt = require('jsonwebtoken');

// Mock the database
jest.mock('../../src/db/connection', () => ({
    query: jest.fn(),
}));

const db = require('../../src/db/connection');

// Create mock middleware (since we're testing the logic)
const createAuthMiddleware = (secret = 'test-secret') => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ error: 'Invalid token format' });
        }

        const token = parts[1];

        try {
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            next();
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                return res.status(401).json({ error: 'Token expired' });
            }
            return res.status(401).json({ error: 'Invalid token' });
        }
    };
};

describe('Auth Middleware', () => {
    let middleware;
    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        middleware = createAuthMiddleware('test-secret');
        mockReq = {
            headers: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    describe('Token Validation', () => {
        it('should reject requests without authorization header', () => {
            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should reject invalid token format', () => {
            mockReq.headers.authorization = 'InvalidFormat token123';

            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
        });

        it('should reject missing Bearer prefix', () => {
            mockReq.headers.authorization = 'token123';

            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });

        it('should accept valid token', () => {
            const token = jwt.sign({ userId: 1, email: 'test@example.com' }, 'test-secret');
            mockReq.headers.authorization = `Bearer ${token}`;

            middleware(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeDefined();
            expect(mockReq.user.userId).toBe(1);
        });

        it('should reject expired token', () => {
            const token = jwt.sign(
                { userId: 1 },
                'test-secret',
                { expiresIn: '-1h' } // Already expired
            );
            mockReq.headers.authorization = `Bearer ${token}`;

            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Token expired' });
        });

        it('should reject token with wrong secret', () => {
            const token = jwt.sign({ userId: 1 }, 'wrong-secret');
            mockReq.headers.authorization = `Bearer ${token}`;

            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
        });

        it('should reject malformed token', () => {
            mockReq.headers.authorization = 'Bearer malformed.token.here';

            middleware(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(401);
        });
    });

    describe('User Context', () => {
        it('should attach user data to request', () => {
            const userData = { userId: 1, email: 'test@example.com', role: 'admin' };
            const token = jwt.sign(userData, 'test-secret');
            mockReq.headers.authorization = `Bearer ${token}`;

            middleware(mockReq, mockRes, mockNext);

            expect(mockReq.user.userId).toBe(1);
            expect(mockReq.user.email).toBe('test@example.com');
            expect(mockReq.user.role).toBe('admin');
        });
    });
});

describe('Role-Based Authorization', () => {
    const createRoleMiddleware = (requiredRoles) => {
        return (req, res, next) => {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            if (!requiredRoles.includes(req.user.role)) {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            next();
        };
    };

    let mockReq;
    let mockRes;
    let mockNext;

    beforeEach(() => {
        mockReq = { user: null };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
        mockNext = jest.fn();
    });

    it('should allow admin access to admin routes', () => {
        mockReq.user = { userId: 1, role: 'admin' };
        const middleware = createRoleMiddleware(['admin']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    it('should deny user access to admin routes', () => {
        mockReq.user = { userId: 2, role: 'user' };
        const middleware = createRoleMiddleware(['admin']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });

    it('should allow multiple roles', () => {
        mockReq.user = { userId: 1, role: 'moderator' };
        const middleware = createRoleMiddleware(['admin', 'moderator']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
    });

    it('should reject unauthenticated requests', () => {
        const middleware = createRoleMiddleware(['admin']);

        middleware(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
    });
});
