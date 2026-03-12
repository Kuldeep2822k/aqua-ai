## 2024-11-20 - [AlertsPage Performance Bottleneck]

**Learning:** React re-renders frequently when search queries update via keystrokes. Computations like O(N) `Array.prototype.find()` or multiple O(N) `Array.prototype.filter()` operations within the render function become significant performance bottlenecks, causing janky search and typing delays.
**Action:** Always wrap derived data calculations that rely on O(N) array traversals inside `useMemo`, and consolidate multiple passes into a single iteration to minimize CPU overhead on state changes.

## 2024-11-20 - [Water Quality Stats API Bottleneck]

**Learning:** When calculating statistics like sums, averages, or distributions, fetching all rows into Node.js memory (e.g., via Supabase REST client) creates a massive O(N) memory and serialization bottleneck.
**Action:** Prioritize using Knex server-side aggregations (e.g., `.count()`, `.sum()`, `.groupBy()`) instead of pulling all records to the application layer to calculate stats.
