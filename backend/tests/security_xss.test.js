const request = require('supertest');

// Mock database connection
const mockDb = jest.fn(() => ({
  where: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue(null), // User not found
  insert: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([
    {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      created_at: new Date(),
    },
  ]),
  select: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
}));

jest.mock('../src/db/connection', () => ({
  db: mockDb,
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const app = require('../src/server');

describe('Security: XSS Prevention in Registration', () => {
  it('should reject registration with XSS characters in name', async () => {
    const xssPayload = '<script>alert("XSS")</script>';

    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password123!',
      name: xssPayload,
    });

    // We expect 400 Bad Request due to validation failure
    // If vulnerability exists, it will return 201 Created
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should accept registration with valid name', async () => {
    const validName = 'John Doe-Smith';

    const res = await request(app).post('/api/auth/register').send({
      email: 'valid@example.com',
      password: 'Password123!',
      name: validName,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should accept registration with valid international names', async () => {
    const validName = "José O'Connor-Smith Jr.";

    const res = await request(app).post('/api/auth/register').send({
      email: 'international@example.com',
      password: 'Password123!',
      name: validName,
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
