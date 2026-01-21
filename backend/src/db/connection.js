/**
 * Database Connection Module
 * Manages PostgreSQL connection using Knex.js
 */

const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

// Validate configuration exists
if (!config) {
  throw new Error(
    `No database configuration found for environment: ${environment}`
  );
}

// Initialize Knex instance
const db = knex(config);

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await db.raw('SELECT 1+1 AS result');
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Get database health status
 */
async function getHealthStatus() {
  try {
    const isSqlite = config.client === 'sqlite3';
    const query = isSqlite 
      ? "SELECT datetime('now') as current_time, 'sqlite' as pg_version"
      : 'SELECT NOW() as current_time, version() as pg_version';
    
    const result = await db.raw(query);
    const rows = isSqlite ? result : result.rows;
    
    return {
      status: 'healthy',
      timestamp: rows[0].current_time,
      version: rows[0].pg_version,
      pool: {
        min: config.pool?.min || (isSqlite ? 1 : 2),
        max: config.pool?.max || (isSqlite ? 1 : 10),
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Gracefully close database connection
 */
async function closeConnection() {
  try {
    await db.destroy();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error.message);
  }
}

module.exports = {
  db,
  testConnection,
  getHealthStatus,
  closeConnection,
};
