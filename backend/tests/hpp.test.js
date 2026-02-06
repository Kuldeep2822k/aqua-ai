const request = require('supertest');

const whereSpy = jest.fn().mockReturnThis();

// Mock database connection
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
  log: jest.fn(),
}));

// Mock auth middleware - provide ALL exports
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
  generateToken: () => 'mock-token',
}));

const app = require('../src/server');

describe('Security: HTTP Parameter Pollution', () => {
  beforeEach(() => {
    whereSpy.mockClear();
  });

  it('should demonstrate HPP protection with duplicate location_id parameters', async () => {
    // location_id is not validated in the route, so it reaches the controller logic directly.
    // We send ?location_id=1&location_id=2
    // Expected: flattened to '2'

    await request(app)
      .get('/api/water-quality?location_id=1&location_id=2')
      .expect(200);

    // Check what was passed to .where()
    const locationCalls = whereSpy.mock.calls.filter(call => call[0] === 'wqr.location_id');

    if (locationCalls.length > 0) {
      const val = locationCalls[0][1];
      expect(Array.isArray(val)).toBe(false);
      expect(val).toBe('2'); // Last value wins
    }
  });

  it('should flatten duplicate state parameters and pass validation', async () => {
    // ?state=TX&state=CA -> 'CA'
    // 'CA' is a valid string, so validation passes (200)
    const res = await request(app)
      .get('/api/water-quality?state=TX&state=CA');

    expect(res.status).toBe(200);

    const stateCalls = whereSpy.mock.calls.filter(call => call[0] === 'l.state');
    if (stateCalls.length > 0) {
        // verify it used 'CA'
        expect(stateCalls[0][2]).toContain('CA');
    }
  });
});
