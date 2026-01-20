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
