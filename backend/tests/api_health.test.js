const request = require('supertest');
const app = require('../src/server');

// Mock database connection
jest.mock('../src/db/connection', () => ({
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest
    .fn()
    .mockResolvedValue({ status: 'healthy', latency: 5 }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

describe('API Health Check', () => {
  it('should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
    expect(res.body).toHaveProperty('message', 'Aqua-AI API is running');
    expect(res.body.database).toEqual({ status: 'healthy', latency: 5 });
  });

  it('should include timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('timestamp');
  });
});
