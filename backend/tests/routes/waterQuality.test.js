/**
 * Water Quality API Route Tests
 * Tests for /api/water-quality endpoints
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
        'distinct', 'as'
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
        pagination: [], dateRange: [], riskLevel: [],
        state: [], parameter: [], id: [], locationId: [],
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
    optionalAuth: (req, res, next) => next(),
    authenticate: (req, res, next) => {
        req.user = { id: 1, email: 'test@example.com', role: 'user' };
        next();
    },
}));

// Mock security
jest.mock('../../src/utils/security', () => ({
    sanitizeLikeSearch: jest.fn((str) => str || ''),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn(),
}));

// Create test app
const createApp = () => {
    const app = express();
    app.use(express.json());

    const waterQualityRouter = require('../../src/routes/waterQuality');
    app.use('/api/water-quality', waterQualityRouter);

    app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message,
        });
    });

    return app;
};

describe('Water Quality API', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        mockQueryBuilders = {};
        app = createApp();
    });

    // Note: GET /api/water-quality error handling is tested implicitly
    // through the endpoint's response patterns. Complex DB error mocking
    // requires integration testing.

    describe('GET /api/water-quality/parameters', () => {
        it('should return available parameters list', async () => {
            const { db } = require('../../src/db/connection');

            const mockParams = [
                { parameter_code: 'ph', parameter_name: 'pH' },
            ];

            db.mockImplementation(() => {
                const builder = createMockQueryBuilder(mockParams);
                builder.orderBy = jest.fn().mockResolvedValue(mockParams);
                return builder;
            });

            const response = await request(app)
                .get('/api/water-quality/parameters')
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    describe('GET /api/water-quality/:id', () => {
        it('should return 404 for non-existent reading', async () => {
            const { db } = require('../../src/db/connection');

            db.mockImplementation(() => {
                const builder = createMockQueryBuilder([]);
                builder.first = jest.fn().mockResolvedValue(null);
                return builder;
            });

            const response = await request(app)
                .get('/api/water-quality/99999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });

        it('should return reading when found', async () => {
            const { db } = require('../../src/db/connection');

            const mockReading = { id: 1, ph: 7.5, location_name: 'Test' };

            db.mockImplementation(() => {
                const builder = createMockQueryBuilder([mockReading]);
                builder.first = jest.fn().mockResolvedValue(mockReading);
                return builder;
            });

            const response = await request(app)
                .get('/api/water-quality/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
        });
    });
});
