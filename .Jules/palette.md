## 2024-05-22 - Accessible Disabled Buttons
**Learning:** Using `disabled` attribute on buttons prevents them from receiving focus, making them inaccessible to keyboard users and preventing tooltips from appearing via keyboard interaction.
**Action:** Use `aria-disabled="true"` instead of `disabled`, prevent default events in `onClick`, and maintain visual disabled styles. This allows keyboard focus and tooltip interaction.
