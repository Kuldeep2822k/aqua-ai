const request = require('supertest');

// Mock database connection
jest.mock('../src/db/connection', () => ({
  db: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockResolvedValue(null), // User not found
    select: jest.fn().mockReturnThis(),
    count: jest.fn().mockResolvedValue([{ count: 0 }]),
  })),
  testConnection: jest.fn().mockResolvedValue(true),
  getHealthStatus: jest.fn().mockResolvedValue({ status: 'healthy' }),
  closeConnection: jest.fn().mockResolvedValue(),
}));

// Mock logger to suppress noise
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  log: jest.fn(),
}));

// Import app
// Note: This starts the server on port 5000.
// In a real CI environment this might clash, but for this task it should be fine.
// We suppress console output to avoid noise.
const app = require('../src/server');

describe('Security: Proxy Trust & Rate Limiting', () => {

  // Clean up server if possible?
  // We can't easily access the server instance returned by app.listen in server.js
  // But we can just run the test.

  it('should distinguish users behind a proxy (requires trust proxy)', async () => {
    // The auth rate limit is 5 requests per 15 mins.

    // 1. Consume the limit for IP "10.0.0.1"
    const ipA = '10.0.0.1';
    for (let i = 0; i < 5; i++) {
        await request(app)
            .post('/api/auth/login')
            .set('X-Forwarded-For', ipA)
            .send({ email: 'test@example.com', password: 'Password123!' });
    }

    // 2. Verify IP A is now blocked
    const resA = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', ipA)
        .send({ email: 'test@example.com', password: 'Password123!' });

    // If this fails, it means rate limiting isn't working at all, or limit > 5
    expect(resA.status).toBe(429);

    // 3. Try from a different IP "10.0.0.2"
    const ipB = '10.0.0.2';
    const resB = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', ipB)
        .send({ email: 'other@example.com', password: 'Password123!' });

    // If 'trust proxy' is NOT set, this request will appear to come from the same local IP
    // as the previous ones (since supertest sends from local), and thus will also be blocked.
    // If 'trust proxy' IS set, this request will be seen as 10.0.0.2 and should be allowed (401/400).

    // We expect this to FAIL (be 429) before the fix, and PASS (not be 429) after the fix.
    // Since I'm writing the test to verify the FIX, I expect !429.
    expect(resB.status).not.toBe(429);
  });
});
