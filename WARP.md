# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This repository is a monorepo for the Aqua-AI platform:
- `frontend/`: React 18 + TypeScript SPA (Create React App + CRACO) providing dashboards, interactive maps, SEO-optimized marketing-style pages, and PWA behavior.
- `backend/`: Node.js + Express API exposing water-quality, locations, predictions, and alerts endpoints, currently backed by in-memory/mock data but structured to map onto a relational schema.
- `data-pipeline/`: Async Python data ingestion from Indian government/open APIs (or synthetic generators) into a SQLite development database.
- `ai-models/`: Python ML training pipeline that reads from the pipeline database and produces saved models and metadata for pollution prediction.
- `database/`: PostgreSQL + PostGIS schema (and seeds) representing the long-term “source of truth” for locations, readings, predictions, alerts, weather, community reports, etc.

At a high level, the intended flow is:
1. `data-pipeline/fetch_data.py` pulls or synthesizes water-quality + weather data and stores it (currently in SQLite for development).
2. `ai-models/train_model.py` trains per-parameter models from that data and saves model artifacts under `ai-models/models/`.
3. The Express backend exposes REST endpoints for locations, raw readings, AI predictions, and alerts; today these are powered by mock in-memory collections but are shaped to match the `database/schema.sql` design.
4. The React frontend calls backend APIs (via `REACT_APP_API_BASE_URL`) and renders dashboards, alerts, and maps (Leaflet / `react-leaflet` and custom map components) over India.

## Commands and workflows

All commands below are assumed to be run from the repo root (`aqua-ai`) unless noted.

### Root npm scripts (orchestrating frontend, backend, data, AI, and DB)

From `package.json` in the repo root:
- Install JS dependencies for all Node services:
  - `npm install` (installs root dev deps like `concurrently`; you still need to install inside `frontend/` and `backend/`, see below).
- Run the full dev stack (frontend + backend) in parallel:
  - `npm run dev`
    - Runs `npm run frontend:dev` (`cd frontend && npm start`) and `npm run backend:dev` (`cd backend && npm run dev`) via `concurrently`.
    - Expected ports (default): frontend on `http://localhost:3000`, backend on `http://localhost:5000`.
- Build both frontend and backend:
  - `npm run build` → `npm run frontend:build` + `npm run backend:build`.
    - `frontend:build`: CRA/CRACO production build.
    - `backend:build`: currently a no-op placeholder that just echoes a message.
- Run JS tests across frontend and backend:
  - `npm test` → `npm run frontend:test` + `npm run backend:test`.
  - Frontend uses CRA’s Jest setup; backend uses Jest directly.
- Python/DB helpers (defined as npm scripts for convenience):
  - `npm run ai:train` → `cd ai-models && python train_model.py` (trains ML models and saves them under `ai-models/models/`).
  - `npm run data:fetch` → `cd data-pipeline && python fetch_data.py` (fetches/generates water-quality data into a local SQLite DB `water_quality_data.db`).
  - `npm run db:migrate` / `npm run db:seed` → `cd database && npx knex migrate:latest` / `npx knex seed:run` (assumes a Knex config exists and Postgres is reachable; use these instead of invoking Knex directly when wiring the API to Postgres).

### Frontend (React + TypeScript, CRA + CRACO)

Located in `frontend/`.

Install and run:
- Install deps: `cd frontend && npm install`
- Dev server: `cd frontend && npm start`
  - CRA dev server with hot reload and lint feedback in the browser console.
- Unit tests (Jest via CRA): `cd frontend && npm test`
  - Interactive watch mode; you can filter tests by filename or pattern from the Jest prompt.
- Production build: `cd frontend && npm run build`

Useful extra scripts defined in `frontend/package.json`:
- Bundle analysis:
  - `cd frontend && npm run analyze` (build + `webpack-bundle-analyzer` without opening UI automatically)
  - `cd frontend && npm run analyze:open` (same but opens the analyzer UI)
- Size checks / quick smoke tests:
  - `cd frontend && npm run size-check`
  - `cd frontend && npm run test:quick` (build + size-check)
- Lighthouse audit (requires running dev server):
  - `cd frontend && npm run test:lighthouse`
- Comprehensive validation wrapper:
  - `cd frontend && npm run validate` (runs `test:comprehensive` script and prints a success message).

Notes for tests:
- The CRA test runner is Jest; to run a subset of tests you can pass Jest flags after `--`, for example:
  - `cd frontend && npm test -- Dashboard` (runs tests whose names or file paths match `Dashboard`).

### Backend (Node.js + Express API)

Located in `backend/`.

Install and run:
- Install deps: `cd backend && npm install`
- Dev server with auto-restart (nodemon): `cd backend && npm run dev`
- Plain start (no nodemon, suitable for simple prod-style runs): `cd backend && npm start`

Tests:
- Full Jest test suite: `cd backend && npm test`
- Watch mode while developing tests: `cd backend && npm run test:watch`
  - As with standard Jest, you can filter by filename or test name from the interactive prompt.

Key runtime configuration for backend:
- `PORT` (defaults to `5000`).
- `FRONTEND_URL` (used for CORS; defaults to `http://localhost:3000`).
- `NODE_ENV` controls error message verbosity.

### Python data pipeline and ML

Python dependencies are declared at the repo root and within `data-pipeline/`:
- Global analytics/ML and tooling: `requirements.txt` in the root.
- Data-pipeline–specific deps: `data-pipeline/requirements.txt`.

Typical workflow:
- Create/activate a virtualenv (recommended) and install dependencies:
  - `python -m venv .venv` (then activate for your shell)
  - `pip install -r requirements.txt`
  - Optionally: `cd data-pipeline && pip install -r requirements.txt` if you want strict versions from that file.
- Run the data pipeline (async ingestion + synthetic data generator):
  - `cd data-pipeline && python fetch_data.py`
  - Or via root script: `npm run data:fetch`
  - Produces/updates `data-pipeline/water_quality_data.db` (SQLite) and populates tables like `water_quality_readings` and `locations`.
- Train AI models over the ingested data:
  - `cd ai-models && python train_model.py`
  - Or via root script: `npm run ai:train`
  - Uses the SQLite DB at `../data-pipeline/water_quality_data.db` by default and writes model artifacts + metadata into `ai-models/models/`.

### Database and Docker

Relational schema:
- `database/schema.sql` defines the Postgres + PostGIS schema for:
  - `locations`, `water_quality_parameters`, `water_quality_readings`, `ai_predictions`, `alerts`, `weather_data`, `community_reports`, `data_sources`, `water_quality_index`, plus custom enum types (`risk_level`, `alert_status`, `data_source_type`).
- `database/seed_data.sql` (if/when populated) is the place for seed data; root scripts `db:migrate`/`db:seed` are intended for Knex-based migrations/seeding.

Manual Postgres setup (mirrors `SETUP.md`):
- Apply schema from the repo root (adjust connection details as needed):
  - `psql -U aqua_ai -d aqua_ai_db -f database/schema.sql`

Docker (when a `docker-compose.yml` is present/configured):
- Start the full stack:
  - `docker-compose up -d`
- This is the preferred route for demo/hackathon-style setups; see `SETUP.md` for more detailed instructions and port mappings.

## High-level architecture

### Frontend architecture

Key entry points and concerns:
- `frontend/src/index.tsx`
  - Boots the SPA, renders `App` (currently `App.working`).
- `frontend/src/App.tsx`
  - Configures the MUI theme, typography, shadows, and component overrides.
  - Wraps the app in providers: `HelmetProvider` (SEO/head management), `QueryClientProvider` (React Query), `ThemeProvider`, `I18nextProvider`, `PWAProvider`, and `NotificationProvider`.
  - Registers a service worker via `useServiceWorker` and prefetches routes via `useRoutePreloader`.
  - Defines routing with `react-router-dom` and lazy-loads page-level components for:
    - Dashboard, Map, Analytics, Alerts, Community, Research, Sustainability, Settings.
  - Uses `Navbar` + `Sidebar` layout, with responsive handling of sidebar width and navbar height.
- Maps and spatial visualization:
  - `components/WaterQualityMap.tsx` uses `react-leaflet` and styled-components to render locations, popups, filters by parameter/risk level, and a legend.
  - `components/DashboardMap.tsx` and `components/SimpleMap.tsx` provide dashboard-embedded and simplified map variants, reused by the Dashboard and Map pages.
- SEO and analytics:
  - `hooks/useSEO.ts` + `components/SEO/SEOHead.tsx` compute per-route SEO metadata from a central `seoConfig`, generate breadcrumb schema, and derive canonical URLs/images.
  - `useSEOAnalytics` integrates with `gtag` (Google Analytics 4) and updates Open Graph last-modified metadata.
- Notifications and real-time UX:
  - `contexts/NotificationContext.tsx` manages alert state (in-memory + `localStorage` persistence), toast notifications, optional WebSocket subscriptions (in development only, via `REACT_APP_WS_URL`), and browser push notifications (where permitted).
  - `contexts/PWAContext.tsx` and `hooks/useServiceWorker.ts` manage service-worker registration and PWA behaviors.

### Backend architecture (Express API)

- Entry point: `backend/src/server.js`
  - Sets up security middleware (`helmet`, CORS, rate limiting), compression, logging (`morgan`), and JSON body parsing.
  - CORS origin is controlled via `FRONTEND_URL` (defaults to `http://localhost:3000`).
  - Mounts routers:
    - `/api/health`: simple JSON health-check.
    - `/api/water-quality`: `backend/routes/waterQuality.js` (filterable readings, parameters metadata, stats).
    - `/api/locations`: `backend/routes/locations.js` (location catalogue, GeoJSON, stats, search).
    - `/api/predictions`: `backend/routes/predictions.js` (AI prediction records, hotspots, generator endpoint).
    - `/api/alerts`: `backend/routes/alerts.js` (alert listing, stats, state transitions, notifications).
  - Includes a catch-all 404 handler for unmatched routes and an error-handling middleware that hides internal messages outside `NODE_ENV=development`.

Routers all follow the same shape:
- In-memory/mock collections declare canonical data shapes (IDs, location metadata, parameters, scores, risk levels).
- List endpoints accept query parameters for filtering (state, parameter, risk level, status, forecast horizon, etc.) and implement simple pagination (`limit`, `offset`) with a `pagination` object in the response.
- Detail endpoints fetch by `:id` or by location and parameter (e.g., `/api/water-quality/:id`, `/api/locations/:id`, `/api/predictions/location/:locationId`).
- “Stats” endpoints compute server-side aggregates (risk distributions, average scores, counts, coverage) to support dashboard widgets without client-side heavy lifting.

This design mirrors the relational schema in `database/schema.sql` and is ready to be swapped from mocks to real DB access (e.g., via Knex or direct `pg` queries) while keeping response contracts stable for the frontend.

### Data pipeline and ML architecture

- `data-pipeline/fetch_data.py`
  - Defines `WaterQualityDataFetcher`, which initializes a small SQLite schema (`water_quality_readings`, `locations`, `data_sources`).
  - Async methods fetch from configured `GOVERNMENT_APIS` entries (`data.gov.in`, CPCB, weather API) when API keys are present; otherwise they generate realistic synthetic data based on `WATER_QUALITY_PARAMETERS` and `INDIAN_WATER_BODIES`.
  - Weather data is optionally fetched for a subset of locations for correlation/feature engineering.
  - `save_to_database` persists both readings and deduplicated locations into SQLite.
  - `main()` runs the full pipeline and prints a concise summary (counts, sample record) to stdout.
- `ai-models/train_model.py`
  - `WaterQualityPredictor` loads data from the SQLite DB (or generates synthetic data if unavailable), pivots parameters into columns, imputes missing values, encodes categorical features, and engineers additional features like `pollution_index`.
  - Multiple models are trained:
    - Traditional ML models per parameter (`RandomForestRegressor` vs `GradientBoostingRegressor` with simple model selection based on R²).
    - Optional TensorFlow/Keras neural network for specific targets.
  - Provides `predict_pollution_risk` for a single location’s feature vector, returning predicted parameter values, confidences, and derived risk levels.
  - Saves models, scalers, label encoders, and metadata under `ai-models/models/` and can reload them for inference.

### Relational schema and long-term storage

The intended production data model is described in `database/schema.sql`:
- Uses Postgres with PostGIS (`CREATE EXTENSION IF NOT EXISTS postgis`) and custom enums (`risk_level`, `alert_status`, `data_source_type`).
- Core tables:
  - `locations` with a `geom` field and spatial index for map queries.
  - `water_quality_parameters` and `water_quality_readings` for parameter metadata and time-series readings (with constraints on value and quality_score).
  - `ai_predictions` mirroring the prediction structure used in the Express routes.
  - `alerts` (status, severity, threshold vs actual, timestamps, notification flags).
  - `weather_data`, `community_reports`, `data_sources`, and `water_quality_index` for correlation, crowdsourced reports, source tracking, and derived WQI metrics.

When integrating the Node backend with Postgres, this schema is the reference for how REST resources should be persisted and joined; the existing mock routes already follow these shapes closely.

## Documentation pointers

- `README.md` (root): high-level marketing/overview of Aqua-AI, technology stack, conceptual architecture diagrams, and quick-start instructions (clone, install deps, `npm run dev`, Docker usage).
- `SETUP.md`: detailed, step-by-step setup for backend/frontend, Postgres/PostGIS, Docker-based deployment, and hackathon/production guidance. Prefer to keep environment-specific tweaks (e.g., DB provisioning commands) consistent with this file.
- `REVENUE_STRATEGY.md`: business/revenue model and GTM plan; useful context for product decisions but generally not something code changes need to touch.

When adding new features or refactoring, prefer to:
- Reuse the existing REST resource boundaries (`water-quality`, `locations`, `predictions`, `alerts`) and extend their routers rather than creating ad-hoc endpoints.
- Keep frontend data access and types consistent with `frontend/src/types/api.ts` so the UI and backend stay aligned.
- Consider whether new data belongs in the Postgres schema (`database/schema.sql`), the data pipeline, or the mock layers before wiring it into the API.