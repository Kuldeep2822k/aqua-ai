const request = require('supertest');

// --- Mock Factory for Intelligent Query Builder ---
const createMockQueryBuilder = () => {
  const state = {
    calls: [],
    methods: new Set(),
    shouldReject: false,
    rejectError: null,
  };

  const builder = {
    // Chainable methods - return 'this' and record call
    select: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'select', args });
      state.methods.add('select');
      return builder;
    }),
    count: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'count', args });
      state.methods.add('count');
      return builder;
    }),
    groupBy: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'groupBy', args });
      state.methods.add('groupBy');
      return builder;
    }),
    distinct: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'distinct', args });
      state.methods.add('distinct');
      return builder;
    }),
    pluck: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'pluck', args });
      state.methods.add('pluck');
      return builder;
    }),
    orderBy: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'orderBy', args });
      state.methods.add('orderBy');
      return builder;
    }),
    limit: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'limit', args });
      state.methods.add('limit');
      return builder;
    }),
    whereNotNull: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'whereNotNull', args });
      state.methods.add('whereNotNull');
      return builder;
    }),
    avg: jest.fn().mockImplementation((...args) => {
      state.calls.push({ method: 'avg', args });
      state.methods.add('avg');
      return builder;
    }),
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    clearSelect: jest.fn().mockReturnThis(),

    // Clone creates a new builder
    clone: jest.fn().mockImplementation(() => createMockQueryBuilder()),

    // Thenable implementation with logic
    then: jest.fn((resolve, reject) => {
      try {
        if (state.shouldReject) {
          if (reject) return reject(state.rejectError);
          throw state.rejectError;
        }

        let result;

        // Logic to determine which query this is based on calls
        if (state.methods.has('avg')) {
          // Average Score Query
          result = [{ avg_quality_score: 85.5 }];
        } else if (state.methods.has('groupBy') && state.methods.has('count')) {
          // Distribution Query
          result = [
            { risk_level: 'low', count: 50 },
            { risk_level: 'high', count: 50 },
          ];
        } else if (state.methods.has('count') && !state.methods.has('groupBy')) {
          // Total Count Query
          result = [{ count: 100 }];
        } else if (state.methods.has('distinct')) {
          // Check what we are plucking or distinct-ing
          const pluckCall = state.calls.find((c) => c.method === 'pluck');
          const distinctCall = state.calls.find((c) => c.method === 'distinct');
          const field = pluckCall?.args[0] || distinctCall?.args[0];

          if (field && field.includes('parameter_code')) {
            // Parameters Query
            result = ['PH', 'DO'];
          } else if (field && field.includes('state')) {
            // States Query
            result = ['Maharashtra', 'Delhi'];
          } else {
            result = [];
          }
        } else if (state.methods.has('limit') && state.methods.has('orderBy')) {
          // Latest Reading Query
          result = [{ measurement_date: '2023-01-01T00:00:00Z' }];
        } else {
          // Default fallback
          result = [];
        }

        return resolve(result);
      } catch (error) {
        if (reject) return reject(error);
        throw error;
      }
    }),

    // Helper to force rejection for testing
    __reject: (error) => {
      state.shouldReject = true;
      state.rejectError = error;
    }
  };

  // Add iterator for Distribution Query (Knex returns array-like results that might be iterated)
  builder[Symbol.iterator] = function* () {
    // This is a simplified iterator that assumes distribution query logic if iterated
     yield { risk_level: 'low', count: 50 };
     yield { risk_level: 'high', count: 50 };
  };

  return builder;
};

// Create a persistent mock builder for tests to reference
const mockBaseQuery = createMockQueryBuilder();

// 3. Mock the db connection module
jest.mock('../src/db/connection', () => ({
  db: jest.fn(() => mockBaseQuery),
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// 4. Mock auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

// 5. Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const app = require('../src/server');

describe('Water Quality Stats Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the mock implementation for the base query if needed
    // (createMockQueryBuilder returns fresh state each time clone() is called)
    mockBaseQuery.clone.mockImplementation(() => createMockQueryBuilder());
  });

  it('should return water quality statistics with correct structure', async () => {
    const res = await request(app).get('/api/water-quality/stats');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data).toHaveProperty('total_readings', 100);
    expect(data.risk_level_distribution).toEqual(expect.objectContaining({
      low: 50,
      high: 50,
    }));
    expect(data.parameters_monitored).toEqual(['PH', 'DO']);
    expect(data.states_monitored).toEqual(['Maharashtra', 'Delhi']);
    expect(data.average_quality_score).toBe("85.50");
    expect(data.latest_reading).toBe('2023-01-01T00:00:00Z');
  });

  it('should handle empty datasets safely (runtime crash test)', async () => {
    // Override the mock implementation for this test to return empty results
    mockBaseQuery.clone.mockImplementation(() => {
        const emptyBuilder = {
            select: jest.fn().mockReturnThis(),
            count: jest.fn().mockReturnThis(),
            groupBy: jest.fn().mockReturnThis(),
            distinct: jest.fn().mockReturnThis(),
            pluck: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            whereNotNull: jest.fn().mockReturnThis(),
            avg: jest.fn().mockReturnThis(),
            join: jest.fn().mockReturnThis(),
            where: jest.fn().mockReturnThis(),
            clearSelect: jest.fn().mockReturnThis(),
            then: jest.fn((resolve) => resolve([])), // Always return empty array
            [Symbol.iterator]: function* () {},
        };
        return emptyBuilder;
    });

    const res = await request(app).get('/api/water-quality/stats');

    // If the controller crashes due to unsafe destructuring, this will likely be 500 or timeout
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    // With safe destructuring, count should be 0, not NaN/undefined
    expect(data.total_readings).toBe(0);
    expect(data.latest_reading).toBeNull();
    expect(data.average_quality_score).toBeNull();
  });

  it('should return 500 if one of the queries fails', async () => {
    // Override mock to reject on count query
    mockBaseQuery.clone.mockImplementation(() => {
        const failingBuilder = createMockQueryBuilder();
        failingBuilder.count.mockImplementation(() => {
             // If count is called without groupBy, simulate failure
             failingBuilder.__reject(new Error('DB Connection Failed'));
             return failingBuilder;
        });
        return failingBuilder;
    });

    const res = await request(app).get('/api/water-quality/stats');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('should handle null average quality score correctly', async () => {
      // Override mock to return null for avg query
      mockBaseQuery.clone.mockImplementation(() => {
          const builder = createMockQueryBuilder();
          // Intercept avg call to return null
          const originalAvg = builder.avg;
          builder.avg = jest.fn().mockImplementation((...args) => {
              originalAvg(...args); // record call
              // Override thenable for this instance
              builder.then = jest.fn((resolve) => resolve([{ avg_quality_score: null }]));
              return builder;
          });
          return builder;
      });

      const res = await request(app).get('/api/water-quality/stats');

      expect(res.status).toBe(200);
      expect(res.body.data.average_quality_score).toBeNull();
  });
});
