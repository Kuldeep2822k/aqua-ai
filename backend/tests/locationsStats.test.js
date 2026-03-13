const request = require('supertest');
const express = require('express');

// Mock db connection first to override any DB setup during route require
jest.mock('../src/db/connection', () => {
  const createQueryBuilder = () => {
    const builder = {
      join: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      clone: function() { return this; },
      count: jest.fn().mockReturnThis(),
      countDistinct: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      max: jest.fn().mockReturnThis(),
      first: jest.fn(() => Promise.resolve({})),
      then: function (resolve, reject) {
        return Promise.resolve([]).then(resolve, reject);
      },
    };
    return builder;
  };

  const dbMock = jest.fn(() => createQueryBuilder());
  dbMock.createQueryBuilder = createQueryBuilder;

  return { db: dbMock, closeConnection: jest.fn() };
});

jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() =>
              Promise.resolve({ data: [], error: null })
            ),
          })),
        })),
        order: jest.fn(() => ({
          limit: jest.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    })),
  },
}));

const locationsRouter = require('../src/routes/locations');

describe('GET /api/locations/stats Optimization', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/locations', locationsRouter);
  });

  it('should use db (Knex) with concurrent aggregations instead of supabase in-memory operations', async () => {
    const { db } = require('../src/db/connection');
    const { supabase } = require('../src/db/supabase');

    let instanceCount = 0;

    // Override the behavior of the mocked builder instances directly
    // by intercepting clone to return fresh builders tailored to the call order
    db.mockImplementation(() => {
      const rootBuilder = db.createQueryBuilder();

      rootBuilder.clone = jest.fn(() => {
        const clonedBuilder = db.createQueryBuilder();

        // Keep track of which clone index this is
        instanceCount++;
        let cloneIndex = instanceCount;

        clonedBuilder.first = jest.fn(() => {
          if (cloneIndex === 1) return Promise.resolve({ total: 100 }); // total_locations
          if (cloneIndex === 2) return Promise.resolve({ count: 10 }); // states_covered
          if (cloneIndex === 4) return Promise.resolve({ total: 5 }); // locations_with_alerts
          if (cloneIndex === 5) return Promise.resolve({ avg: 65.5 }); // average_wqi_score
          return Promise.resolve({});
        });

        clonedBuilder.then = function(resolve, reject) {
          if (cloneIndex === 3) {
            instanceCount++; // advance count for the distinct query
            return Promise.resolve([{ water_body_type: 'River' }, { water_body_type: 'Lake' }]).then(resolve, reject);
          }
          // Default empty array resolution for other then() invocations not matching our counts
          return Promise.resolve([]).then(resolve, reject);
        };

        return clonedBuilder;
      });

      return rootBuilder;
    });

    const response = await request(app).get('/api/locations/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total_locations).toBe(100);
    expect(response.body.data.states_covered).toBe(10);
    expect(response.body.data.water_body_types).toEqual(['River', 'Lake']);
    expect(response.body.data.locations_with_alerts).toBe(5);
    expect(response.body.data.average_wqi_score).toBe('65.50');

    // Supabase should not be called for stats
    expect(supabase.from).not.toHaveBeenCalled();

    // Verify Knex was called directly on table
    expect(db).toHaveBeenCalledWith('location_summary');
  });
});