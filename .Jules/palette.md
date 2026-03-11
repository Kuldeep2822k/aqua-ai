## 2024-05-15 - [Adding aria-current="page" to state-based routing navigation]
**Learning:** For custom state-based routing where anchor tags (`<a>`) are replaced by `<button>` elements (such as the navigation items in the `Header.tsx`), screen readers rely entirely on `aria-current="page"` to announce the active view. CSS styling alone is insufficient for non-visual users.
**Action:** Always include `aria-current={isActive ? 'page' : undefined}` on custom navigation elements when standard URL-based routing is not used.
