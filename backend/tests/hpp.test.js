const request = require('supertest');

// Mock database connection
const mockWhere = jest.fn().mockReturnThis();
const mockOrWhere = jest.fn().mockReturnThis();

const mockDb = jest.fn(() => ({
  where: mockWhere,
  orWhere: mockOrWhere,
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  then: jest.fn().mockImplementation((callback) => Promise.resolve([]).then(callback)),
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

  it('should process duplicate query parameters correctly (HPP vulnerability check)', async () => {
    // Send duplicate 'q' parameters
    // Without HPP protection, this results in q=['river', 'lake']
    // sanitizeLikeSearch(['river', 'lake']) returns ''
    // searchTerm becomes '%%'

    // With HPP protection (last value wins), q='lake'
    // sanitizeLikeSearch('lake') returns 'lake'
    // searchTerm becomes '%lake%'

    await request(app)
      .get('/api/locations/search?q=river&q=lake')
      .expect(200);

    // Check what was passed to the database query
    // The first call to .where('name', 'ilike', searchTerm)
    const whereCalls = mockWhere.mock.calls;

    // We expect at least one call to where
    expect(whereCalls.length).toBeGreaterThan(0);

    const firstCallArgs = whereCalls[0];

    const searchTerm = firstCallArgs[2];

    // Expect correct sanitization (last value 'lake' used)
    expect(searchTerm).toBe('%lake%');
  });
});
