const request = require('supertest');
const express = require('express');

// Mock db connection first to override any DB setup during route require
jest.mock('../src/db/connection', () => {
  const mockResult = jest.fn();

  const createQueryBuilder = () => {
    let instanceCount = 0;
    const builder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      clone: jest.fn(() => createQueryBuilder()),
      count: jest.fn().mockReturnThis(),
      countDistinct: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      first: jest.fn(() => {
        instanceCount++;
        return Promise.resolve(mockResult.firstResult(instanceCount));
      }),
      then: function (resolve, reject) {
        return Promise.resolve(mockResult.arrayResult).then(resolve, reject);
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
            limit: jest.fn(() => Promise.resolve({ data: [] })),
          })),
        })),
        ilike: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], count: 0 })),
            limit: jest.fn(() => Promise.resolve({ data: [] })),
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

  it('should use db (Knex) with concurrent aggregations instead of supabase in-memory operations for /stats', async () => {
    let callCount = 0;
    db.mockResult.firstResult = (index) => {
      callCount++;
      // Return distinct mock values based on the clone creation sequence
      // Note: The order of Promise.all matters
      if (callCount === 1) return { count: '100' }; // totalResult
      if (callCount === 2) return { count: '20' }; // statesResult
      if (callCount === 3) return { count: '15' }; // alertsResult
      if (callCount === 4) return { avg: '75.50' }; // avgResult
      return {};
    };

    db.mockResult.arrayResult = [
      { water_body_type: 'River' },
      { water_body_type: 'Lake' },
    ];

    const response = await request(app).get('/api/locations/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total_locations).toBe(100);
    expect(response.body.data.states_covered).toBe(20);
    expect(response.body.data.water_body_types).toEqual(['River', 'Lake']);
    expect(response.body.data.locations_with_alerts).toBe(15);
    expect(response.body.data.average_wqi_score).toBe('75.50');

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

  it('should use db (Knex) group by instead of pulling all records for /risk-summary', async () => {
    db.mockResult.arrayResult = [
      { risk_level: 'safe', count: '50' },
      { risk_level: 'moderate', count: '30' },
      { risk_level: 'poor', count: '10' },
      { risk_level: 'critical', count: '5' },
    ];

    const response = await request(app).get('/api/locations/risk-summary');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.safe).toBe(50);
    expect(response.body.data.moderate).toBe(30);
    expect(response.body.data.poor).toBe(10);
    expect(response.body.data.critical).toBe(5);

    // Check if db was called directly to initiate queries
    expect(db).toHaveBeenCalledWith('location_summary');

    const baseQuery = db.mock.results[0].value;

    expect(baseQuery.select).toHaveBeenCalledWith('risk_level');
    expect(baseQuery.count).toHaveBeenCalledWith('* as count');
    expect(baseQuery.groupBy).toHaveBeenCalledWith('risk_level');
  });
});
