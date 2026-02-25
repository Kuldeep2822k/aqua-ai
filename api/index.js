/**
 * Serverless function entry point for Vercel deployments.
 * 
 * Vercel takes everything inside api/ and builds it as serverless functions.
 * By exporting our Express app here, Vercel's @vercel/node builder natively
 * handles the routing and execution without us needing to bind to a specific port.
 */

const app = require('../backend/src/server');

module.exports = app;
