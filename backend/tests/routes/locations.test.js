/**
 * Locations API Route Tests
 * Tests for /api/locations endpoints
 */

const request = require('supertest');
const express = require('express');

// Create mock Knex query builder
const createMockQueryBuilder = (returnData = []) => {
    const mockBuilder = {
        where: jest.fn().mockReturnThis(),
        whereIn: jest.fn().mockReturnThis(),
        whereNotNull: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        avg: jest.fn().mockReturnThis(),
        sum: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        pluck: jest.fn().mockResolvedValue([]),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockResolvedValue(returnData),
        first: jest.fn().mockResolvedValue(returnData[0] || null),
        clone: jest.fn().mockReturnThis(),
        then: jest.fn((cb) => Promise.resolve(returnData).then(cb)),
    };
    // Make it thenable (await-able)
    return mockBuilder;
};

// Mock locations data
const mockLocations = [
    { id: 1, name: 'Ganga at Varanasi', state: 'Uttar Pradesh', latitude: 25.3176, longitude: 82.9739, avg_wqi_score: 65 },
    { id: 2, name: 'Yamuna at Delhi', state: 'Delhi', latitude: 28.6139, longitude: 77.209, avg_wqi_score: 45 },
];

// Mock db function that returns query builder
let mockDb;

// Mock the database connection
jest.mock('../../src/db/connection', () => {
    mockDb = jest.fn((tableName) => createMockQueryBuilder(mockLocations));
    return { db: mockDb };
});

// Mock the validation middleware
jest.mock('../../src/middleware/validation', () => ({
    validate: () => (req, res, next) => next(),
    validationRules: {
        pagination: [],
        state: [],
        riskLevel: [],
        id: [],
    },
}));

// Mock the error handler
jest.mock('../../src/middleware/errorHandler', () => ({
    asyncHandler: (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next),
    APIError: class APIError extends Error {
        constructor(message, statusCode) {
            super(message);
            this.statusCode = statusCode;
        }
    },
}));

// Mock security utils
jest.mock('../../src/utils/security', () => ({
    sanitizeLikeSearch: jest.fn((str) => str),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

// Create test app
const createApp = () => {
    const app = express();
    app.use(express.json());

    // Clear module cache to reset mocks
    jest.resetModules();

    // Import routes after mocking
    const locationsRouter = require('../../src/routes/locations');
    app.use('/api/locations', locationsRouter);

    // Error handler
    app.use((err, req, res, next) => {
        res.status(err.statusCode || 500).json({
            success: false,
            error: err.message,
        });
    });

    return app;
};

describe('Locations API', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mockDb to return different data for different tables
        const { db } = require('../../src/db/connection');
        app = createApp();
    });

    describe('GET /api/locations', () => {
        it('should return list of locations', async () => {
            const { db } = require('../../src/db/connection');

            // Setup mock to return locations
            const mockBuilder = createMockQueryBuilder(mockLocations);
            mockBuilder.count.mockResolvedValue([{ count: '2' }]);
            mockBuilder.orderBy.mockResolvedValue(mockLocations);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations')
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should support pagination', async () => {
            const { db } = require('../../src/db/connection');

            const mockBuilder = createMockQueryBuilder([]);
            mockBuilder.count.mockResolvedValue([{ count: '0' }]);
            mockBuilder.orderBy.mockResolvedValue([]);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations')
                .query({ limit: 10, offset: 20 })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.pagination).toBeDefined();
        });

        it('should handle database errors', async () => {
            const { db } = require('../../src/db/connection');

            const mockBuilder = createMockQueryBuilder([]);
            mockBuilder.count.mockRejectedValue(new Error('Database connection failed'));
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations')
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/locations/geojson', () => {
        it('should return GeoJSON format', async () => {
            const { db } = require('../../src/db/connection');

            const mockBuilder = createMockQueryBuilder(mockLocations);
            mockBuilder.select.mockResolvedValue(mockLocations);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations/geojson')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.type).toBe('FeatureCollection');
            expect(response.body.data.features).toBeInstanceOf(Array);
        });

        it('should include location properties in GeoJSON', async () => {
            const { db } = require('../../src/db/connection');

            const mockLocData = [{
                id: 1,
                name: 'Test Location',
                state: 'Test State',
                latitude: 25.0,
                longitude: 82.0,
                avg_wqi_score: 65,
                water_body_type: 'river'
            }];

            const mockBuilder = createMockQueryBuilder(mockLocData);
            mockBuilder.select.mockResolvedValue(mockLocData);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations/geojson')
                .expect(200);

            const feature = response.body.data.features[0];
            expect(feature.type).toBe('Feature');
            expect(feature.geometry.type).toBe('Point');
            expect(feature.geometry.coordinates).toEqual([82.0, 25.0]);
            expect(feature.properties.name).toBe('Test Location');
        });

        it('should handle empty results', async () => {
            const { db } = require('../../src/db/connection');

            const mockBuilder = createMockQueryBuilder([]);
            mockBuilder.select.mockResolvedValue([]);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations/geojson')
                .expect(200);

            expect(response.body.data.type).toBe('FeatureCollection');
            expect(response.body.data.features).toHaveLength(0);
        });
    });

    describe('GET /api/locations/stats', () => {
        it('should return location statistics', async () => {
            const { db } = require('../../src/db/connection');

            // Chain mock responses for different queries
            const mockBuilder = createMockQueryBuilder([]);
            mockBuilder.count.mockResolvedValue([{ count: '150' }]);
            mockBuilder.pluck.mockResolvedValue(['Uttar Pradesh', 'Delhi', 'Maharashtra']);
            mockBuilder.avg.mockResolvedValue([{ avg_score: 65.5 }]);
            mockBuilder.sum.mockResolvedValue([{ total_pop: 1000000 }]);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations/stats')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('total_locations');
        });
    });

    describe('GET /api/locations/:id', () => {
        it('should return location by ID', async () => {
            const { db } = require('../../src/db/connection');

            const mockLocation = {
                id: 1,
                name: 'Ganga at Varanasi',
                state: 'Uttar Pradesh',
                latitude: 25.3176,
                longitude: 82.9739,
            };

            const mockBuilder = createMockQueryBuilder([mockLocation]);
            mockBuilder.first.mockResolvedValue(mockLocation);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
            expect(response.body.data.name).toBe('Ganga at Varanasi');
        });

        it('should return 404 for non-existent location', async () => {
            const { db } = require('../../src/db/connection');

            const mockBuilder = createMockQueryBuilder([]);
            mockBuilder.first.mockResolvedValue(null);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations/999')
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('not found');
        });
    });

    describe('GET /api/locations/search', () => {
        it('should search locations by query', async () => {
            const { db } = require('../../src/db/connection');

            const mockBuilder = createMockQueryBuilder(mockLocations);
            mockBuilder.select.mockResolvedValue(mockLocations);
            db.mockReturnValue(mockBuilder);

            const response = await request(app)
                .get('/api/locations/search')
                .query({ q: 'Ganga' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should require search query parameter', async () => {
            const response = await request(app)
                .get('/api/locations/search')
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});
