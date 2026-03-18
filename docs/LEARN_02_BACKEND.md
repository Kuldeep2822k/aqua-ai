# 📘 Learn Aqua-AI — Part 2: Backend Deep Dive

## How the Backend is Structured

The backend is a **Node.js + Express.js REST API**. Everything starts from `backend/src/server.js`.

---

## server.js — The Entry Point

This file sets up the entire Express application. Here's what happens in order:

### Step 1: Import Dependencies
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
```
These are standard Node.js packages:
- **express** — The web framework
- **cors** — Allows the frontend (running on port 5173) to call the backend (running on port 5000)
- **helmet** — Adds security HTTP headers automatically
- **compression** — Compresses responses to make them smaller/faster
- **rateLimit** — Prevents abuse by limiting requests per IP

### Step 2: Create the Express App
```javascript
const app = express();
const PORT = process.env.PORT || 5000;
```
`process.env.PORT` reads from environment variables. If not set, defaults to 5000.

### Step 3: Security Middleware (runs on EVERY request)
```javascript
app.use(helmet());          // Add security headers
app.use(hppProtection);     // Prevent HTTP Parameter Pollution
app.use(cors({...}));       // Allow cross-origin requests
app.use(limiter);           // Rate limit: 100 requests per 15 min
```

### Step 4: Request Processing Middleware
```javascript
app.use(compression());                          // Gzip compress responses
app.use(express.json({ limit: '1mb' }));         // Parse JSON request bodies
app.use(express.urlencoded({ extended: true }));  // Parse URL-encoded forms
```

### Step 5: Custom Middleware
The server adds several custom middleware functions:
1. **Prototype Pollution Protection** — Blocks `__proto__`, `prototype`, `constructor` keys from being injected
2. **Request ID Tracking** — Each request gets a unique UUID for tracing in logs
3. **Array Detection** — Logs a warning when array values appear in query strings (potential HPP attack)
4. **Request Logging** — Logs every request with method, path, status code, duration, and user info

### Step 6: Mount Routes
```javascript
app.use('/api/auth', require('./routes/auth'));
app.use('/api/water-quality', require('./routes/waterQuality'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/alerts', require('./routes/alerts'));
```
Each route module handles a group of related endpoints.

### Step 7: Error Handling
```javascript
app.use(notFound);     // Catch 404 errors
app.use(errorHandler); // Catch all other errors
```
These MUST be the last middleware — they act as a catch-all.

---

## API Routes Explained

### 1. Authentication Routes (`/api/auth`)

| Method | Endpoint | Purpose | Auth Required? |
|--------|----------|---------|---------------|
| POST | `/api/auth/register` | Create a new user account | No |
| POST | `/api/auth/login` | Log in and receive a JWT token | No |
| GET | `/api/auth/me` | Get current user's profile | Yes (JWT) |
| PUT | `/api/auth/me` | Update current user's profile | Yes (JWT) |

**Registration Flow:**
```
1. User sends: { email, password, name }
2. Server checks if email already exists → 400 error if yes
3. Password is hashed with bcrypt (salt rounds = 10)
4. User record is inserted into the 'users' table
5. JWT token is generated with { id, email, role }
6. Token is returned to the frontend
```

**Login Flow:**
```
1. User sends: { email, password }
2. Server looks up user by email
3. IMPORTANT: Even if user doesn't exist, server still runs bcrypt.compare()
   against a dummy hash (timing attack prevention!)
4. If credentials match → generate JWT token
5. Return token to frontend
```

🔐 **Security Feature — Timing Attack Prevention:**
If the server returned "user not found" immediately (without comparing passwords), an attacker could measure response time to determine which emails exist. By always running `bcrypt.compare()`, the response time is constant.

### 2. Water Quality Routes (`/api/water-quality`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/water-quality` | Get all readings with filtering |
| GET | `/api/water-quality/stats` | Get aggregate statistics |
| GET | `/api/water-quality/parameters` | Get list of monitored parameters |
| GET | `/api/water-quality/location/:id` | Get readings for a specific location |
| GET | `/api/water-quality/:id` | Get a single reading by ID |

**Key Query Parameters for `/api/water-quality`:**
- `location_id` — Filter by specific location
- `parameter` — Filter by parameter code (BOD, TDS, pH, etc.)
- `state` — Filter by Indian state
- `risk_level` — Filter by risk level (low/medium/high/critical)
- `start_date` / `end_date` — Date range filter
- `limit` / `offset` — Pagination

**Example API Call:**
```
GET /api/water-quality?state=Delhi&parameter=BOD&risk_level=high&limit=10
```
This returns the 10 most recent BOD readings from Delhi that are high risk.

### 3. Locations Routes (`/api/locations`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/locations` | Get all monitoring stations |
| GET | `/api/locations/geojson` | Get locations as GeoJSON (for maps) |
| GET | `/api/locations/stats` | Get location statistics |
| GET | `/api/locations/:id` | Get a specific location |

**GeoJSON** is a standard format for geographic data. It looks like:
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [77.1, 28.6] },
      "properties": { "name": "Yamuna at Delhi", "state": "Delhi" }
    }
  ]
}
```
Map libraries like Leaflet can directly render GeoJSON on a map.

### 4. Alerts Routes (`/api/alerts`)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/alerts` | Get all alerts with filtering |
| GET | `/api/alerts/active` | Get only active (unresolved) alerts |
| GET | `/api/alerts/stats` | Get alert statistics |

---

## Middleware Deep Dive

### Authentication Middleware (`middleware/auth.js`)

This file exports 4 functions:

**`authenticate`** — Required auth (used on protected routes)
```javascript
// 1. Extract token from "Authorization: Bearer <token>" header
// 2. jwt.verify() decodes the token using JWT_SECRET
// 3. Attach decoded user info (id, email, role) to req.user
// 4. If token is invalid/expired → throw appropriate error
```

**`optionalAuth`** — Optional auth (used when auth adds features but isn't required)
```javascript
// Same as authenticate, but doesn't fail if no token present
// If token exists but is invalid → just skip, don't error
```

**`authorize(...roles)`** — Role-based access control
```javascript
// Usage: authorize('admin', 'moderator')
// Checks if req.user.role is in the allowed roles list
```

**`generateToken(user)`** — Creates a JWT
```javascript
// Encodes { id, email, role } with JWT_SECRET
// Token expires in 7 days (JWT_EXPIRES_IN env var)
```

### Validation Middleware (`middleware/validation.js`)

Uses `express-validator` to validate incoming request data:
```javascript
// Example: Validate pagination parameters
validationRules.pagination = [
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 })
];
```
If validation fails, the middleware returns a 400 error with details about what's wrong.

### Error Handler Middleware (`middleware/errorHandler.js`)

Two key exports:
- **`asyncHandler(fn)`** — Wraps async route handlers so thrown errors are automatically caught
- **`errorHandler(err, req, res, next)`** — Central error handler that formats all errors consistently

```javascript
// Every error response looks like:
{
  success: false,
  error: "Error message here",
  details: [...] // optional validation errors
}
```

---

## The User Model (`models/User.js`)

A static class that handles all user-related database operations:

```javascript
class User {
  static async create({ email, password, name, role })  // Create new user
  static async findByEmail(email)                        // Look up user by email
  static async findById(id)                              // Look up user by ID
  static async verifyPassword(plain, hashed)             // Compare passwords
  static async update(id, updates)                       // Update user fields
  static async delete(id)                                // Delete a user
  static async findAll({ limit, offset })                // List all users (admin)
}
```

**Password Security:**
- Uses `bcryptjs` with **salt rounds = 10**
- `bcrypt.genSalt(10)` generates a random salt
- `bcrypt.hash(password, salt)` creates the hash
- `bcrypt.compare(plain, hash)` verifies login
- The plain-text password is **NEVER** stored in the database

---

## Database Queries — Two Approaches

The backend uses TWO different database clients:

### 1. Supabase Client (for relational joins)
```javascript
const { supabase } = require('../db/supabase');

// Fetch water quality readings with joined location and parameter data
const { data, error } = await supabase
  .from('water_quality_readings')
  .select(`
    id, value, measurement_date,
    locations!inner (id, name, state),
    water_quality_parameters!inner (parameter_name, unit)
  `)
  .eq('risk_level', 'high')
  .order('measurement_date', { ascending: false })
  .range(0, 99);
```
The `!inner` syntax means "INNER JOIN" — only return readings that have matching locations AND parameters.

### 2. Knex.js (for complex aggregations)
```javascript
const { db } = require('../db/connection');

// Aggregate statistics using Knex query builder
const result = await db('water_quality_readings as wqr')
  .join('locations as l', 'wqr.location_id', 'l.id')
  .join('water_quality_parameters as wqp', 'wqr.parameter_id', 'wqp.id')
  .where('l.state', 'ilike', '%Delhi%')
  .count('* as total')
  .first();
```
Knex generates SQL under the hood. The `.join()`, `.where()`, `.count()` etc. all build up a SQL query.

**Why use both?** Supabase is great for simple CRUD with joins. Knex is better for complex aggregations (COUNT, AVG, GROUP BY) because Supabase's client doesn't support those as well.

---

## Environment Variables

These configure the backend (stored in `.env.development`):

| Variable | Purpose | Example |
|----------|---------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` / `production` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJ...` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Random string |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:5173` |

---

## Next Steps

Continue to:
- **Part 3**: [Frontend Deep Dive](./LEARN_03_FRONTEND.md) — How the React UI works
- **Part 4**: [Database & Schema](./LEARN_04_DATABASE.md) — PostgreSQL tables and triggers
