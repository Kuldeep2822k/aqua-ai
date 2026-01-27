const request = require('supertest');

// We need to capture the query builder calls to verify what was passed to .where()
const whereSpy = jest.fn().mockReturnThis();
const mockDb = jest.fn(() => ({
  join: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: whereSpy,
  clone: jest.fn().mockReturnThis(),
  clearSelect: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  avg: jest.fn().mockReturnThis(),
  distinct: jest.fn().mockReturnThis(),
  pluck: jest.fn().mockReturnThis(),
  first: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/db/connection', () => ({
  db: mockDb,
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/middleware/auth', () => ({
  optionalAuth: (req, res, next) => next(),
  authenticate: (req, res, next) => {
    req.user = { id: 1 };
    next();
  },
  authorize: () => (req, res, next) => next(),
  generateToken: () => 'token',
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

const app = require('../src/server');

describe('Security: HTTP Parameter Pollution', () => {
  beforeEach(() => {
    whereSpy.mockClear();
  });

  it('should prevent filter bypass by selecting the last value when state is polluted', async () => {
    // Sending repeated parameters
    await request(app)
      .get('/api/water-quality?state=California&state=Texas')
      .expect(200);

    // With HPP protection, state becomes 'Texas' (last value).
    // sanitizeLikeSearch('Texas') returns 'Texas'.
    // Query becomes ILIKE '%Texas%'.

    const stateCalls = whereSpy.mock.calls.filter(args => args[0] === 'l.state');

    expect(stateCalls.length).toBeGreaterThan(0);
    const lastCall = stateCalls[stateCalls.length - 1];
    // Check that it's NOT '%%' (empty) but '%Texas%'
    expect(lastCall[2]).toBe('%Texas%');
  });

  it('should prevent array injection in location_id by taking last value', async () => {
     await request(app)
      .get('/api/water-quality?location_id=1&location_id=2')
      .expect(200);

     const locationCalls = whereSpy.mock.calls.filter(args => args[0] === 'wqr.location_id');
     expect(locationCalls.length).toBeGreaterThan(0);

     // Expected behavior WITH HPP protection: Last value string is passed
     expect(Array.isArray(locationCalls[0][1])).toBe(false);
     expect(locationCalls[0][1]).toBe('2');
  });
});
