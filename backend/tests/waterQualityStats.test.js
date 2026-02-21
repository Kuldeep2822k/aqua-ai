const request = require('supertest');
const express = require('express');

// Mock the database connection module
jest.mock('../src/db/connection', () => {
  const createMockBuilder = () => {
    const methods = [];
    const builder = {
      clone: jest.fn(() => createMockBuilder()),
      select: jest.fn(function() { methods.push('select'); return this; }),
      count: jest.fn(function() { methods.push('count'); return this; }),
      groupBy: jest.fn(function() { methods.push('groupBy'); return this; }),
      where: jest.fn(function() { methods.push('where'); return this; }),
      whereNotNull: jest.fn(function() { methods.push('whereNotNull'); return this; }),
      avg: jest.fn(function() { methods.push('avg'); return this; }),
      orderBy: jest.fn(function() { methods.push('orderBy'); return this; }),
      limit: jest.fn(function() { methods.push('limit'); return this; }),
      distinct: jest.fn(function() { methods.push('distinct'); return this; }),
      pluck: jest.fn(function() { methods.push('pluck'); return this; }),
      join: jest.fn(function() { methods.push('join'); return this; }),
      // Handle the promise chain
      then: jest.fn((resolve) => {
        // Determine what to return based on methods called on THIS builder instance

        // 1. Count query: .count('* as count') and NOT groupBy
        if (methods.includes('count') && !methods.includes('groupBy')) {
           return Promise.resolve([{ count: 100 }]).then(resolve);
        }

        // 2. Distribution: .select(...).count(...).groupBy(...)
        if (methods.includes('groupBy')) {
           return Promise.resolve([
             { risk_level: 'low', count: 50 },
             { risk_level: 'high', count: 50 }
           ]).then(resolve);
        }

        // 3. Parameters: .distinct(...).pluck(...)
        // 4. States: .distinct(...).pluck(...)
        if (methods.includes('pluck')) {
           return Promise.resolve(['Item1', 'Item2']).then(resolve);
        }

        // 5. Latest reading: .orderBy(...).limit(1)
        if (methods.includes('limit') && methods.includes('orderBy')) {
            return Promise.resolve([{ measurement_date: '2023-10-27T00:00:00.000Z' }]).then(resolve);
        }

        // 6. Avg score: .whereNotNull(...).avg(...)
        if (methods.includes('avg')) {
            return Promise.resolve([{ avg_quality_score: 85.5 }]).then(resolve);
        }

        // Default return empty array
        return Promise.resolve([]).then(resolve);
      }),
    };
    return builder;
  };

  const mockDb = createMockBuilder();
  const dbFn = jest.fn(() => mockDb);
  Object.assign(dbFn, mockDb);

  return { db: dbFn };
});

// Import the router AFTER mocking the db
const waterQualityRoutes = require('../src/routes/waterQuality');

const app = express();
app.use(express.json());
app.use('/api/water-quality', waterQualityRoutes);

describe('GET /api/water-quality/stats', () => {
  it('should return water quality statistics', async () => {
    const res = await request(app).get('/api/water-quality/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      total_readings: 100,
      risk_level_distribution: {
        low: 50,
        medium: 0,
        high: 50,
        critical: 0
      },
      average_quality_score: "85.50",
      parameters_monitored: ['Item1', 'Item2'],
      states_monitored: ['Item1', 'Item2'],
      latest_reading: '2023-10-27T00:00:00.000Z'
    });
  });
});
