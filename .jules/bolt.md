## 2024-11-20 - [AlertsPage Performance Bottleneck]

**Learning:** React re-renders frequently when search queries update via keystrokes. Computations like O(N) `Array.prototype.find()` or multiple O(N) `Array.prototype.filter()` operations within the render function become significant performance bottlenecks, causing janky search and typing delays.
**Action:** Always wrap derived data calculations that rely on O(N) array traversals inside `useMemo`, and consolidate multiple passes into a single iteration to minimize CPU overhead on state changes.

## 2024-11-20 - [Water Quality Stats API Bottleneck]

**Learning:** When calculating statistics like sums, averages, or distributions, fetching all rows into Node.js memory (e.g., via Supabase REST client) creates a massive O(N) memory and serialization bottleneck.
**Action:** Prioritize using Knex server-side aggregations (e.g., `.count()`, `.sum()`, `.groupBy()`) instead of pulling all records to the application layer to calculate stats.

## 2024-11-20 - [Alerts Stats API Bottleneck]
**Learning:** Similar to the water quality stats, fetching all alerts into Node.js memory to compute distributions (e.g. active, resolved, dismissal counts, and avg resolution times) using `Array.prototype.reduce` and `filter` creates massive O(N) memory and serialization bottlenecks.
**Action:** Use Knex server-side aggregations with `db.clone()` and `Promise.all` (e.g. `count()`, `groupBy()`, and SQL extraction `EXTRACT(EPOCH FROM ...)`) instead of performing in-memory aggregations.
