const request = require('supertest');

// Mock database connection
const mockDb = jest.fn(() => ({
  where: jest.fn().mockReturnThis(),
  orWhere: jest.fn().mockReturnThis(), // Needed for search
  first: jest.fn().mockResolvedValue(null),
  select: jest.fn().mockReturnThis(),
  join: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
  clearSelect: jest.fn().mockReturnThis(),
}));

jest.mock('../src/db/connection', () => ({
  db: mockDb,
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// Mock logger to keep test output clean
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const app = require('../src/server');

describe('Security: HPP Protection', () => {
  it('should flatten duplicate query parameters', async () => {
    // Send duplicate 'parameter'
    const res = await request(app).get(
      '/api/water-quality?parameter=ph&parameter=ph'
    );

    if (res.status === 400) {
      console.log('Validation Error:', JSON.stringify(res.body, null, 2));
    }

    expect(res.status).toBe(200);
  });

  it('should handle duplicate parameters in search', async () => {
    const res = await request(app).get('/api/locations/search?q=lake&q=river');

    if (res.status !== 200) {
      console.log('Search Error:', JSON.stringify(res.body, null, 2));
    }
    expect(res.status).toBe(200);
  });
});
