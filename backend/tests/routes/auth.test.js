/**
 * Auth API Route Tests
 * Tests for /api/auth endpoints
 */

const request = require('supertest');
const express = require('express');

// Mock the User model
jest.mock('../../src/models/User', () => ({
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    verifyPassword: jest.fn(),
    update: jest.fn(),
}));

// Store the generated token for testing
let mockGeneratedToken = 'mock-jwt-token-generated';

// Mock the auth middleware
jest.mock('../../src/middleware/auth', () => {
    const actualAuth = jest.requireActual('../../src/middleware/auth');
    return {
        ...actualAuth,
        generateToken: jest.fn().mockImplementation((user) => mockGeneratedToken),
        authenticate: jest.fn().mockImplementation((req, res, next) => {
            req.user = { id: 1, email: 'test@example.com', role: 'user' };
            next();
        }),
    };
});

// Mock logger to suppress output during tests
jest.mock('../../src/utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
}));

const User = require('../../src/models/User');
const { generateToken } = require('../../src/middleware/auth');

// Create test app with proper error handling
const createApp = () => {
    const app = express();
    app.use(express.json());

    // Import routes after mocking
    const authRouter = require('../../src/routes/auth');
    app.use('/api/auth', authRouter);

    // Global error handler matching the actual implementation
    app.use((err, req, res, next) => {
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            error: err.message || 'Internal server error',
            ...(err.errors && { errors: err.errors }),
        });
    });

    return app;
};

describe('Auth API', () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = createApp();
        process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: '$2a$10$validhashedpassword',
                name: 'Test User',
                role: 'user',
            };

            User.findByEmail.mockResolvedValue(mockUser);
            User.verifyPassword.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'ValidPass123!' })
                .expect('Content-Type', /json/)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe('test@example.com');
            expect(User.findByEmail).toHaveBeenCalledWith('test@example.com');
        });

        it('should reject when user not found', async () => {
            User.findByEmail.mockResolvedValue(null);
            User.verifyPassword.mockResolvedValue(false);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'nonexistent@example.com', password: 'ValidPass123!' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid');
        });

        it('should reject invalid password', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                password: '$2a$10$validhashedpassword',
            };

            User.findByEmail.mockResolvedValue(mockUser);
            User.verifyPassword.mockResolvedValue(false);

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'WrongPass123!' })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.error).toContain('Invalid');
        });

        it('should require email field', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'ValidPass123!' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require password field', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'invalid-email', password: 'ValidPass123!' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/register', () => {
        it('should register new user successfully', async () => {
            const mockUser = {
                id: 1,
                email: 'newuser@example.com',
                name: 'New User',
                role: 'user',
            };

            User.findByEmail.mockResolvedValue(null); // User doesn't exist
            User.create.mockResolvedValue(mockUser);

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'SecurePass123!',
                    name: 'New User',
                })
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('token');
            expect(response.body.data.user.email).toBe('newuser@example.com');
            expect(User.create).toHaveBeenCalled();
        });

        it('should reject registration with existing email', async () => {
            User.findByEmail.mockResolvedValue({ id: 1, email: 'existing@example.com' });

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'existing@example.com',
                    password: 'SecurePass123!',
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.error.toLowerCase()).toContain('exist');
        });

        it('should validate password strength (too short)', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'abc', // Too short
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require name field', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'test@example.com',
                    password: 'SecurePass123!',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should require valid email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'not-an-email',
                    password: 'SecurePass123!',
                    name: 'Test User',
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should return current user profile', async () => {
            const mockUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Test User',
                role: 'user',
            };

            User.findById.mockResolvedValue(mockUser);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('test@example.com');
        });

        it('should return 404 if user not found', async () => {
            User.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .expect(404);

            expect(response.body.success).toBe(false);
        });
    });

    describe('PUT /api/auth/me', () => {
        it('should update user profile name', async () => {
            const updatedUser = {
                id: 1,
                email: 'test@example.com',
                name: 'Updated Name',
                role: 'user',
            };

            User.findByEmail.mockResolvedValue(null); // No email conflict
            User.update.mockResolvedValue(updatedUser);

            const response = await request(app)
                .put('/api/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .send({ name: 'Updated Name' })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Name');
        });

        it('should reject invalid name format', async () => {
            const response = await request(app)
                .put('/api/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .send({ name: '123invalidname!@#' })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors during login', async () => {
            User.findByEmail.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com', password: 'ValidPass123!' })
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        it('should handle database errors during registration', async () => {
            User.findByEmail.mockResolvedValue(null);
            User.create.mockRejectedValue(new Error('Database write failed'));

            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    email: 'newuser@example.com',
                    password: 'SecurePass123!',
                    name: 'New User',
                })
                .expect(500);

            expect(response.body.success).toBe(false);
        });

        it('should handle database errors when fetching profile', async () => {
            User.findById.mockRejectedValue(new Error('Database read failed'));

            const response = await request(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .expect(500);

            expect(response.body.success).toBe(false);
        });
    });
});
