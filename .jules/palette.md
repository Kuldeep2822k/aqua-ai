# Palette's Journal

## 2024-05-22 - Perceived Performance in Lists

**Learning:** List-based content (like alerts) feels sluggish when using simple text loaders ("Loading..."). Skeleton screens significantly improve perceived performance by providing a layout hint.
**Action:** Use skeleton screens for all list-based data fetching components instead of generic text or spinners.

## 2024-05-23 - Custom Routing Pattern

**Learning:** The application uses state-based routing (`currentPage` state) instead of URL-based client-side routing (like `react-router`). Navigation items are `<button>` elements, not `<a>` tags.
**Action:** When writing tests or automation scripts, target navigation elements using `role="button"` instead of `role="link"`, and do not rely on URL changes for navigation assertions.
