# Bolt's Performance Journal ⚡

## 2026-02-18 - [Optimization] Swapped Manual JS Aggregation with SQL/Knex
**Learning:** The `/api/water-quality/stats` endpoint was fetching all rows from Supabase into memory to calculate stats in Node.js, causing huge memory usage and latency. Switched to `knex` parallel aggregation queries (`Promise.all`).
**Action:** Always prefer database-side aggregation (SQL `COUNT`, `AVG`, `MAX`) over application-side loops, especially for potentially large datasets.
