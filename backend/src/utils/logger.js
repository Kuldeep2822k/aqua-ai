/**
 * Winston Logger Configuration
 * Provides structured logging for the application
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const transports = [];
const isTest = nodeEnv === 'test';
const debugLogs = ['true', '1', 'yes'].includes(
  String(process.env.DEBUG_LOGS || '').toLowerCase()
);
const logsDir = path.join(__dirname, '../../logs');

const isVercel = !!process.env.VERCEL;

if (!isTest && !isVercel && !fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

if (!isTest || debugLogs) {
  transports.push(
    new winston.transports.Console({
      format: nodeEnv === 'development' ? consoleFormat : logFormat,
    })
  );
}

if (!isTest && !isVercel) {
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { service: 'aqua-ai-backend' },
  transports,
  exceptionHandlers:
    isTest || isVercel
      ? []
      : [
          new winston.transports.File({
            filename: path.join(logsDir, 'exceptions.log'),
          }),
        ],
  rejectionHandlers:
    isTest || isVercel
      ? []
      : [
          new winston.transports.File({
            filename: path.join(logsDir, 'rejections.log'),
          }),
        ],
});

module.exports = logger;
