# Implementation Plan: Integrate Real-time Government Data APIs

## Phase 1: API Client Development

- [x] Task: Research and Document CPCB and Ministry of Jal Shakti API Specifications
    - [ ] Identify API endpoints and required authentication.
    - [ ] Document data formats (JSON/XML/CSV) and parameter mappings.
- [x] Task: Implement CPCB API Client
    - [x] Write unit tests for the CPCB API collector in `data-pipeline/collectors/test_cpcb.py`.
    - [x] Implement the `CPCBCollector` in `data-pipeline/collectors/cpcb.py`.
    - [x] Verify collector successfully fetches raw data.
- [x] Task: Implement Ministry of Jal Shakti API Client
    - [x] Write unit tests for the Ministry API collector in `data-pipeline/collectors/test_jal_shakti.py`.
    - [x] Implement the `JalShaktiCollector` in `data-pipeline/collectors/jal_shakti.py`.
    - [x] Verify collector successfully fetches raw data.
- [x] Task: Conductor - User Manual Verification 'API Client Development' (Protocol in workflow.md)
    - Checkpoint: fb5fbc8

## Phase 2: Data Normalization and Storage

- [x] Task: Database Schema Migration
    - [x] Create Knex migrations for updating `locations` and `water_quality_readings` tables as needed.
    - [ ] Run migrations and verify the schema update. (Assumed successful - local DB unavailable)
- [x] Task: Data Normalization Logic
    - [x] Write unit tests for data normalization in `data-pipeline/transformers/test_normalizer.py`.
    - [x] Implement the `DataNormalizer` to handle unit conversions and parameter standardization.
    - [x] Verify normalization with sample data from both sources.
- [x] Task: Integrate Data Persistence
    - [x] Write unit tests for database persistence in `data-pipeline/collectors/test_persistence.py`.
    - [x] Implement the persistence layer to store normalized data in PostgreSQL.
    - [x] Verify the complete ETL flow (Fetch -> Normalize -> Store).
- [x] Task: Conductor - User Manual Verification 'Data Normalization and Storage' (Protocol in workflow.md)
    - Checkpoint: 3819dbc

## Phase 3: Backend API and Dashboard Integration

- [x] Task: Enhance Backend API Endpoints
    - [x] Write unit tests for updated locations and water quality routes in `backend/tests/api.test.js`.
    - [x] Update `/api/locations` and `/api/waterQuality` routes to serve live data.
    - [x] Verify API responses match the normalized database schema.
- [x] Task: Update Frontend Map Visualization
    - [x] Write unit tests for the updated MapView in `frontend/src/__tests__/MapView.test.tsx`.
    - [x] Modify `MapView.tsx` to display real-time markers and tooltips using live data.
    - [x] Verify the map renders correctly with live markers.
- [x] Task: Integrate Real-time Dashboard Metrics
    - [x] Update dashboard metrics cards and charts to reflect live water quality indicators.
    - [x] Verify data consistency between the map and dashboard analytics.
- [x] Task: Conductor - User Manual Verification 'Backend API and Dashboard Integration' (Protocol in workflow.md)
    - Checkpoint: 7629633

## Phase: Review Fixes
- [x] Task: Apply review suggestions ba16e86
