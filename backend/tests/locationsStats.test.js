const request = require('supertest');

// Mock dependencies BEFORE importing app
jest.mock('../src/db/connection', () => {
  const mockDb = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({
      total_locations: 3,
      states_covered: 2,
      locations_with_alerts: 2,
      average_wqi_score: 85.00,
    }),
    distinct: jest.fn().mockReturnThis(),
    whereNotNull: jest.fn().mockReturnThis(),
    pluck: jest.fn().mockResolvedValue(['Type1', 'Type2']),
  }));

  mockDb.raw = jest.fn((sql) => sql);

  return {
    db: mockDb,
    testConnection: jest.fn().mockResolvedValue(true),
    getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
    closeConnection: jest.fn().mockResolvedValue(),
  };
});

jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
  generateToken: () => 'mock-token',
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

const app = require('../src/server');
const { db } = require('../src/db/connection');

describe('GET /api/locations/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct statistics based on mocked data', async () => {
    // Reset mocks to default successful state
    db.mockImplementation((table) => {
      if (table === 'location_summary') {
        return {
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            total_locations: 3,
            states_covered: 2,
            locations_with_alerts: 2,
            average_wqi_score: 85.00,
          }),
          distinct: jest.fn().mockReturnThis(),
          whereNotNull: jest.fn().mockReturnThis(),
          pluck: jest.fn().mockResolvedValue(['Type1', 'Type2']),
        };
      }
      return {};
    });

    const res = await request(app).get('/api/locations/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const stats = res.body.data;

    expect(stats.total_locations).toBe(3);
    expect(stats.states_covered).toBe(2);
    expect(stats.water_body_types).toEqual(expect.arrayContaining(['Type1', 'Type2']));
    expect(stats.locations_with_alerts).toBe(2);
    expect(stats.average_wqi_score).toBe('85.00');
  });

  it('should handle database error', async () => {
    db.mockImplementation(() => {
      throw new Error('Database error');
    });

    const res = await request(app).get('/api/locations/stats');

    expect(res.status).toBe(500);
    // Express error handler might wrap it or return specific structure
    // Our errorHandler middleware usually returns success: false
    expect(res.body.success).toBe(false);
  });

  it('should handle empty data', async () => {
     db.mockImplementation((table) => {
      if (table === 'location_summary') {
        return {
          select: jest.fn().mockReturnThis(),
          first: jest.fn().mockResolvedValue({
            total_locations: 0,
            states_covered: 0,
            locations_with_alerts: 0,
            average_wqi_score: null,
          }),
          distinct: jest.fn().mockReturnThis(),
          whereNotNull: jest.fn().mockReturnThis(),
          pluck: jest.fn().mockResolvedValue([]),
        };
      }
      return {};
    });

    const res = await request(app).get('/api/locations/stats');

    expect(res.status).toBe(200);
    const stats = res.body.data;
    expect(stats.total_locations).toBe(0);
    expect(stats.states_covered).toBe(0);
    expect(stats.water_body_types).toEqual([]);
    expect(stats.locations_with_alerts).toBe(0);
    expect(stats.average_wqi_score).toBeNull();
  });
});
