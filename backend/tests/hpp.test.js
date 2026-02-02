const request = require('supertest');

// Mock dependencies
jest.mock('../src/db/connection', () => ({
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
  db: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({}),
    clone: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue([{ count: 0 }]),
    orderBy: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    avg: jest.fn().mockReturnThis(),
    sum: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    pluck: jest.fn().mockResolvedValue([]),
    whereNotNull: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock auth middleware to bypass checks if needed (locations route is public though)
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
  generateToken: () => 'mock-token',
}));

const app = require('../src/server');

describe('Security: HTTP Parameter Pollution', () => {
  it('should normalize array parameters to the last value (Last Value Wins)', async () => {
    // If HPP is working, ?state=CA&state=NY becomes state='NY'
    // The validation rule query('state').isString() will pass.
    // If HPP is NOT working, state=['CA', 'NY']. isString() will fail.

    const res = await request(app).get('/api/locations?state=CA&state=NY');

    expect(res.status).toBe(200);
  });

  it('should handle single parameter correctly', async () => {
    const res = await request(app).get('/api/locations?state=CA');
    expect(res.status).toBe(200);
  });

  it('should prevent filter bypass in search endpoint', async () => {
     // Search endpoint doesn't use validation middleware but uses sanitizeLikeSearch.
     // If HPP is working, ?q=foo&q=bar becomes q='bar'.
     // sanitizeLikeSearch('bar') returns 'bar'.

     // We can't verify the SQL query easily without deep mocking,
     // but we can ensure it doesn't crash or return 500.
     // And ideally, checking the response might give a clue, but we mocked db to return empty.

     const res = await request(app).get('/api/locations/search?q=foo&q=bar');
     expect(res.status).toBe(200);
  });
});
