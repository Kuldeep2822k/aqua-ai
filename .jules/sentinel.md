# Sentinel's Journal

## 2024-05-23 - Express Rate Limit Proxy Misconfiguration
**Vulnerability:** Rate limiting was configured without `trust proxy` enabled in an Express application deployed behind a load balancer (Render). This caused all requests to appear as coming from the same IP (the load balancer's), leading to shared rate limits for all users (DoS risk) and incorrect logging.
**Learning:** `express-rate-limit` relies on `req.ip`. Express defaults to ignoring `X-Forwarded-For` headers for security, meaning `req.ip` reflects the direct connection (the proxy). Without explicit configuration, the application cannot distinguish end users.
**Prevention:** Always configure `app.set('trust proxy', 1)` (or appropriate depth) in `server.js` for Express applications destined for cloud deployment. Additionally, `express-rate-limit` validates headers and warns about this mismatch, which should be heeded during local testing or staging.

## 2024-05-23 - Hardcoded Secrets & Static Fallbacks
**Vulnerability:** Found hardcoded API keys in `data-pipeline/config.py` and a static fallback string for `JWT_SECRET` in `backend/src/middleware/auth.js`.
**Learning:** The codebase relied on static defaults for convenience in development, which risks leaking into production if env vars are missed.
**Prevention:** Enforce environment variable checks and use dynamic generation for development secrets (e.g., `crypto.randomBytes`) instead of static strings.
