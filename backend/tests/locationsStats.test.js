const express = require('express');
const request = require('supertest');
const router = require('../src/routes/locations');
const { db } = require('../src/db/connection');

jest.mock('../src/db/connection', () => ({
  db: jest.fn()
}));

jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
  }
}));

const app = express();
app.use(express.json());
app.use('/', router);

describe('Location Statistics Endpoints', () => {
  describe('GET /stats', () => {
    it('should return location statistics via Knex server-side aggregations', async () => {
      const mockFirst = jest.fn().mockResolvedValue({
        total_locations: '100',
        states_covered: '10',
        average_wqi_score: '75.5',
        alerts: '5'
      });

      const mockBodyTypes = jest.fn().mockResolvedValue([
        { water_body_type: 'River' },
        { water_body_type: 'Lake' }
      ]);

      const createQueryBuilder = (type) => {
        const qb = {
          count: jest.fn().mockReturnThis(),
          countDistinct: jest.fn().mockReturnThis(),
          sum: jest.fn().mockReturnThis(),
          avg: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          whereNotNull: jest.fn().mockReturnThis(),
          first: mockFirst,
          then: function(resolve) {
            if (type === 'bodyTypes') return mockBodyTypes().then(resolve);
            return mockFirst().then(resolve);
          },
        };
        return qb;
      };

      let callCount = 0;
      db.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return createQueryBuilder('stats');
        if (callCount === 2) return createQueryBuilder('bodyTypes');
        return createQueryBuilder('stats');
      });

      db.raw = jest.fn().mockImplementation((val) => val);

      const res = await request(app).get('/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total_locations).toBe(100);
      expect(res.body.data.states_covered).toBe(10);
      expect(res.body.data.average_wqi_score).toBe('75.50');
      expect(res.body.data.locations_with_alerts).toBe(5);
      expect(res.body.data.water_body_types).toEqual(['River', 'Lake']);
    });
  });

  describe('GET /risk-summary', () => {
    it('should return risk level summary via Knex server-side grouping', async () => {
      const mockGroupByResults = [
        { risk_level: 'safe', count: '10' },
        { risk_level: 'moderate', count: '20' },
        { risk_level: 'poor', count: '5' },
        { risk_level: 'critical', count: '2' },
        { risk_level: null, count: '3' } // tests unknown fallback
      ];

      const qb = {
        select: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        then: function(resolve) {
          return Promise.resolve(mockGroupByResults).then(resolve);
        }
      };

      db.mockImplementation(() => qb);

      const res = await request(app).get('/risk-summary');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({
        safe: 10,
        moderate: 20,
        poor: 5,
        critical: 2,
        unknown: 3
      });
    });
  });
});
