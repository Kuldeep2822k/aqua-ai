const request = require('supertest');

// 1. Define the specific mocks for each query type
const mockCountQuery = {
  clearSelect: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve([{ count: 100 }])),
};

const mockDistQuery = {
  select: jest.fn().mockReturnThis(),
  count: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) =>
    resolve([
      { risk_level: 'low', count: 50 },
      { risk_level: 'high', count: 50 },
    ])
  ),
  [Symbol.iterator]: function* () {
    yield { risk_level: 'low', count: 50 };
    yield { risk_level: 'high', count: 50 };
  },
};

const mockParamsQuery = {
  distinct: jest.fn().mockReturnThis(),
  pluck: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve(['PH', 'DO'])),
};

const mockStatesQuery = {
  distinct: jest.fn().mockReturnThis(),
  pluck: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve(['Maharashtra', 'Delhi'])),
};

const mockLatestQuery = {
  select: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) =>
    resolve([{ measurement_date: '2023-01-01T00:00:00Z' }])
  ),
};

const mockAvgQuery = {
  whereNotNull: jest.fn().mockReturnThis(),
  avg: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve([{ avg_quality_score: 85.5 }])),
};

// 2. Define the base query builder
const mockBaseQuery = {
  join: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  clone: jest
    .fn()
    // Sequence must match the order in the controller
    .mockReturnValueOnce(mockCountQuery)
    .mockReturnValueOnce(mockDistQuery)
    .mockReturnValueOnce(mockParamsQuery)
    .mockReturnValueOnce(mockStatesQuery)
    .mockReturnValueOnce(mockLatestQuery)
    .mockReturnValueOnce(mockAvgQuery),
};

// 3. Mock the db connection module
jest.mock('../src/db/connection', () => ({
  db: jest.fn(() => mockBaseQuery),
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// 4. Mock auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

// 5. Mock logger to suppress noise
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const app = require('../src/server');

describe('Water Quality Stats Endpoint', () => {
  beforeEach(() => {
    // Reset the clone mock to ensure the sequence starts from the beginning for each test
    mockBaseQuery.clone.mockClear();
    mockBaseQuery.clone
      .mockReturnValueOnce(mockCountQuery)
      .mockReturnValueOnce(mockDistQuery)
      .mockReturnValueOnce(mockParamsQuery)
      .mockReturnValueOnce(mockStatesQuery)
      .mockReturnValueOnce(mockLatestQuery)
      .mockReturnValueOnce(mockAvgQuery);
  });

  it('should return water quality statistics with correct structure', async () => {
    const res = await request(app).get('/api/water-quality/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data).toHaveProperty('total_readings', 100);
    expect(data.risk_level_distribution).toEqual(
      expect.objectContaining({
        low: 50,
        high: 50,
        medium: 0,
        critical: 0,
      })
    );
    expect(data.parameters_monitored).toEqual(['PH', 'DO']);
    expect(data.states_monitored).toEqual(['Maharashtra', 'Delhi']);
    expect(data.average_quality_score).toBe('85.50');
    expect(data.latest_reading).toBe('2023-01-01T00:00:00Z');

    // Verify clone was called 6 times
    expect(mockBaseQuery.clone).toHaveBeenCalledTimes(6);
  });
});
