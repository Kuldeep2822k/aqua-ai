const request = require('supertest');
const express = require('express');

// Mock db connection first to override any DB setup during route require
jest.mock('../src/db/connection', () => {
  let instanceCount = 0;

  const createQueryBuilder = () => {
    const builderIndex = instanceCount++;

    const builder = {
      clone: jest.fn(() => createQueryBuilder()),
      count: jest.fn().mockReturnThis(),
      countDistinct: jest.fn().mockReturnThis(),
      distinct: jest.fn().mockReturnThis(),
      whereNotNull: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      avg: jest.fn().mockReturnThis(),
      first: jest.fn(() => {
        // Return distinct mock values based on the index to mimic Promise.all sequence
        switch (builderIndex) {
          case 1: // total
            return Promise.resolve({ total: '100' });
          case 2: // states_covered
            return Promise.resolve({ count: '5' });
          case 4: // locations_with_alerts
            return Promise.resolve({ count: '10' });
          case 5: // average_wqi_score
            return Promise.resolve({ avg_score: '75.50' });
          default:
            return Promise.resolve({});
        }
      }),
      then: function (resolve, reject) {
        // Only bodyTypesResult (index 3) is awaited without .first()
        if (builderIndex === 3) {
          return Promise.resolve([
            { water_body_type: 'River' },
            { water_body_type: 'Lake' },
          ]).then(resolve, reject);
        }
        return Promise.resolve([]).then(resolve, reject);
      },
    };
    return builder;
  };

  const dbMock = jest.fn(() => createQueryBuilder());
  dbMock.createQueryBuilder = createQueryBuilder;
  // Expose instanceCount reset mechanism for beforeEach
  dbMock.resetInstanceCount = () => {
    instanceCount = 0;
  };

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

describe('GET /api/locations/stats Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.resetInstanceCount();
  });

  it('should use db (Knex) with concurrent aggregations instead of supabase in-memory operations', async () => {
    const response = await request(app).get('/api/locations/stats');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.total_locations).toBe(100);
    expect(response.body.data.states_covered).toBe(5);
    expect(response.body.data.water_body_types).toEqual(['River', 'Lake']);
    expect(response.body.data.locations_with_alerts).toBe(10);
    expect(response.body.data.average_wqi_score).toBe('75.50');

    // Check if db was called directly to initiate queries
    expect(db).toHaveBeenCalledWith('location_summary');

    // Get the base query builder mock instance used
    const baseQuery = db.mock.results[0].value;

    // Validate concurrent query generation via clone calls
    expect(baseQuery.clone).toHaveBeenCalledTimes(5);
  });
});
