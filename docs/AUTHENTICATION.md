# 🔐 Authentication & Security

## New Features Added

### JWT Authentication System
- ✅ User registration with email/password
- ✅ Secure login with JWT tokens
- ✅ Password hashing using bcrypt (10 salt rounds)
- ✅ Protected API endpoints
- ✅ Role-based access control (user, admin, moderator)

### API Endpoints

#### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user profile (protected)
- `PUT /api/auth/me` - Update user profile (protected)

#### Protected Endpoints
- `PUT /api/alerts/:id/resolve` - Resolve alert (requires authentication)
- `PUT /api/alerts/:id/dismiss` - Dismiss alert (requires authentication)

### Security Features
- 🔒 **JWT Authentication** - Secure token-based auth
- 🔐 **Password Hashing** - Bcrypt with 10 salt rounds
- ✅ **Input Validation** - express-validator on all endpoints
- 🛡️ **SQL Injection Protection** - Knex parameterized queries
- 🚫 **CORS Protection** - Restricted to FRONTEND_URL
- ⏱️ **Rate Limiting** - 100 requests per 15 minutes per IP
- 🔒 **Helmet Security Headers** - XSS, clickjacking protection
- 📝 **Structured Logging** - Winston logger with file rotation

### Environment Variables Required

```env
# Authentication
JWT_SECRET=your_very_secure_random_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/aqua_ai_db

# Logging
LOG_LEVEL=info
```

### Usage Example

#### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "name": "John Doe"
  }'
```

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

#### Access Protected Endpoint
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Database Integration

All routes now use **PostgreSQL** with **Knex.js**:
- ✅ Water quality routes - Real database queries
- ✅ Locations routes - PostGIS spatial queries
- ✅ Predictions routes - AI predictions from database
- ✅ Alerts routes - Real-time alert management
- ✅ Users table - Authentication and user management

### Migration Required

Before running the application, you must run database migrations:

```bash
npm run db:migrate
```

This will create the `users` table and other required schema.

---

For detailed implementation, see:
- [Walkthrough](file:///C:/Users/kulde/.gemini/antigravity/brain/88492692-ab33-49e9-8e05-60c4a7285532/walkthrough.md)
- [Error Report](file:///C:/Users/kulde/.gemini/antigravity/brain/88492692-ab33-49e9-8e05-60c4a7285532/error_report.md)
