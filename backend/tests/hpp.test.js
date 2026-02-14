const request = require('supertest');

const mockWhere = jest.fn().mockReturnThis();
const mockDb = jest.fn(() => ({
  join: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  where: mockWhere,
  clone: jest.fn().mockReturnThis(),
  clearSelect: jest.fn().mockReturnThis(),
  count: jest.fn().mockResolvedValue([{ count: 0 }]),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  avg: jest.fn().mockResolvedValue([{ avg_score: 80 }]),
  distinct: jest.fn().mockReturnThis(),
  pluck: jest.fn().mockResolvedValue([]),
  first: jest.fn().mockResolvedValue({}),
}));

jest.mock('../src/db/connection', () => ({
  db: mockDb,
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
  generateToken: () => 'mock-token',
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

const app = require('../src/server');

describe('Security: HTTP Parameter Pollution', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use last value when duplicate parameters are provided', async () => {
    const res = await request(app).get(
      '/api/water-quality?risk_level=low&risk_level=high'
    );

    expect(res.status).toBe(200);

    const riskLevelCalls = mockWhere.mock.calls.filter(
      (call) => call[0] === 'wqr.risk_level'
    );

    expect(riskLevelCalls.length).toBeGreaterThan(0);
    expect(riskLevelCalls[0][1]).toBe('high');
  });

  it('should handle single parameter correctly', async () => {
    const res = await request(app).get('/api/water-quality?risk_level=medium');

    expect(res.status).toBe(200);

    const riskLevelCalls = mockWhere.mock.calls.filter(
      (call) => call[0] === 'wqr.risk_level'
    );

    expect(riskLevelCalls.length).toBeGreaterThan(0);
    expect(riskLevelCalls[0][1]).toBe('medium');
  });

  it('should prevent filter bypass by selecting the last value when state is polluted', async () => {
    await request(app)
      .get('/api/water-quality?state=California&state=Texas')
      .expect(200);

    const stateCalls = mockWhere.mock.calls.filter(
      (args) => args[0] === 'l.state'
    );

    expect(stateCalls.length).toBeGreaterThan(0);
    const lastCall = stateCalls[stateCalls.length - 1];
    expect(lastCall[2]).toBe('%Texas%');
  });

  it('should prevent array injection in location_id by taking last value', async () => {
    await request(app)
      .get('/api/water-quality?location_id=1&location_id=2')
      .expect(200);

    const locationCalls = mockWhere.mock.calls.filter(
      (args) => args[0] === 'wqr.location_id'
    );
    expect(locationCalls.length).toBeGreaterThan(0);
    expect(Array.isArray(locationCalls[0][1])).toBe(false);
    expect(String(locationCalls[0][1])).toBe('2');
  });
});
