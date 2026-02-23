/**
 * Vercel Serverless Function Entry Point
 *
 * This file is the bridge between Vercel's serverless runtime and the
 * Express backend. Vercel will call this as a function for all /api/* requests.
 *
 * The backend/src/server.js exports the Express `app` without calling
 * app.listen() when VERCEL=1 is set (Vercel sets this automatically).
 */

const path = require('path');

try {
  require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
} catch {}

let app;

const getApp = () => {
  if (app) return app;
  app = require('../backend/src/server');
  return app;
};

module.exports = (req, res) => {
  try {
    return getApp()(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error?.message || 'Server error',
    });
  }
};
