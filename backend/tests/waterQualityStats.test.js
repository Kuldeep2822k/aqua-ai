const request = require('supertest');
const express = require('express');

// Mock db connection first to override any DB setup during route require
jest.mock('../src/db/connection', () => {
  const mockResult = jest.fn();

  const createQueryBuilder = () => {
    const builder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      clone: jest.fn(() => createQueryBuilder()),
      count: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      first: jest.fn(() => Promise.resolve(mockResult.firstResult)),
      then: function (resolve, reject) {
        return Promise.resolve(mockResult.arrayResult).then(resolve, reject);
      }
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
            range: jest.fn(() => Promise.resolve({ data: [], count: 0 }))
          }))
        }))
      }))
    }))
  }
}));

const waterQualityRoutes = require('../src/routes/waterQuality');
const app = express();
app.use(express.json());
app.use('/api/water-quality', waterQualityRoutes);

const { db } = require('../src/db/connection');

describe('GET /api/water-quality/stats Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use db (Knex) with concurrent aggregations instead of supabase in-memory operations', async () => {
    // Setup mock returns. The Promise.all calls .first() for single items and awaits the builder for arrays.
    // For 'totalResult', 'avgResult', 'latestResult', we need a distinct return.
    // However, our generic mock will just return what we set to handle the structure.

    db.mockResult.firstResult = { total: '150', avg_score: '85.50', latest_date: '2023-10-01T00:00:00Z' };
    db.mockResult.arrayResult = [
      { risk_level: 'critical', count: '10' },
      { risk_level: 'warning', count: '20' }, // using standard keys, map logic uses risk_level & count
      { parameter_code: 'PH' },
      { parameter_code: 'DO' },
      { state: 'Karnataka' },
      { state: 'Maharashtra' }
    ];

    const response = await request(app).get('/api/water-quality/stats?state=Karnataka&parameter=PH');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total_readings).toBe(150);
    expect(response.body.data.average_quality_score).toBe('85.50');
    expect(response.body.data.latest_reading).toBe('2023-10-01T00:00:00Z');

    // Check if db was called directly to initiate queries
    expect(db).toHaveBeenCalledWith('water_quality_readings as wqr');

    // Get the base query builder mock instance used
    const baseQuery = db.mock.results[0].value;

    // Check joins are added
    expect(baseQuery.join).toHaveBeenCalledWith('locations as l', 'wqr.location_id', 'l.id');
    expect(baseQuery.join).toHaveBeenCalledWith('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id');

    // Check filter logic works on the builder
    expect(baseQuery.where).toHaveBeenCalledWith('l.state', 'ilike', '%Karnataka%');
    expect(baseQuery.where).toHaveBeenCalledWith('wqp.parameter_code', '=', 'PH');

    // Validate concurrent query generation via clone calls
    expect(baseQuery.clone).toHaveBeenCalledTimes(6);
  });
});
