const request = require('supertest');

// Mock database connection
const mockWhere = jest.fn().mockReturnThis();
// We need a mock builder that can handle clone()
const mockBuilder = {
  join: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: mockWhere,
  clone: jest.fn().mockReturnThis(), // Returns this for simplicity
  clearSelect: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve([])),
  toSQL: jest.fn().mockReturnValue({ sql: 'mock sql' }),
};
// Ensure clone returns a builder-like object (itself is fine for this test)
mockBuilder.clone.mockReturnValue(mockBuilder);

const mockDb = jest.fn(() => mockBuilder);

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
  generateToken: () => 'mock-token',
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
    mockWhere.mockClear();
    jest.clearAllMocks();
  });

  it('should handle duplicate query parameters by taking the last value for "status"', async () => {
    // "status" is not validated by express-validator, so it reaches the controller directly.
    // Without HPP middleware, "status" will be ['active', 'resolved'].
    // With HPP middleware, "status" will be 'resolved'.

    await request(app)
      .get('/api/alerts?status=active&status=resolved')
      .expect(200);

    const statusCall = mockWhere.mock.calls.find(call => call[0] === 'a.status');

    expect(statusCall).toBeDefined();
    // Expecting strict single value 'resolved' (the last one)
    expect(statusCall[1]).toBe('resolved');
  });

  it('should allow validation to pass for duplicate "parameter" keys by normalizing to string', async () => {
     // "parameter" has .isString() validation.
     // Without HPP: ['ph', 'do'] fails .isString() -> 400 Bad Request.
     // With HPP: 'do' passes .isString() -> 200 OK.

     await request(app)
       .get('/api/alerts?parameter=ph&parameter=DO') // Upper case for code check
       .expect(200); // Should verify that it passes validation
  });
});
