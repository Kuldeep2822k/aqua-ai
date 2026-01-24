const request = require('supertest');
const express = require('express');
const hpp = require('../src/middleware/hpp');

describe('HPP Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.urlencoded({ extended: true }));
    app.use(hpp);
    app.get('/test', (req, res) => {
      res.json(req.query);
    });
  });

  it('should flatten duplicate query parameters', async () => {
    const res = await request(app)
      .get('/test?param=val1&param=val2')
      .expect(200);

    // Should return the last value
    expect(res.body.param).toBe('val2');
    expect(Array.isArray(res.body.param)).toBe(false);
  });

  it('should handle single query parameter', async () => {
    const res = await request(app)
      .get('/test?param=val1')
      .expect(200);

    expect(res.body.param).toBe('val1');
  });

  it('should handle multiple different parameters', async () => {
    const res = await request(app)
      .get('/test?a=1&b=2')
      .expect(200);

    expect(res.body).toEqual({ a: '1', b: '2' });
  });

  it('should flatten nested duplicates', async () => {
    // ?a=1&a=2&b=3&b=4
    const res = await request(app)
      .get('/test?a=1&a=2&b=3&b=4')
      .expect(200);

    expect(res.body).toEqual({ a: '2', b: '4' });
  });
});
