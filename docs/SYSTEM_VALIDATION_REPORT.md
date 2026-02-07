# System Validation Report (API ↔ DB ↔ Ingestion ↔ UI)

Date: 2026-02-06  
Validation method: Local Postgres (Docker) + backend (Node) + endpoint/DB probes

## Scope

- Verify backend API is called correctly (no mocked responses).
- Confirm UI uses API responses (no hardcoded domain datasets).
- Validate database configuration and connectivity.
- Validate upstream ingestion → Postgres storage → API retrieval integrity.
- Implement logging/tracing to track data from ingestion and API requests.

## Results Summary

| Area | Status | Evidence |
|---|---:|---|
| Backend health + DB connectivity | PASS | `/api/health` shows Postgres version and pool info |
| API endpoints query Postgres | PASS | `/api/locations`, `/api/water-quality`, `/api/alerts` return live rows |
| UI uses API data (no mock datasets) | PASS | Removed hardcoded data from Map/Alerts/Analytics/Dashboard widgets |
| Ingestion writes into Postgres | PASS (demo) | Pipeline inserted 7,376 readings into Postgres and API returned them |
| End-to-end request tracing | PASS | Backend returns `X-Request-Id`; pipeline logs `run_id` + updates `data_sources` |

## A) Backend API Validation

### A1. Health + DB

```bash
curl -s http://localhost:5000/api/health
```

Expected/observed:

- `database.status: healthy`
- `database.version: PostgreSQL ...`

Related code:

- Health handler: [server.js](file:///c:/Users/kulde/aqua-ai/backend/src/server.js#L160-L171)
- DB health query: [connection.js](file:///c:/Users/kulde/aqua-ai/backend/src/db/connection.js#L40-L73)

### A2. Core Endpoint Spot Checks

```bash
curl -s "http://localhost:5000/api/locations?limit=3"
curl -s "http://localhost:5000/api/locations/geojson?limit=3"
curl -s "http://localhost:5000/api/water-quality?limit=3"
curl -s "http://localhost:5000/api/water-quality/parameters"
curl -s "http://localhost:5000/api/alerts?limit=3"
curl -s "http://localhost:5000/api/alerts/active?limit=3"
curl -s "http://localhost:5000/api/alerts/stats"
```

Observed highlights:

- `/api/water-quality` now returns joined fields (`location_id`, `parameter_code`, `risk_level`) from Postgres schema: [waterQuality.js](file:///c:/Users/kulde/aqua-ai/backend/src/routes/waterQuality.js)
- `/api/locations` now includes `water_body_type`, `water_body_name`, `population_affected`: [locations.js](file:///c:/Users/kulde/aqua-ai/backend/src/routes/locations.js)
- `/api/locations/geojson` returns fixed marker coordinates from DB lat/lng (no pixel projection drift): [locations.js](file:///c:/Users/kulde/aqua-ai/backend/src/routes/locations.js)

## B) Database Connectivity & Configuration

### B1. Single Source of Truth (No Double-Initialization)

Discrepancy found:

- Docker Compose previously initialized Postgres from `schema.sql` while the backend also ran Knex migrations, causing conflicts.

Fix applied:

- Removed the DB init volume mount and made backend run migrations on startup.

Related file:

- [docker-compose.yml](file:///c:/Users/kulde/aqua-ai/docker-compose.yml)

### B2. Migration Compatibility

Discrepancy found:

- A migration used `CREATE VIEW IF NOT EXISTS` (not supported by Postgres 14) and used a SQLite-style schema.

Fix applied:

- Updated the view migration for Postgres compatibility and added a migration to correct the `location_summary` aggregation logic.

Related files:

- [20260203000000_create_location_summary_view.js](file:///c:/Users/kulde/aqua-ai/backend/database/migrations/20260203000000_create_location_summary_view.js)
- [20260206000000_fix_location_summary_view.js](file:///c:/Users/kulde/aqua-ai/backend/database/migrations/20260206000000_fix_location_summary_view.js)
- [schema.sql](file:///c:/Users/kulde/aqua-ai/backend/database/schema.sql)

### B3. Seed Alignment

Discrepancy found:

- Seed file targeted a legacy schema (`water_quality_readings.location_name`, `parameter`, etc.).

Fix applied:

- Seed now supports Postgres schema (`location_id`, `parameter_id`, `data_source_type`) while keeping SQLite behavior when needed.

Related file:

- [01_seed_data.js](file:///c:/Users/kulde/aqua-ai/backend/database/seeds/01_seed_data.js)

## C) Ingestion → Postgres Storage → API Retrieval

### C1. Strict Mode (No Mock Data)

To ensure no sample data is used:

```bash
set ALLOW_SAMPLE_DATA=false
set DATA_GOV_IN_API_KEY=<real key>
set DATA_GOV_IN_RESOURCE_ID=<dataset resource id>
python data-pipeline/fetch_data.py
```

Expected behavior:

- Run fails fast if the API key is missing or upstream is unauthorized.
- If you see `403` with body `{"error":"Key not authorised"}`, the key is present but not authorized for the selected `DATA_GOV_IN_RESOURCE_ID` (or the key is unverified/invalid).

### C2. Demonstration Run (Sample Data Enabled)

This run validates wiring and storage mechanics when a real key is not available:

```bash
set DATABASE_URL=postgresql://postgres:aqua_ai_password@localhost:5432/aqua_ai_db
set ALLOW_SAMPLE_DATA=true
python data-pipeline/fetch_data.py
```

Observed (sample):

- Inserted 7,376 readings into Postgres.
- Locations increased (upsert) from 15 → 46.
- Backend `/api/water-quality` returned the inserted readings.

### C3. Ingestion State Tracking

Fix applied:

- Pipeline updates `data_sources` (`last_fetch`, `status`, `last_error`) and logs a stable `run_id`.

Related file:

- [fetch_data.py](file:///c:/Users/kulde/aqua-ai/data-pipeline/fetch_data.py)

## D) UI Data Sourcing (Displayed Data vs API)

Discrepancy found:

- Map/Alerts/Analytics/Dashboard widgets previously used hardcoded domain datasets.

Fix applied:

- Replaced mock datasets with API-backed requests.

Key files:

- [MapViewPage.tsx](file:///c:/Users/kulde/aqua-ai/frontend/src/pages/MapViewPage.tsx)
- [AlertsPage.tsx](file:///c:/Users/kulde/aqua-ai/frontend/src/pages/AlertsPage.tsx)
- [AnalyticsPage.tsx](file:///c:/Users/kulde/aqua-ai/frontend/src/pages/AnalyticsPage.tsx)
- [MetricsCards.tsx](file:///c:/Users/kulde/aqua-ai/frontend/src/components/MetricsCards.tsx)
- [RecentAlerts.tsx](file:///c:/Users/kulde/aqua-ai/frontend/src/components/RecentAlerts.tsx)
- [RiskHotspots.tsx](file:///c:/Users/kulde/aqua-ai/frontend/src/components/RiskHotspots.tsx)
- API client: [api.ts](file:///c:/Users/kulde/aqua-ai/frontend/src/services/api.ts)

## E) Logging / Tracing Procedures

### E1. Backend request tracing

- Every response includes `X-Request-Id`.
- Backend logs request completion with `{ requestId, statusCode, durationMs }`.

Related file:

- [server.js](file:///c:/Users/kulde/aqua-ai/backend/src/server.js#L133-L158)

### E2. DB-level tracing

- DB health status is reported by `/api/health`.
- Slow queries and query errors are logged by the Knex wrapper: [connection.js](file:///c:/Users/kulde/aqua-ai/backend/src/db/connection.js)

### E3. Ingestion tracing

- Pipeline logs every run with `run_id=<...>`.
- Pipeline upserts `data_sources` with `last_fetch/status/last_error` for auditability.

## Remaining Recommendations

1. Enforce `ALLOW_SAMPLE_DATA=false` in production environment variables.
2. Consider adding uniqueness constraints to prevent duplicate readings (e.g., `(location_id, parameter_id, measurement_date)`).
3. Add an ingestion run table if you want run-level metrics persisted (counts, duration, upstream status codes).

- `/api/locations`
- `/api/locations/geojson`
- `/api/water-quality`
- `/api/alerts`

Validation behavior verified:

- `/api/locations/search` without `q` returns `400` with a clear error message and `X-Request-Id`.
- Invalid IDs (e.g. `/api/locations/abc`) return `400` with structured validation details.

### Ingestion Verification

Strict mode (real upstream only):

- `ALLOW_SAMPLE_DATA=false` (default) correctly fails fast when upstream returns `403`:
  - prevents synthetic data from being stored
  - blocks “real upstream only” validation until a valid `DATA_GOV_IN_API_KEY` is provided
  - example observed error: `{"error":"Key not authorised"}`

Fallback mode (demo only):

- With `ALLOW_SAMPLE_DATA=true`, pipeline:
  - upserts 31 locations
  - inserts 7376 readings
  - commits successfully to Postgres

Post-ingestion DB verification:

- `locations`: 31
- `water_quality_readings`: 7376

Post-ingestion API verification:

- `/api/water-quality?limit=2` returned non-empty results with correct pagination and joins.
- Filters verified to return non-empty results:
  - `parameter=BOD`
  - `state=Uttar Pradesh`
  - `risk_level=critical`

### Frontend Verification (API Data Flow)

Frontend `/api` proxy verified (same-origin) by calling:

- `http://localhost:3000/api/health`
- `http://localhost:3000/api/locations/stats`
- `http://localhost:3000/api/water-quality?limit=1`

These returned live backend responses, confirming frontend → API → DB path is operational.

### Performance Checks (Local)

Using 20-request samples (curl timing):

- `/api/water-quality?limit=100`: avg ~13ms (min ~11ms, max ~15ms)
- `/api/locations/geojson`: avg ~8ms (min ~8ms, max ~10ms)

No slow-query warnings observed in backend logs during these checks (threshold controlled by `DB_SLOW_QUERY_MS`).

### Logging / Traceability

Request correlation verified end-to-end:

- Supplying `X-Request-Id: trace-test-001` to `/api/health` resulted in:
  - response header `X-Request-Id: trace-test-001`
  - backend log line containing `requestId: trace-test-001`
