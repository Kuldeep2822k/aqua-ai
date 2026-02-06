const request = require('supertest');

// Create a spy for the 'where' method
const whereSpy = jest.fn().mockReturnThis();
const mockDbInstance = {
  where: whereSpy,
  join: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  first: jest.fn().mockResolvedValue({}),
};

// Mock database connection
const mockDb = jest.fn(() => mockDbInstance);

jest.mock('../src/db/connection', () => ({
  db: mockDb,
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// Mock auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const app = require('../src/server');

describe('Security: HTTP Parameter Pollution (HPP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle duplicate query parameters by taking the last value', async () => {
    // Send a request with duplicate 'state' parameters
    // ?state=California&state=Texas
    // Without HPP protection, req.query.state would be ['California', 'Texas']
    // With HPP protection, req.query.state should be 'Texas'

    const res = await request(app)
      .get('/api/locations')
      .query('state=California')
      .query('state=Texas');

    expect(res.status).toBe(200);

    // Verify that the database query was constructed with the last value
    // The route handler calls: query.where('ls.state', 'ilike', `%${sanitizeLikeSearch(state)}%`)

    // Check calls to .where()
    // We expect one of the calls to be for 'ls.state' with value containing 'Texas'
    const calls = whereSpy.mock.calls;
    const stateCall = calls.find(call => call[0] === 'ls.state');

    expect(stateCall).toBeDefined();
    expect(stateCall[2]).toContain('Texas');
    expect(stateCall[2]).not.toContain('California');
  });

  it('should handle single query parameter correctly', async () => {
    await request(app)
      .get('/api/locations')
      .query({ state: 'Florida' })
      .expect(200);

    const calls = whereSpy.mock.calls;
    const stateCall = calls.find(call => call[0] === 'ls.state');

    expect(stateCall).toBeDefined();
    expect(stateCall[2]).toContain('Florida');
  });
});
