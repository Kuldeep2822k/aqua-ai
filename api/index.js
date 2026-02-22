/**
 * Vercel Serverless Function Entry Point
 *
 * This file is the bridge between Vercel's serverless runtime and the
 * Express backend. Vercel will call this as a function for all /api/* requests.
 *
 * The backend/src/server.js exports the Express `app` without calling
 * app.listen() when VERCEL=1 is set (Vercel sets this automatically).
 */

// Load backend env vars from backend/.env when running locally via `vercel dev`
// In production, vars come from the Vercel Dashboard - this is a no-op.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

// Import the Express app (does NOT call app.listen on Vercel)
const app = require('../backend/src/server');

module.exports = app;
