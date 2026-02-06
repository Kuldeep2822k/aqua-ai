/**
 * Database Connection Module
 * Manages PostgreSQL connection using Knex.js
 */

const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('../utils/logger');
const { getRequestId } = require('../utils/requestContext');

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

const queryStartTimes = new Map();
const slowQueryThresholdMs = Number(process.env.DB_SLOW_QUERY_MS || 200);

db.on('query', (queryData) => {
  queryStartTimes.set(queryData.__knexQueryUid, process.hrtime.bigint());
});

db.on('query-response', (_response, queryData) => {
  const startTime = queryStartTimes.get(queryData.__knexQueryUid);
  queryStartTimes.delete(queryData.__knexQueryUid);
  if (!startTime) return;

  const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
  if (durationMs < slowQueryThresholdMs) return;

  logger.warn('Slow DB query', {
    requestId: getRequestId(),
    durationMs: Math.round(durationMs * 100) / 100,
    sql: queryData.sql,
    bindingsCount: Array.isArray(queryData.bindings)
      ? queryData.bindings.length
      : 0,
  });
});

db.on('query-error', (error, queryData) => {
  queryStartTimes.delete(queryData.__knexQueryUid);

  logger.error('DB query error', {
    requestId: getRequestId(),
    message: error?.message,
    sql: queryData?.sql,
    bindingsCount: Array.isArray(queryData?.bindings)
      ? queryData.bindings.length
      : 0,
  });
});

/**
 * Test database connection
 */
async function testConnection() {
  try {
    await db.raw('SELECT 1+1 AS result');
    logger.info('✅ Database connection established successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed', { message: error.message });
    return false;
  }
}

/**
 * Get database health status
 */
async function getHealthStatus() {
  try {
    const result = await db.raw(
      'SELECT NOW() as current_time, version() as pg_version'
    );
    return {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].pg_version,
      pool: {
        min: config.pool?.min || 2,
        max: config.pool?.max || 10,
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
