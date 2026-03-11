
## 2025-03-05 - Use AlertDialog for Destructive Actions
**Learning:** Destructive actions (like Account Deletion) should not use `window.confirm` since it blocks the main thread and provides poor UX. The custom Radix UI `AlertDialog` component should be used instead for these cases.
**Action:** Always prefer `AlertDialog` over `window.confirm` for destructive or important confirmation actions to ensure accessible, non-blocking overlays that match the design system.
