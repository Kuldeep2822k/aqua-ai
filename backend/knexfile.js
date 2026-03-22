// Knex.js Database Configuration for Aqua-AI
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.development') });
require('dotenv').config(); // Fallback to standard .env

/**
 * Builds a PostgreSQL connection configuration object based on environment variables.
 *
 * Chooses one of three connection shapes:
 * - If DB_HOST is set and not "localhost": returns host/port/database/user/password fields (port defaults to 6543, database defaults to "postgres", user defaults to "postgres") with `ssl: { rejectUnauthorized: false }`.
 * - Else if DATABASE_URL is set: returns `{ connectionString: DATABASE_URL }` and sets `ssl` to `{ rejectUnauthorized: false }` when the URL targets Supabase (contains "supabase.co") or DB_SSL === "true", otherwise `ssl: false`.
 * - Otherwise: returns localhost defaults (`host: "localhost"`, `port: 5432`, database defaults to "aqua_ai_db", user defaults to "postgres", password defaults to "aqua_ai_password" ) with `ssl: false`.
 *
 * @returns {Object} A Knex-compatible PostgreSQL connection configuration object (either host/port/database/user/password/ssl or connectionString/ssl).
 */
function buildPostgresConnection() {
  const sslConfig = {
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };

  // Use individual params when DB_HOST is set (avoids URL parsing issues with Supabase usernames)
  if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '6543'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: sslConfig,
    };
  }

  if (process.env.DATABASE_URL) {
    const isRemote =
      process.env.DATABASE_URL.includes('supabase.co') ||
      process.env.DB_SSL === 'true' ||
      !process.env.DATABASE_URL.includes('localhost');

    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemote ? sslConfig : false,
    };
  }

  return {
    host: 'localhost',
    port: 5432,
    database: process.env.DB_NAME || 'aqua_ai_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'aqua_ai_password',
    ssl: false,
  };
}

/**
 * Common pooling and connection configuration for PostgreSQL.
 */
function buildPostgresConfig(env) {
  // statement_timeout in milliseconds. Default to 30s if not provided.
  const statementTimeout = parseInt(process.env.DB_STATEMENT_TIMEOUT_MS || '30000');
  
  return {
    client: 'postgresql',
    connection: buildPostgresConnection(),
    // Time to wait for a connection from the pool before timing out (ms)
    acquireConnectionTimeout: 60000,
    pool: {
      min: env === 'production' ? 2 : 1,
      max: env === 'production' ? 20 : 10,
      // After a connection is created, set the PostgreSQL session statement timeout
      afterCreate: (conn, done) => {
        conn.query(`SET statement_timeout = ${statementTimeout}`, (err) => {
          if (err) {
            done(err, conn);
          } else {
            done(null, conn);
          }
        });
      },
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  };
}

module.exports = {
  development: process.env.USE_SQLITE_DEV === 'true' ? {
    client: 'better-sqlite3',
    connection: { filename: './dev.sqlite3' },
    useNullAsDefault: true,
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma('foreign_keys = ON');
        cb();
      },
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  } : buildPostgresConfig('development'),

  test: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: 'aqua_ai_test_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'aqua_ai_password',
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  },

  production: buildPostgresConfig('production'),
};
