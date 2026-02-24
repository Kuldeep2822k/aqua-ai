const request = require('supertest');
const express = require('express');

// Mock dependencies
// Mock Supabase to avoid initialization error
jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  },
}));

// Mock Knex
const mockKnex = jest.fn();

jest.mock('../src/db/connection', () => ({
  db: mockKnex,
}));

// Setup app
const waterQualityRouter = require('../src/routes/waterQuality');
const { errorHandler } = require('../src/middleware/errorHandler');

const app = express();
app.use(express.json());
app.use('/api/water-quality', waterQualityRouter);
app.use(errorHandler);

describe('Water Quality Stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return correct stats structure using optimized Knex queries', async () => {
    // Setup mock return values for the parallel queries
    // 1. Risk Level Counts
    const riskCounts = [
      { risk_level: 'low', count: '10' },
      { risk_level: 'high', count: '5' }
    ];

    // 2. Avg Score
    const avgScore = { avg_score: '75.555' };

    // 3. Distinct Params
    const distinctParams = ['pH', 'DO'];

    // 4. Distinct States
    const distinctStates = ['California', 'Nevada'];

    // 5. Max Date and Total Count
    const datesAndCount = { latest_reading: '2023-10-27T10:00:00Z', total_readings: '15' };

    // Create mocks for each cloned query
    const riskQuery = {
      select: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      then: jest.fn(cb => Promise.resolve(riskCounts).then(cb))
    };

    const avgQuery = {
      avg: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(avgScore)
    };

    const paramQuery = {
      distinct: jest.fn().mockReturnThis(),
      pluck: jest.fn().mockResolvedValue(distinctParams)
    };

    const stateQuery = {
      distinct: jest.fn().mockReturnThis(),
      pluck: jest.fn().mockResolvedValue(distinctStates)
    };

    const dateQuery = {
      max: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      first: jest.fn().mockResolvedValue(datesAndCount)
    };

    let cloneCallCount = 0;
    const baseQuery = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      clone: jest.fn(() => {
        cloneCallCount++;
        switch(cloneCallCount) {
          case 1: return riskQuery;
          case 2: return avgQuery;
          case 3: return paramQuery;
          case 4: return stateQuery;
          case 5: return dateQuery;
          default: return {};
        }
      })
    };

    mockKnex.mockReturnValue(baseQuery);

    const res = await request(app).get('/api/water-quality/stats');

    // If the route is not updated yet, this might fail or return different structure (from Supabase mock)
    // But since Supabase mock returns `this` for everything and `then` is not mocked on it properly to return data,
    // the old implementation will likely crash or return empty/undefined.
    // We expect 200 OK only when implementation is correct.

    if (res.status !== 200) {
        console.log('Response error:', res.body);
    }

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      total_readings: 15,
      risk_level_distribution: { low: 10, medium: 0, high: 5, critical: 0 },
      average_quality_score: '75.56', // Fixed to 2 decimal places. 75.555 -> 75.56
      parameters_monitored: ['pH', 'DO'],
      states_monitored: ['California', 'Nevada'],
      latest_reading: '2023-10-27T10:00:00Z',
    });

    // Verify base query construction
    expect(mockKnex).toHaveBeenCalledWith('water_quality_readings');
    expect(baseQuery.join).toHaveBeenCalledWith('locations', 'water_quality_readings.location_id', 'locations.id');
    expect(baseQuery.join).toHaveBeenCalledWith('water_quality_parameters', 'water_quality_readings.parameter_id', 'water_quality_parameters.id');
  });
});
