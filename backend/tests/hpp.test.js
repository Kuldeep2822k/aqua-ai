const request = require('supertest');
const hpp = require('../src/middleware/hpp');

// Mock database methods
const mockWhere = jest.fn().mockReturnThis();
const mockDbInstance = {
  join: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: mockWhere,
  orWhere: jest.fn().mockReturnThis(),
  clone: jest.fn().mockReturnThis(),
  clearSelect: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  avg: jest.fn().mockReturnThis(),
  distinct: jest.fn().mockReturnThis(),
  pluck: jest.fn().mockReturnThis(),
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
  optionalAuth: (req, res, next) => next(),
  authenticate: (req, res, next) => next(),
  generateToken: () => 'mock-token',
  authorize: () => (req, res, next) => next(),
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
  describe('Integration Test', () => {
    beforeEach(() => {
      mockWhere.mockClear();
    });

    it('should sanitize duplicate query parameters (last-value-wins)', async () => {
      // Make request with duplicate state parameter
      // state=CA&state=NY
      await request(app)
        .get('/api/water-quality?state=CA&state=NY')
        .expect(200);

      // We expect the 'where' method to be called with the sanitized last value ('NY')
      // sanitizeLikeSearch('NY') -> 'NY' -> ilike '%NY%'
      expect(mockWhere).toHaveBeenCalledWith('l.state', 'ilike', '%NY%');
    });
  });

  describe('Unit Test', () => {
    it('should take the last value of duplicate parameters', () => {
      const req = {
        query: {
          id: ['123', '456'],
          name: 'test',
          tags: ['a', 'b', 'c']
        }
      };
      const res = {};
      const next = jest.fn();

      hpp(req, res, next);

      expect(req.query.id).toBe('456');
      expect(req.query.name).toBe('test');
      expect(req.query.tags).toBe('c');
      expect(next).toHaveBeenCalled();
    });

    it('should handle missing query object', () => {
      const req = {};
      const res = {};
      const next = jest.fn();

      hpp(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it('should handle non-array parameters correctly', () => {
        const req = {
            query: {
                search: 'water'
            }
        };
        const next = jest.fn();
        hpp(req, {}, next);
        expect(req.query.search).toBe('water');
    });
  });
});
