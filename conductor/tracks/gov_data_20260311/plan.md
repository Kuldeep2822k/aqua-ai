# Implementation Plan: Integrate Real-time Government Data APIs

## Phase 1: API Client Development

- [ ] Task: Research and Document CPCB and Ministry of Jal Shakti API Specifications
    - [ ] Identify API endpoints and required authentication.
    - [ ] Document data formats (JSON/XML/CSV) and parameter mappings.
- [ ] Task: Implement CPCB API Client
    - [ ] Write unit tests for the CPCB API collector in `data-pipeline/collectors/test_cpcb.py`.
    - [ ] Implement the `CPCBCollector` in `data-pipeline/collectors/cpcb.py`.
    - [ ] Verify collector successfully fetches raw data.
- [ ] Task: Implement Ministry of Jal Shakti API Client
    - [ ] Write unit tests for the Ministry API collector in `data-pipeline/collectors/test_jal_shakti.py`.
    - [ ] Implement the `JalShaktiCollector` in `data-pipeline/collectors/jal_shakti.py`.
    - [ ] Verify collector successfully fetches raw data.
- [ ] Task: Conductor - User Manual Verification 'API Client Development' (Protocol in workflow.md)

## Phase 2: Data Normalization and Storage

- [ ] Task: Database Schema Migration
    - [ ] Create Knex migrations for updating `locations` and `water_quality_readings` tables as needed.
    - [ ] Run migrations and verify the schema update.
- [ ] Task: Data Normalization Logic
    - [ ] Write unit tests for data normalization in `data-pipeline/transformers/test_normalizer.py`.
    - [ ] Implement the `DataNormalizer` to handle unit conversions and parameter standardization.
    - [ ] Verify normalization with sample data from both sources.
- [ ] Task: Integrate Data Persistence
    - [ ] Write unit tests for database persistence in `data-pipeline/collectors/test_persistence.py`.
    - [ ] Implement the persistence layer to store normalized data in PostgreSQL.
    - [ ] Verify the complete ETL flow (Fetch -> Normalize -> Store).
- [ ] Task: Conductor - User Manual Verification 'Data Normalization and Storage' (Protocol in workflow.md)

## Phase 3: Backend API and Dashboard Integration

- [ ] Task: Enhance Backend API Endpoints
    - [ ] Write unit tests for updated locations and water quality routes in `backend/tests/api.test.js`.
    - [ ] Update `/api/locations` and `/api/waterQuality` routes to serve live data.
    - [ ] Verify API responses match the normalized database schema.
- [ ] Task: Update Frontend Map Visualization
    - [ ] Write unit tests for the updated MapView in `frontend/src/__tests__/MapView.test.tsx`.
    - [ ] Modify `MapView.tsx` to display real-time markers and tooltips using live data.
    - [ ] Verify the map renders correctly with live markers.
- [ ] Task: Integrate Real-time Dashboard Metrics
    - [ ] Update dashboard metrics cards and charts to reflect live water quality indicators.
    - [ ] Verify data consistency between the map and dashboard analytics.
- [ ] Task: Conductor - User Manual Verification 'Backend API and Dashboard Integration' (Protocol in workflow.md)
