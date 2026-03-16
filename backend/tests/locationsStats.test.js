const request = require('supertest');
const express = require('express');

// Mock db connection first to override any DB setup during route require
jest.mock('../src/db/connection', () => {
  const mockResult = jest.fn();

  const createQueryBuilder = () => {
    let cloneIndex = 0;
    const builder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      clone: jest.fn(() => {
        const clonedBuilder = createQueryBuilder();
        clonedBuilder._cloneIndex = cloneIndex++;
        return clonedBuilder;
      }),
      count: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      countDistinct: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      first: jest.fn(function () {
        // Return different mocked values based on the clone index for /stats endpoint
        if (this._cloneIndex === 0) return Promise.resolve(mockResult.totalResult);
        if (this._cloneIndex === 1) return Promise.resolve(mockResult.stateResult);
        if (this._cloneIndex === 3) return Promise.resolve(mockResult.alertsResult);
        if (this._cloneIndex === 4) return Promise.resolve(mockResult.avgResult);
        return Promise.resolve({});
      }),
      then: function (resolve, reject) {
        // For distinct query that returns array
        if (this._cloneIndex === 2) return Promise.resolve(mockResult.bodyTypeResult).then(resolve, reject);

        // For /risk-summary endpoint which does not use clone
        return Promise.resolve(mockResult.riskResult).then(resolve, reject);
      },
    };
    return builder;
  };

  const dbMock = jest.fn(() => createQueryBuilder());
  dbMock.mockResult = mockResult;
  dbMock.createQueryBuilder = createQueryBuilder;

  return { db: dbMock, closeConnection: jest.fn() };
});

jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], count: 0 })),
          })),
        })),
        ilike: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], count: 0 })),
          })),
        })),
      })),
    })),
  },
}));

const locationsRoutes = require('../src/routes/locations');
const app = express();
app.use(express.json());
app.use('/api/locations', locationsRoutes);

const { db } = require('../src/db/connection');

describe('GET /api/locations/stats Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use db (Knex) with concurrent aggregations instead of supabase in-memory operations', async () => {
    db.mockResult.totalResult = { total: '100' };
    db.mockResult.stateResult = { count: '10' };
    db.mockResult.bodyTypeResult = [{ water_body_type: 'River' }, { water_body_type: 'Lake' }];
    db.mockResult.alertsResult = { count: '5' };
    db.mockResult.avgResult = { avg_score: '65.43' };

    const response = await request(app).get('/api/locations/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total_locations).toBe(100);
    expect(response.body.data.states_covered).toBe(10);
    expect(response.body.data.water_body_types).toEqual(['River', 'Lake']);
    expect(response.body.data.locations_with_alerts).toBe(5);
    expect(response.body.data.average_wqi_score).toBe('65.43');

    // Check if db was called directly to initiate queries
    expect(db).toHaveBeenCalledWith('location_summary');

    // Get the base query builder mock instance used
    const baseQuery = db.mock.results[0].value;

    // Validate concurrent query generation via clone calls
    expect(baseQuery.clone).toHaveBeenCalledTimes(5);
  });
});

describe('GET /api/locations/risk-summary Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use db (Knex) with server-side grouping instead of supabase in-memory operations', async () => {
    db.mockResult.riskResult = [
      { risk_level: 'critical', count: '10' },
      { risk_level: 'poor', count: '20' },
      { risk_level: 'moderate', count: '30' },
      { risk_level: 'safe', count: '40' },
      { risk_level: 'unknown', count: '5' },
      { risk_level: null, count: '2' },
    ];

    const response = await request(app).get('/api/locations/risk-summary');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      safe: 40,
      moderate: 30,
      poor: 20,
      critical: 10,
      unknown: 7 // 5 'unknown' + 2 nulls
    });

    // Check if db was called directly to initiate queries
    expect(db).toHaveBeenCalledWith('location_summary');

    // Get the base query builder mock instance used
    const baseQuery = db.mock.results[0].value;

    expect(baseQuery.select).toHaveBeenCalledWith('risk_level');
    expect(baseQuery.count).toHaveBeenCalledWith('* as count');
    expect(baseQuery.groupBy).toHaveBeenCalledWith('risk_level');
  });
});
