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

## 2026-01-28 - Express 5 Query Parameter Immutability

**Vulnerability:** While implementing HTTP Parameter Pollution (HPP) protection, direct assignment to `req.query` was ignored because Express 5 exposes it as a getter/setter property, unlike Express 4. This could lead to security middleware failing silently if it attempts to sanitize `req.query` by reassignment.
**Learning:** Framework upgrades can introduce subtle breaking changes in core object behavior. In Express 5, `req.query` delegates to the query parser and direct assignment might not work as expected depending on the parser configuration or property descriptors.
**Prevention:** Use `Object.defineProperty(req, 'query', { value: sanitizedQuery, ... })` when needing to completely replace or sanitize the query object in middleware to ensure the change persists and is respected by downstream handlers.
