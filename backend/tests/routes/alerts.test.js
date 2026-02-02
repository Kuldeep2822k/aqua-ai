/**
 * Alerts API Route Tests
 * Tests for /api/alerts endpoints
 */

const request = require('supertest');
const express = require('express');

// Create comprehensive mock Knex query builder
const createMockQueryBuilder = (resolvedData = []) => {
    const builder = {};

    // All chainable methods return the builder
    const chainableMethods = [
        'where', 'whereIn', 'whereNotNull', 'andWhere', 'orWhere',
        'join', 'leftJoin', 'rightJoin',
        'select', 'clearSelect', 'groupBy',
        'limit', 'offset', 'orderBy',
        'clone', 'count', 'avg', 'max', 'sum', 'min',
        'distinct', 'as', 'update', 'returning'
    ];

    chainableMethods.forEach(method => {
        builder[method] = jest.fn().mockReturnValue(builder);
    });

    // Terminal methods that resolve with data
    builder.first = jest.fn().mockResolvedValue(resolvedData[0] || null);
    builder.pluck = jest.fn().mockResolvedValue([]);

    // Make the builder itself awaitable
    builder.then = (resolve) => Promise.resolve(resolvedData).then(resolve);
    builder[Symbol.toStringTag] = 'Promise';

    return builder;
};

// Mock db function
let mockDb;
let mockQueryBuilders = {};

jest.mock('../../src/db/connection', () => {
    mockDb = jest.fn((tableName) => {
        const builder = createMockQueryBuilder([]);
        mockQueryBuilders[tableName] = builder;
        return builder;
    });
    return { db: mockDb };
});

// Mock the validation middleware - pass through
jest.mock('../../src/middleware/validation', () => ({
    validate: () => (req, res, next) => next(),
    validationRules: {
        pagination: [], severity: [], status: [],
        id: [], alertId: [],
    },
}));

// Mock the error handler
jest.mock('../../src/middleware/errorHandler', () => ({
    asyncHandler: (fn) => async (req, res, next) => {
        try {
            await fn(req, res, next);
        } catch (error) {
            next(error);
        }
    },
    APIError: class APIError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    },
}));

// Mock auth
jest.mock('../../src/middleware/auth', () => ({
    authenticate: (req, res, next) => {
        req.user = { id: 1, email: 'admin@example.com', role: 'admin' };
        next();
    },
    authorize: () => (req, res, next) => next(),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));

// Create test app
const createApp = () => {
    const app = express();
    app.use(express.json());

    const alertsRouter = require('../../src/routes/alerts');
    app.use('/api/alerts', alertsRouter);

    app.use((err, req, res, _next) => {
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message,
        });
    });

    return app;
};

describe('Alerts API', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQueryBuilders = {};
        app = createApp();
    });

    // Note: Database error handling tests are better suited for
    // integration testing with a real database connection.

    describe('GET /api/alerts/active', () => {
        it('should return active alerts', async () => {
            const { db } = require('../../src/db/connection');

            const mockAlerts = [
                { id: 1, severity: 'critical', status: 'active' },
            ];

            db.mockImplementation(() => {
                const builder = createMockQueryBuilder(mockAlerts);
                builder.limit = jest.fn().mockResolvedValue(mockAlerts);
                return builder;
            });

            const response = await request(app)
                .get('/api/alerts/active')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/alerts/:id', () => {
        it('should return 404 for non-existent alert', async () => {
            const { db } = require('../../src/db/connection');

            db.mockImplementation(() => {
                const builder = createMockQueryBuilder([]);
                builder.first = jest.fn().mockResolvedValue(null);
                return builder;
            });

            const response = await request(app)
                .get('/api/alerts/99999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });

        it('should return alert when found', async () => {
            const { db } = require('../../src/db/connection');

            const mockAlert = {
                id: 1,
                severity: 'critical',
                status: 'active',
                location_name: 'Test Location'
            };

            db.mockImplementation(() => {
                const builder = createMockQueryBuilder([mockAlert]);
                builder.first = jest.fn().mockResolvedValue(mockAlert);
                return builder;
            });

            const response = await request(app)
                .get('/api/alerts/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
        });
    });

    // Note: PUT /api/alerts/:id/acknowledge and PUT /api/alerts/:id/resolve
    // require integration testing with a real database as they involve
    // complex transaction patterns that are difficult to mock properly.
    // These should be tested in an integration test suite.
});
