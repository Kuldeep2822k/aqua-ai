## 2025-02-23 - Disabled Action Feedback

**Learning:** Users often mistake disabled buttons for broken features if there's no feedback. Simply disabling a button or removing its click handler isn't enough; users need to know _why_ it's disabled or that it's a placeholder.
**Action:** Always wrap disabled or "coming soon" actions in a Tooltip explaining the state, and ensure they are visually distinct (opacity, cursor) while remaining accessible (keyboard focusable if appropriate, or using `aria-disabled`).
