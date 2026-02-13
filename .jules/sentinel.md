# Sentinel's Journal

## 2024-05-23 - Express Rate Limit Proxy Misconfiguration

**Vulnerability:** Rate limiting was configured without `trust proxy` enabled in an Express application deployed behind a load balancer (Render). This caused all requests to appear as coming from the same IP (the load balancer's), leading to shared rate limits for all users (DoS risk) and incorrect logging.
**Learning:** `express-rate-limit` relies on `req.ip`. Express defaults to ignoring `X-Forwarded-For` headers for security, meaning `req.ip` reflects the direct connection (the proxy). Without explicit configuration, the application cannot distinguish end users.
**Prevention:** Always configure `app.set('trust proxy', 1)` (or appropriate depth) in `server.js` for Express applications destined for cloud deployment. Additionally, `express-rate-limit` validates headers and warns about this mismatch, which should be heeded during local testing or staging.

## 2024-05-23 - Hardcoded Secrets & Static Fallbacks

**Vulnerability:** Found hardcoded API keys in `data-pipeline/config.py` and a static fallback string for `JWT_SECRET` in `backend/src/middleware/auth.js`.
**Learning:** The codebase relied on static defaults for convenience in development, which risks leaking into production if env vars are missed.
**Prevention:** Enforce environment variable checks and use dynamic generation for development secrets (e.g., `crypto.randomBytes`) instead of static strings.

## 2026-01-06 - Missing Input Validation & Excessive Body Limits

**Vulnerability:** The alert resolution/dismissal endpoints accepted arbitrary input lengths, and the global JSON body limit was set to 10MB. This created a Denial of Service (DoS) risk where an attacker could fill the database or exhaust memory with large payloads.
**Learning:** Framework defaults (like `express.json` limit) or copied configurations are often too permissive. Validation must be applied to ALL user inputs, even internal-facing "notes" fields.
**Prevention:** Reduce global body parser limits to the minimum required (e.g., 1MB) and apply strict length/type validation on all text fields using middleware like `express-validator`.

## 2026-01-06 - Missing Role-Based Authorization on Critical Endpoints

**Vulnerability:** The `/api/alerts/:id/resolve` and `/api/alerts/:id/dismiss` endpoints only required basic authentication, allowing _any_ registered user to dismiss critical water quality alerts. This constitutes an Authorization Bypass (IDOR/Privilege Escalation) risk, as random users could silence public safety warnings.
**Learning:** Checking `authenticate` (identity) is not enough for sensitive write operations; `authorize` (permissions) is mandatory. Defaulting to open permissions when roles are not fully implemented (or seeded) creates latent vulnerabilities.
**Prevention:** Always default to "deny all" or strict role checks (like `admin`) for write operations on shared system resources (alerts, reports), even if the UI doesn't expose them yet.

## 2026-01-21 - Timing Attack Enumeration on Login

**Vulnerability:** The login endpoint returned "Invalid credentials" significantly faster when the user did not exist (fast DB lookup) compared to when the user existed (slow bcrypt comparison). This timing difference (~100ms) allowed attackers to enumerate valid email addresses.
**Learning:** Even with generic error messages, the _time_ taken to respond acts as a side-channel leaking information. `bcrypt.compare` is intentionally slow, making the difference obvious against a simple DB query.
**Prevention:** Ensure authentication logic executes in constant time regardless of the user's existence. Always perform a hash comparison—using a pre-calculated dummy hash if the user is not found—to align the response timing.

## 2026-01-23 - Express Request Query Mutation & HPP

**Vulnerability:** HTTP Parameter Pollution (HPP) allowed duplicate query parameters to bypass type validation (e.g., `?q=a&q=b`), causing logic errors in search endpoints where strings were expected.
**Learning:** In newer Express versions or specific configurations, `req.query` is often implemented as a getter on the prototype or a non-writable property, causing direct assignments like `req.query = newObject` to fail silently or be ignored.
**Prevention:** Use `Object.defineProperty(req, 'query', { value: ... })` when implementing custom middleware that needs to replace the entire query object. Always implement HPP protection (flattening arrays to single values) before input validation runs.

## 2026-01-25 - Hardcoded Database Password in Data Pipeline

**Vulnerability:** The data pipeline configuration (`data-pipeline/config.py`) included a hardcoded default password (`aqua_ai_password`) for the database connection.
**Learning:** Hardcoded fallbacks for credentials, even if intended for local development, create a risk of accidental exposure or misuse in production if environment variables are misconfigured.
**Prevention:** Remove default values for sensitive credentials in configuration files. Use `os.getenv('VAR')` without a second argument to return `None` (or empty), forcing the application to fail or fallback gracefully (e.g., to SQLite) if the necessary secrets are not provided via the environment.

## 2026-01-30 - Express 5 HPP Middleware Compatibility

**Vulnerability:** Missing HTTP Parameter Pollution (HPP) protection allowed attackers to bypass input validation and filters by supplying duplicate query parameters (e.g., `?status=active&status=resolved`).
**Learning:** Implementing HPP middleware in Express 5 is tricky because `req.query` is a getter, making direct assignment (`req.query = sanitized`) ineffective. This silent failure leaves the app vulnerable even with middleware present.
**Prevention:** Use `Object.defineProperty(req, 'query', { value: sanitized, ... })` to correctly shadow the query property in Express 5 middleware.
