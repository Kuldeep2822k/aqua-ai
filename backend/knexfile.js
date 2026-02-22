// Knex.js Database Configuration for Aqua-AI
require('dotenv').config();

function buildPostgresConnection() {
  // Use individual params when DB_HOST is set (avoids URL parsing issues with Supabase usernames)
  if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
    return {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '6543'),
      database: process.env.DB_NAME || 'postgres',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
    };
  }
  if (process.env.DATABASE_URL) {
    const isRemote =
      process.env.DATABASE_URL.includes('supabase.co') ||
      process.env.DB_SSL === 'true';
    return {
      connectionString: process.env.DATABASE_URL,
      ssl: isRemote ? { rejectUnauthorized: false } : false,
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

module.exports = {
  development: {
    client:
      process.env.USE_SQLITE_DEV === 'true' ? 'better-sqlite3' : 'postgresql',
    connection:
      process.env.USE_SQLITE_DEV === 'true'
        ? { filename: './dev.sqlite3' }
        : buildPostgresConnection(),
    useNullAsDefault: process.env.USE_SQLITE_DEV === 'true',
    pool:
      process.env.USE_SQLITE_DEV === 'true'
        ? {
            afterCreate: (conn, cb) => {
              conn.run('PRAGMA foreign_keys = ON', cb);
            },
          }
        : { min: 1, max: 10 },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  },

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

  production: {
    client: 'postgresql',
    connection: buildPostgresConnection(),
    pool: {
      min: 2,
      max: 20,
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './database/seeds',
    },
  },
};
