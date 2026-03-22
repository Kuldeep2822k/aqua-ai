## 2024-11-20 - [AlertsPage Performance Bottleneck]

**Learning:** React re-renders frequently when search queries update via keystrokes. Computations like O(N) `Array.prototype.find()` or multiple O(N) `Array.prototype.filter()` operations within the render function become significant performance bottlenecks, causing janky search and typing delays.
**Action:** Always wrap derived data calculations that rely on O(N) array traversals inside `useMemo`, and consolidate multiple passes into a single iteration to minimize CPU overhead on state changes.

## 2024-11-20 - [Water Quality Stats API Bottleneck]

**Learning:** When calculating statistics like sums, averages, or distributions, fetching all rows into Node.js memory (e.g., via Supabase REST client) creates a massive O(N) memory and serialization bottleneck.
**Action:** Prioritize using Knex server-side aggregations (e.g., `.count()`, `.sum()`, `.groupBy()`) instead of pulling all records to the application layer to calculate stats.

## 2024-11-20 - [RiskHotspots Array Sorting Bottleneck]

**Learning:** When sorting large arrays in React (e.g., `RiskHotspots.tsx`), calling expensive functions, falling back to default values (`??`), or instantiating objects (like a `severityRank` map) inside the `Array.prototype.sort()` comparison function causes severe performance degradation due to $O(N \log N)$ repeated executions.
**Action:** Use the Schwartzian Transform (Map-Sort-Map) pattern to pre-compute derived values and object properties in a single $O(N)$ pass _before_ sorting, resulting in significantly faster and more stable render cycles.

## 2024-05-18 - Pre-compute Searchable Strings Outside Filter Loops
**Learning:** Performing string concatenations and `.toLowerCase()` operations inside a `.filter()` loop running on every keystroke (like in a search bar) causes significant O(N) overhead on large datasets, leading to main-thread blocking and UI jank in React.
**Action:** Always pre-compute concatenated, lowercased searchable strings inside a separate `useMemo` block that depends only on the source data. Then, perform a simple `.includes()` check against the pre-computed string during the frequent filter updates.
