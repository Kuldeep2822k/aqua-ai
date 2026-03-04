## 2024-11-20 - [AlertsPage Performance Bottleneck]

**Learning:** React re-renders frequently when search queries update via keystrokes. Computations like O(N) `Array.prototype.find()` or multiple O(N) `Array.prototype.filter()` operations within the render function become significant performance bottlenecks, causing janky search and typing delays.
**Action:** Always wrap derived data calculations that rely on O(N) array traversals inside `useMemo`, and consolidate multiple passes into a single iteration to minimize CPU overhead on state changes.

## 2024-11-22 - [Backend Aggregation Bottleneck]

**Learning:** Pulling all rows from Supabase into Node.js application memory just to calculate sums, averages, or grouped counts (e.g., in `/stats` or `/risk-summary` endpoints) creates a massive, O(N) serialization/deserialization payload bottleneck.
**Action:** Always replace in-memory array aggregations with O(1) server-side Knex DB aggregations (`sum`, `avg`, `count`, `groupBy`) to reduce network payload and avoid memory bloat.
