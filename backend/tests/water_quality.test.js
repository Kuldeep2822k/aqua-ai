const request = require('supertest');

// Mock database connection inline to avoid hoisting issues
jest.mock('../src/db/connection', () => {
  const mockChain = {
    join: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    clearSelect: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue([{ count: 1 }]),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockResolvedValue([
      {
        id: 1,
        location_name: 'Ganges',
        value: 7.5,
        parameter: 'pH',
        risk_level: 'low',
      },
    ]),
  };

  return {
    db: jest.fn(() => mockChain),
    testConnection: jest.fn().mockResolvedValue(true),
    getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
    closeConnection: jest.fn().mockResolvedValue(),
  };
});

// Mock logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

// Mock auth middleware
jest.mock('../src/middleware/auth', () => ({
  authenticate: (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
  authorize: () => (req, res, next) => next(),
}));

const app = require('../src/server');

describe('Water Quality Routes', () => {
  it('should return 200 and filtered data for valid request', async () => {
    const res = await request(app)
      .get('/api/water-quality')
      .query({ limit: 10, state: 'UP' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toHaveProperty('location_name', 'Ganges');
  });

  it('should return 400 for invalid parameter format', async () => {
    const res = await request(app)
      .get('/api/water-quality')
      .query({ limit: 'invalid' }); // limit should be integer

    expect(res.status).toBe(400);
  });
});
