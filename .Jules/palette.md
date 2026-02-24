## 2026-02-24 - Handling Active States in Manual Navigation
**Learning:** This app uses manual state-based routing (`currentPage` prop) instead of a router library. Navigation buttons lacked `aria-current="page"`, making it impossible for screen readers to identify the active page.
**Action:** When implementing custom navigation components, always manually apply `aria-current="page"` to the active item based on the current state.
