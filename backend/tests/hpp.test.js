const request = require('supertest');
const express = require('express');
const hpp = require('../src/middleware/hpp');

describe('HTTP Parameter Pollution (HPP) Protection Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(hpp);
    app.get('/test', (req, res) => {
      res.json({ query: req.query });
    });
  });

  it('should take the last value when duplicate query parameters are provided', async () => {
    const res = await request(app).get('/test?param=first&param=second');

    expect(res.status).toBe(200);
    expect(res.body.query.param).toBe('second');
    expect(Array.isArray(res.body.query.param)).toBe(false);
  });

  it('should handle single values correctly', async () => {
    const res = await request(app).get('/test?param=single');

    expect(res.status).toBe(200);
    expect(res.body.query.param).toBe('single');
  });

  it('should handle multiple different parameters', async () => {
    const res = await request(app).get('/test?a=1&b=2&a=3');

    expect(res.body.query.a).toBe('3');
    expect(res.body.query.b).toBe('2');
  });

  it('should handle mixed array and non-array parameters', async () => {
    const res = await request(app).get('/test?arr=1&arr=2&single=3');

    expect(res.body.query.arr).toBe('2');
    expect(res.body.query.single).toBe('3');
  });

  it('should handle no query parameters', async () => {
    const res = await request(app).get('/test');

    expect(res.status).toBe(200);
    expect(res.body.query).toEqual({});
  });
});
