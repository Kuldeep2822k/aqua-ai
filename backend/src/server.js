const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const { randomUUID } = require('crypto');
const qs = require('qs');

const logger = require('./utils/logger');
const { runWithRequestId } = require('./utils/requestContext');
const {
  testConnection,
  closeConnection,
  getHealthStatus,
} = require('./db/connection');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the first proxy (Render/Load Balancer)
// This ensures req.ip is correct for rate limiting and logging
app.set('trust proxy', 1);
app.set('query parser', (str) =>
  qs.parse(str, {
    allowDots: true,
    depth: 5,
    arrayLimit: 20,
    duplicates: 'last',
  })
);

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    logger.warn(
      `Missing required environment variables: ${missingVars.join(', ')}. This may cause issues.`
    );
    // We do not exit here to allow debugging on deployment platforms if vars are missed.
    // Instead we log a warning. The app might crash later if it needs them, but logs will be visible.
  }
}

// Security middleware
app.use(helmet());

// CORS configuration with multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.ip === '127.0.0.1' || req.ip === '::1';
  },
});
app.use('/api/', limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Force HTTPS in production (only for external requests, not internal Docker communication)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    // Skip HTTPS redirect for:
    // 1. Already secure requests
    // 2. Health check endpoint (used by Docker/load balancers)
    // 3. Requests from localhost/internal Docker network
    // 4. When X-Forwarded-Proto is not set (internal requests)
    const proto = req.get('X-Forwarded-Proto');
    const isHealthCheck = req.path === '/api/health';
    const isInternal =
      !req.get('host')?.includes('.') ||
      req.ip?.startsWith('172.') ||
      req.ip === '127.0.0.1';

    if (req.secure || isHealthCheck || isInternal || !proto) {
      return next();
    }

    if (proto !== 'https') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    next();
  });
}

// Request timeout middleware
app.use((req, res, next) => {
  req.setTimeout(30000, () => {
    // 30 second timeout
    logger.warn(`Request timeout: ${req.method} ${req.url}`);
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        error: 'Request timeout',
      });
    }
  });
  next();
});

// General middleware
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, _res, next) => {
  const flatten = (value) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? flatten(value[value.length - 1]) : undefined;
    }
    if (value && typeof value === 'object') {
      const output = {};
      for (const [key, nestedValue] of Object.entries(value)) {
        output[key] = flatten(nestedValue);
      }
      return output;
    }
    return value;
  };
  if (req.query && typeof req.query === 'object') {
    req.query = flatten(req.query);
  }
  next();
});

app.use((req, res, next) => {
  const requestId =
    req.get('x-request-id') || req.get('x-correlation-id') || randomUUID();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  runWithRequestId(requestId, next);
});

app.use((req, _res, next) => {
  const arrayPaths = [];
  const collectArrayPaths = (value, path) => {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      arrayPaths.push(path);
      return;
    }
    for (const [key, nestedValue] of Object.entries(value)) {
      collectArrayPaths(nestedValue, path ? `${path}.${key}` : key);
    }
  };
  collectArrayPaths(req.query, 'query');
  collectArrayPaths(req.body, 'body');
  if (arrayPaths.length > 0) {
    logger.warn('Request contains array values', {
      requestId: req.requestId,
      paths: arrayPaths,
      url: req.originalUrl,
      method: req.method,
    });
  }
  next();
});

app.use((req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startTime) / 1e6;
    logger.info(`${req.method} ${req.path}`, {
      requestId: req.requestId,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?.id,
    });
  });

  next();
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const dbHealth = await getHealthStatus();

  res.json({
    status: 'OK',
    message: 'Aqua-AI API is running',
    timestamp: new Date().toISOString(),
    database: dbHealth,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/water-quality', require('./routes/waterQuality'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/alerts', require('./routes/alerts'));

// 404 handler
app.use(notFound);

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn('⚠️  Starting server without database connection');
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Aqua-AI Backend server is running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeConnection();
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT signal received: closing HTTP server');
      server.close(async () => {
        logger.info('HTTP server closed');
        await closeConnection();
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
