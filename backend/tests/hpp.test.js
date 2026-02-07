const request = require('supertest');
const { sanitizeLikeSearch } = require('../src/utils/security');

// Mock database connection
const mockWhere = jest.fn().mockReturnThis();
const mockJoin = jest.fn().mockReturnThis();
const mockSelect = jest.fn().mockReturnThis();
const mockLimit = jest.fn().mockReturnThis();
const mockOffset = jest.fn().mockReturnThis();
const mockOrderBy = jest.fn().mockReturnThis();
const mockClone = jest.fn().mockReturnThis();
const mockCount = jest.fn().mockResolvedValue([{ count: 0 }]);
const mockFirst = jest.fn().mockResolvedValue({});
const mockAvg = jest.fn().mockReturnThis(); // For avg aggregate
const mockDb = jest.fn(() => ({
  join: mockJoin,
  where: mockWhere,
  select: mockSelect,
  limit: mockLimit,
  offset: mockOffset,
  orderBy: mockOrderBy,
  clone: mockClone,
  count: mockCount,
  first: mockFirst,
  avg: mockAvg,
  then: (resolve) => resolve([]), // Resolve promise
}));

jest.mock('../src/db/connection', () => ({
  db: mockDb,
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// Mock logger to suppress output
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const app = require('../src/server');

describe('Security: HTTP Parameter Pollution (HPP)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementation for clone to return a chainable object
    mockClone.mockReturnValue({
      count: mockCount,
      clearSelect: jest.fn().mockReturnThis(),
    });
  });

  it('demonstrates HPP bypass on search endpoint', async () => {
    // The /api/locations/search endpoint does NOT have validation middleware for 'q'
    // Send duplicate q parameters: ?q=A&q=B
    const res = await request(app).get('/api/locations/search?q=A&q=B');

    console.log('Response status:', res.status);

    // The code:
    // const searchTerm = `%${sanitizeLikeSearch(q)}%`;
    // If q is array, sanitizeLikeSearch returns "", so searchTerm is "%%"

    // Check calls to where/orWhere
    // The code uses:
    // .where('name', 'like', searchTerm)
    // .orWhere('state', 'like', searchTerm)

    const nameWhere = mockWhere.mock.calls.find(call => call[0] === 'name');

    if (nameWhere) {
        console.log('Name filter call:', nameWhere);
        // If vulnerable, it is '%%'. If fixed, it should be '%B%' (last value)
        expect(nameWhere[2]).toBe('%B%');
    } else {
        throw new Error('where clause for name not found');
    }
  });
});
