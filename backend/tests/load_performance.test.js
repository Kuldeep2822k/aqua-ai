const autocannon = require('autocannon');
const http = require('http');

// Mock Rate Limit to avoid 429s during load test
jest.mock('express-rate-limit', () => {
  return jest.fn(() => (req, res, next) => next());
});

// Mock Database *before* importing app
jest.mock('../src/db/connection', () => ({
  db: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue({ id: 1, role: 'user' }), // Mock user
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue([{ count: 100 }]),
  })),
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

const app = require('../src/server');

describe('Performance Load Test', () => {
  let server;
  let port;

  beforeAll((done) => {
    server = http.createServer(app);
    server.listen(0, () => {
      port = server.address().port;
      done();
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should handle high load with low latency (mocked DB)', async () => {
    const result = await autocannon({
      url: `http://localhost:${port}/api/health`,
      connections: 10, // Concurrent connections
      duration: 2, // Seconds
      pipelining: 1,
    });

    // Check results
    if (result.non2xx > 0) {
      console.error('Load Test Errors:', result.non2xx);
    }
    expect(result.non2xx).toBe(0);

    // We expect reasonable throughput
    expect(result.requests.mean).toBeGreaterThan(50);

    // Latency check
    expect(result.latency.mean).toBeLessThan(100);
  });
});
