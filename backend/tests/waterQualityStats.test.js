const request = require('supertest');
const app = require('../src/server');

// Mock dependencies
jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn(() => mockDb);

  // Chainable methods
  mockDb.join = jest.fn().mockReturnThis();
  mockDb.where = jest.fn().mockReturnThis();
  mockDb.whereILike = jest.fn().mockReturnThis();
  mockDb.select = jest.fn().mockReturnThis();
  mockDb.distinct = jest.fn().mockReturnThis();
  mockDb.pluck = jest.fn().mockReturnThis();
  mockDb.raw = jest.fn((str) => str);

  // clone needs to return a new object to simulate branching
  mockDb.clone = jest.fn(() => {
    return {
      select: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue({
        total_readings: 100,
        average_quality_score: 85.5,
        latest_reading: '2023-01-01',
        low: 50,
        medium: 30,
        high: 15,
        critical: 5,
      }),
      distinct: jest.fn().mockReturnThis(),
      pluck: jest.fn().mockImplementation((field) => {
        if (field.includes('parameter')) return Promise.resolve(['PH', 'DO']);
        if (field.includes('state'))
          return Promise.resolve(['Maharashtra', 'Delhi']);
        return Promise.resolve([]);
      }),
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereILike: jest.fn().mockReturnThis(),
    };
  });

  return {
    db: mockDb,
    testConnection: jest.fn().mockResolvedValue(true),
    getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
    closeConnection: jest.fn().mockResolvedValue(),
  };
});

// Mock Supabase to satisfy imports in other routes
jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    // Fix: Implement then to call the resolve callback for await compatibility
    then: jest.fn((resolve) => resolve({ data: [], count: 0, error: null })),
  },
}));

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('GET /api/water-quality/stats', () => {
  it('should return aggregated stats correctly', async () => {
    const res = await request(app).get('/api/water-quality/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total_readings).toBe(100);
    expect(res.body.data.average_quality_score).toBe('85.50');
    expect(res.body.data.risk_level_distribution).toEqual({
      low: 50,
      medium: 30,
      high: 15,
      critical: 5,
    });
    expect(res.body.data.parameters_monitored).toEqual(['PH', 'DO']);
    expect(res.body.data.states_monitored).toEqual(['Maharashtra', 'Delhi']);
  });
});
