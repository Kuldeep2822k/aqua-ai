// Knex.js Database Configuration for Aqua-AI
require('dotenv').config();
const path = require('path');

const useSqlite = process.env.DB_CLIENT === 'sqlite3' || !process.env.DB_HOST;

module.exports = {
  development: useSqlite
    ? {
        client: 'sqlite3',
        connection: {
          filename: path.join(__dirname, 'database', 'dev.sqlite3'),
        },
        useNullAsDefault: true,
        migrations: {
          directory: './database/migrations',
          tableName: 'knex_migrations',
        },
        seeds: {
          directory: './database/seeds',
        },
      }
    : {
        client: 'postgresql',
        connection: {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 5432,
          database: process.env.DB_NAME || 'aqua_ai_db',
          user: process.env.DB_USER || 'postgres',
          password: process.env.DB_PASSWORD || 'dev_password_only',
        },
        pool: {
          min: 2,
          max: 10,
        },
        migrations: {
          directory: './database/migrations',
          tableName: 'knex_migrations',
        },
        seeds: {
          directory: './database/seeds',
        },
      },

  test: useSqlite
    ? {
        client: 'sqlite3',
        connection: {
          filename: ':memory:',
        },
        useNullAsDefault: true,
        migrations: {
          directory: './database/migrations',
          tableName: 'knex_migrations',
        },
        seeds: {
          directory: './database/seeds',
        },
      }
    : {
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
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    },
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
