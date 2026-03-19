const request = require('supertest');
const express = require('express');
const { db } = require('../src/db/connection');
const locationsRouter = require('../src/routes/locations');
const { supabase } = require('../src/db/supabase');

// Mock external dependencies
jest.mock('../src/db/connection', () => ({
  db: jest.fn(),
}));

jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Setup Express app
const app = express();
app.use(express.json());
app.use('/api/locations', locationsRouter);

describe('Locations Stats Endpoint Performance Optimization', () => {
  let mockQueryBuilder;

  beforeEach(() => {
    jest.clearAllMocks();

    let cloneIndex = 0;

    // Create a chainable mock query builder for Knex
    mockQueryBuilder = {
      clone: jest.fn().mockImplementation(() => {
        const index = cloneIndex++;

        return {
          count: jest.fn().mockReturnThis(),
          countDistinct: jest.fn().mockReturnThis(),
          distinct: jest.fn().mockReturnThis(),
          avg: jest.fn().mockReturnThis(),
          whereNotNull: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          first: jest.fn().mockImplementation(() => {
            // totalResult
            if (index === 0) return Promise.resolve({ total: 150 });
            // statesResult
            if (index === 1) return Promise.resolve({ states_covered: 12 });
            // alertsResult
            if (index === 3) return Promise.resolve({ locations_with_alerts: 45 });
            // avgWqiResult
            if (index === 4) return Promise.resolve({ avg_wqi: 75.6 });

            return Promise.resolve(null);
          }),
          then: jest.fn().mockImplementation((resolve) => {
             // waterBodyTypesResult (index 2) doesn't use .first()
             if (index === 2) {
               resolve([
                 { water_body_type: 'river' },
                 { water_body_type: 'lake' },
                 { water_body_type: 'groundwater' }
               ]);
             }
             return Promise.resolve();
          })
        };
      })
    };

    // When db('location_summary as ls') is called, return the query builder
    db.mockReturnValue(mockQueryBuilder);
  });

  it('should use Knex aggregations to avoid pulling all rows into memory', async () => {
    const response = await request(app).get('/api/locations/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify that the exact numbers are returned
    expect(response.body.data).toEqual({
      total_locations: 150,
      states_covered: 12,
      water_body_types: ['river', 'lake', 'groundwater'],
      locations_with_alerts: 45,
      average_wqi_score: '75.60',
    });

    // Verify that the database was called correctly
    expect(db).toHaveBeenCalledWith('location_summary as ls');
    expect(mockQueryBuilder.clone).toHaveBeenCalledTimes(5);

    // The older implementation would have called supabase.from('location_summary')
    expect(supabase.from).not.toHaveBeenCalledWith('location_summary');
  });
});