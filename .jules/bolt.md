## 2024-11-20 - [AlertsPage Performance Bottleneck]

**Learning:** React re-renders frequently when search queries update via keystrokes. Computations like O(N) `Array.prototype.find()` or multiple O(N) `Array.prototype.filter()` operations within the render function become significant performance bottlenecks, causing janky search and typing delays.
**Action:** Always wrap derived data calculations that rely on O(N) array traversals inside `useMemo`, and consolidate multiple passes into a single iteration to minimize CPU overhead on state changes.
