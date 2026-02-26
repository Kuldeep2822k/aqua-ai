const request = require('supertest');
const { db } = require('../src/db/connection');

// Mock dependencies
jest.mock('../src/db/connection', () => {
  const mockChain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    join: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    whereILike: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    pluck: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    then: jest
      .fn()
      .mockImplementation((cb) => Promise.resolve(cb ? cb([]) : [])),
  };

  // Implement clone to return a new independent chain if needed,
  // but for simple testing, returning 'this' or a copy is often enough
  // IF we script the responses carefully.
  // However, since we run Promise.all on 4 clones, they need to resolve differently.

  return {
    db: jest.fn(() => mockChain),
    testConnection: jest.fn().mockResolvedValue(true),
    getHealthStatus: jest.fn(),
    closeConnection: jest.fn(),
  };
});

jest.mock('../src/db/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    then: jest.fn((resolve) => resolve({ data: [], count: 0, error: null })),
  },
}));

// Import app after mocks
const app = require('../src/server');

describe('GET /api/water-quality/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Since we haven't implemented the Knex logic yet, this test validates that we CAN mock it
  // and that we can eventually switch the implementation.
  // For now, the endpoint uses Supabase, so we test that behavior if we wanted to regression test.
  // But our goal is to drive the implementation of Knex.

  // So I will write the test assuming the Knex implementation exists,
  // and it will fail (or error) until I implement it.
  // Wait, if I run it against current code, it uses Supabase, so it might pass if I mock Supabase correctly?
  // But I want to verify Knex usage.

  it('should return water quality statistics using Knex', async () => {
    // Setup the mock to return different values for different queries
    // We need a more sophisticated mock for db() to handle clones returning different results

    const mockOverview = {
      total_readings: '100',
      average_score: '75.50',
      latest_date: '2023-10-27T10:00:00Z',
    };
    const mockRisk = [
      { risk_level: 'low', count: '50' },
      { risk_level: 'critical', count: '10' },
    ];
    const mockParams = ['pH', 'DO'];
    const mockStates = ['Maharashtra', 'Gujarat'];

    // We need 'clone' to return a distinct object that we can attach a specific 'then' result to.
    // Or we can assume the order of Promise.all in the implementation:
    // [overview, risk, params, states]

    // Let's create a factory for the mock chain
    const createChain = (name) => {
      return {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        join: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        whereILike: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        count: jest.fn().mockReturnThis(),
        distinct: jest.fn().mockReturnThis(),
        pluck: jest.fn().mockReturnThis(),
        first: jest.fn().mockReturnThis(),
        clone: jest.fn(),
        // We will mock 'then' specifically for each clone
        then: jest.fn(),
        name, // for debugging
      };
    };

    const baseChain = createChain('base');
    const overviewChain = createChain('overview');
    const riskChain = createChain('risk');
    const paramsChain = createChain('params');
    const statesChain = createChain('states');

    // Setup responses
    overviewChain.then.mockImplementation((cb) =>
      Promise.resolve(cb ? cb(mockOverview) : mockOverview)
    );
    riskChain.then.mockImplementation((cb) =>
      Promise.resolve(cb ? cb(mockRisk) : mockRisk)
    );
    paramsChain.then.mockImplementation((cb) =>
      Promise.resolve(cb ? cb(mockParams) : mockParams)
    );
    statesChain.then.mockImplementation((cb) =>
      Promise.resolve(cb ? cb(mockStates) : mockStates)
    );

    // Setup cloning sequence
    // The implementation does: base -> clone(overview), base -> clone(risk), base -> clone(params), base -> clone(states)
    // We can use mockReturnValueOnce
    baseChain.clone
      .mockReturnValueOnce(overviewChain)
      .mockReturnValueOnce(riskChain)
      .mockReturnValueOnce(paramsChain)
      .mockReturnValueOnce(statesChain);

    db.mockReturnValue(baseChain);
    // Also mock db.raw
    db.raw = jest.fn((str) => str);

    const res = await request(app)
      .get('/api/water-quality/stats')
      .query({ state: 'Maharashtra', parameter: 'pH' });

    // If the implementation is NOT updated yet, it uses Supabase.
    // This test expects Knex to be used.
    // So valid verification is:
    // 1. Check if db was called
    // 2. Check response structure

    // Expect success
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Check data
    const data = res.body.data;
    expect(data.total_readings).toBe(100);
    expect(data.average_quality_score).toBe('75.50');
    expect(data.risk_level_distribution.low).toBe(50);
    expect(data.risk_level_distribution.critical).toBe(10);
    expect(data.risk_level_distribution.medium).toBe(0); // default
    expect(data.parameters_monitored).toEqual(
      expect.arrayContaining(['pH', 'DO'])
    );
    expect(data.states_monitored).toEqual(
      expect.arrayContaining(['Maharashtra', 'Gujarat'])
    );

    // Verify Knex usage
    expect(db).toHaveBeenCalledWith('water_quality_readings');
    expect(baseChain.join).toHaveBeenCalledWith(
      'locations',
      'water_quality_readings.location_id',
      'locations.id'
    );
    expect(baseChain.whereILike).toHaveBeenCalledWith(
      'locations.state',
      '%Maharashtra%'
    );
  });
});
