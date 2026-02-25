const request = require('supertest');

// Create a factory for query builders
const createQueryBuilder = (result) => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    avg: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    first: jest.fn().mockImplementation(() => Promise.resolve(result)),
    then: jest.fn((resolve) => Promise.resolve(result).then(resolve)),
  };
  return builder;
};

// Mock Knex instance
const mockDb = jest.fn();

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(),
};

jest.mock('../src/db/connection', () => ({
  db: mockDb,
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/db/supabase', () => ({
  supabase: mockSupabase,
}));

// Mock auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 1, role: 'user' };
    next();
  },
  optionalAuth: (req, res, next) => next(),
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

describe('GET /api/water-quality/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return stats structure with Knex aggregation', async () => {
    // We expect 6 calls to db()

    // 1. Risk Level Distribution
    mockDb.mockReturnValueOnce(
      createQueryBuilder([
        { risk_level: 'low', count: 10 },
        { risk_level: 'high', count: 5 },
      ])
    );

    // 2. Average Quality Score (returns object because of .first())
    mockDb.mockReturnValueOnce(createQueryBuilder({ avg_score: 75.5 }));

    // 3. Latest Reading (returns object because of .first())
    mockDb.mockReturnValueOnce(
      createQueryBuilder({ latest_date: '2023-10-27T10:00:00Z' })
    );

    // 4. Distinct Parameters
    mockDb.mockReturnValueOnce(
      createQueryBuilder([{ parameter_code: 'PH' }, { parameter_code: 'DO' }])
    );

    // 5. Distinct States
    mockDb.mockReturnValueOnce(
      createQueryBuilder([{ state: 'California' }, { state: 'Nevada' }])
    );

    // 6. Total Readings Count
    mockDb.mockReturnValueOnce(createQueryBuilder([{ total: 15 }]));

    const res = await request(app).get('/api/water-quality/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.total_readings).toBe(15);
    expect(data.risk_level_distribution).toEqual({
      low: 10,
      medium: 0,
      high: 5,
      critical: 0,
    });
    expect(data.average_quality_score).toBe('75.50'); // toFixed(2) returns string
    expect(data.latest_reading).toBe('2023-10-27T10:00:00Z');
    expect(data.parameters_monitored).toEqual(['PH', 'DO']);
    expect(data.states_monitored).toEqual(['California', 'Nevada']);
  });
});
