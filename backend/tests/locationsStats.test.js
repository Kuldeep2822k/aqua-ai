const request = require('supertest');
const express = require('express');

// Mock db connection first to override any DB setup during route require
jest.mock('../src/db/connection', () => {
  const mockResult = jest.fn();

  const createQueryBuilder = () => {
    const builder = {
      select: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      clone: jest.fn(() => createQueryBuilder()),
      first: jest.fn(() => Promise.resolve(mockResult.firstResult)),
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

describe('GET /api/locations/stats & risk-summary Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/locations/stats', () => {
    it('should use db (Knex) with concurrent aggregations instead of supabase in-memory operations', async () => {
      // Mock returns for `first` (objects) and array queries
      db.mockResult.firstResult = {
        total: '100',
        count: '15',
        avg_wqi_score: '65.40'
      };

      db.mockResult.arrayResult = [
        { state: 'Delhi' },
        { state: 'Goa' },
        { water_body_type: 'River' },
        { water_body_type: 'Lake' }
      ];

      const response = await request(app).get('/api/locations/stats');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total_locations).toBe(100);
      expect(response.body.data.locations_with_alerts).toBe(15);
      expect(response.body.data.average_wqi_score).toBe('65.40');

      // Check if db was called directly to initiate queries
      expect(db).toHaveBeenCalledWith('location_summary');

      // Get the base query builder mock instance used
      const baseQuery = db.mock.results[0].value;

      // Validate concurrent query generation via clone calls (5 distinct queries)
      expect(baseQuery.clone).toHaveBeenCalledTimes(5);
    });
  });

  describe('GET /api/locations/risk-summary', () => {
    it('should use db (Knex) aggregation for risk summary', async () => {
      db.mockResult.arrayResult = [
        { risk_level: 'safe', count: '50' },
        { risk_level: 'moderate', count: '30' },
        { risk_level: 'critical', count: '5' },
        { risk_level: 'unknown', count: '10' },
        { risk_level: 'nonexistent_key', count: '5' }, // tests fallback to 'unknown'
      ];

      const response = await request(app).get('/api/locations/risk-summary');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.safe).toBe(50);
      expect(response.body.data.moderate).toBe(30);
      expect(response.body.data.critical).toBe(5);
      // 'unknown' should accumulate its own count + fallback values
      expect(response.body.data.unknown).toBe(15);
      expect(response.body.data.poor).toBe(0); // 0 by default

      // We expect 1 call to db in this test
      expect(db).toHaveBeenCalledWith('location_summary');
      const baseQuery = db.mock.results[0].value;

      expect(baseQuery.select).toHaveBeenCalledWith('risk_level');
      expect(baseQuery.count).toHaveBeenCalledWith('* as count');
      expect(baseQuery.groupBy).toHaveBeenCalledWith('risk_level');
    });
  });
});
