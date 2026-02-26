const request = require('supertest');
const express = require('express');

// Mock Query Builder factory
const createMockBuilder = (overrides = {}) => {
  const builder = {
    join: jest.fn().mockReturnThis(),
    whereILike: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    avg: jest.fn().mockReturnThis(),
    max: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    pluck: jest.fn().mockReturnThis(),
    first: jest.fn(),
    then: jest.fn(),
    clone: jest.fn(),
    ...overrides,
  };
  return builder;
};

const mockBaseBuilder = createMockBuilder();
const mockDb = jest.fn(() => mockBaseBuilder);

jest.mock('../src/db/connection', () => ({
  db: mockDb,
}));

// Mock Supabase to prevent initialization errors in other routes
jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({ select: jest.fn() }),
  },
}));

const waterQualityRoutes = require('../src/routes/waterQuality');

const app = express();
app.use(express.json());
app.use('/api/water-quality', waterQualityRoutes);

describe('GET /api/water-quality/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset base builder methods to return itself
    Object.keys(mockBaseBuilder).forEach((key) => {
      if (mockBaseBuilder[key].mockReturnThis) {
        mockBaseBuilder[key].mockReturnThis();
      }
    });
  });

  it('should calculate statistics correctly using Knex aggregation', async () => {
    // Setup mock returns for the 4 parallel queries

    // 1. Stats query (first())
    const mockStats = {
      total_readings: '3',
      average_quality_score: '70.00',
      latest_reading: '2023-01-03',
    };
    const statsBuilder = createMockBuilder({
      first: jest.fn().mockResolvedValue(mockStats),
      count: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
    });

    // 2. Risk distribution (then() -> array)
    const mockRiskDistribution = [
      { risk_level: 'low', count: '2' },
      { risk_level: 'high', count: '1' },
    ];
    const riskBuilder = createMockBuilder({
      then: jest.fn((resolve) => resolve(mockRiskDistribution)),
      select: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
    });

    // 3. Parameters (pluck() -> then() -> array)
    const mockParams = ['PH', 'DO'];
    const paramsBuilder = createMockBuilder({
      pluck: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(mockParams)),
    });

    // 4. States (pluck() -> then() -> array)
    const mockStates = ['StateA', 'StateB'];
    const statesBuilder = createMockBuilder({
      pluck: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      then: jest.fn((resolve) => resolve(mockStates)),
    });

    // Mock clone to return the specific builders in order
    mockBaseBuilder.clone
      .mockReturnValueOnce(statsBuilder)
      .mockReturnValueOnce(riskBuilder)
      .mockReturnValueOnce(paramsBuilder)
      .mockReturnValueOnce(statesBuilder);

    const res = await request(app).get('/api/water-quality/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.total_readings).toBe(3);
    expect(res.body.data.risk_level_distribution).toEqual({
      low: 2,
      medium: 0,
      high: 1,
      critical: 0,
    });
    expect(res.body.data.average_quality_score).toBe('70.00');
    expect(res.body.data.parameters_monitored).toEqual(['PH', 'DO']);
    expect(res.body.data.states_monitored).toEqual(['StateA', 'StateB']);
    expect(res.body.data.latest_reading).toBe('2023-01-03');

    // Verify db usage
    expect(mockDb).toHaveBeenCalledWith('water_quality_readings');
    expect(mockBaseBuilder.join).toHaveBeenCalledTimes(2);
    expect(mockBaseBuilder.clone).toHaveBeenCalledTimes(4);
  });
});
