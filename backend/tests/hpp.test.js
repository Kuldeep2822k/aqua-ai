const request = require('supertest');

// Mock database connection
const whereMock = jest.fn().mockReturnThis();
const mockDb = jest.fn(() => ({
  where: whereMock,
  join: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
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

const app = require('../src/server');

describe('Security: HTTP Parameter Pollution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use the last value when duplicate query parameters are provided', async () => {
    // ?state=NY&state=CA
    // Should be interpreted as state=CA

    await request(app)
      .get('/api/locations?state=NY&state=CA')
      .expect(200);

    // Check what was passed to the DB query
    // The controller calls: query.where('ls.state', 'ilike', `%${sanitizeLikeSearch(state)}%`)

    // If HPP works: state is "CA", sanitization returns "CA", where called with "%CA%"
    // If HPP fails: state is ["NY", "CA"], sanitization returns "", where called with "%%"

    const stateCall = whereMock.mock.calls.find(call => call[0] === 'ls.state');

    expect(stateCall).toBeDefined();
    expect(stateCall[2]).toBe('%CA%');
  });
});
