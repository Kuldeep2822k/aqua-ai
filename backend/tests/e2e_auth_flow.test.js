const request = require('supertest');

// Set env vars BEFORE require
process.env.NODE_ENV = 'test';
process.env.DB_CLIENT = 'sqlite3';
process.env.JWT_SECRET = 'test-secret';

const { db } = require('../src/db/connection');
const app = require('../src/server');

// Mock logger to keep output clean
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

describe('E2E Auth Flow (SQLite)', () => {
  beforeAll(async () => {
    // Run migrations on the in-memory DB used by the app
    await db.migrate.latest();
  });

  afterAll(async () => {
    await db.destroy();
  });

  it('should register, login, and access protected route', async () => {
    const userCreds = {
      email: 'e2e@example.com',
      password: 'Password123!',
      name: 'E2E User',
    };

    // 1. Register
    const regRes = await request(app)
      .post('/api/auth/register')
      .send(userCreds);

    expect(regRes.status).toBe(201);
    expect(regRes.body.data).toHaveProperty('token');

    // 2. Login
    const loginRes = await request(app).post('/api/auth/login').send({
      email: userCreds.email,
      password: userCreds.password,
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('token');
    const token = loginRes.body.data.token;

    // 3. Access Protected Route (Me)
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data).toHaveProperty('email', userCreds.email);
  });
});
