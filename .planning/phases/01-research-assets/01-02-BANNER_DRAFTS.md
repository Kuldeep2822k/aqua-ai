# 'Star on GitHub' Banner Drafts

These UI components are designed to increase repository visibility and engagement by prompting users to star 'aqua-ai' on GitHub.

## 1. Minimalist Header Banner

**Placement**: Top of the dashboard, spanning the full width.

- **Copy**: "Help us reach 100 stars! 🌟 Star aqua-ai on GitHub to support sustainable water management."
- **Style**:
  - `bg-blue-600 text-white font-semibold text-center py-2 text-sm shadow-md`
  - Subtle hover animation on the Star emoji.
- **Logic**:
  - Show on every page load until the user clicks 'dismiss' (X icon on the right).
  - Store dismissal in `localStorage`.
  - Re-trigger after 7 days if the repository isn't starred.

## 2. Embedded Footer Section

**Placement**: Persistent at the bottom of the main dashboard or settings page.

- **Copy**: "Loving the insights? Give us a star on GitHub! ⭐️ Join our community of 50+ contributors building the future of water intelligence."
- **Style**:
  - `bg-slate-800 text-slate-200 p-6 rounded-lg border border-slate-700 mt-8`
  - Includes a large, primary action button: `bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-md font-bold text-white transition-colors`.
- **Logic**:
  - Always visible on the 'Insights' and 'About' pages.
  - Hidden only if the user is verified to have starred (via GitHub OAuth connection, if available).

## 3. Milestone/Success Side-Toast

**Placement**: Bottom-right corner of the viewport.

- **Copy**: "Success! 🎉 You just optimized your water quality monitoring. If you find this tool helpful, consider starring us on GitHub!"
- **Style**:
  - `fixed bottom-4 right-4 bg-white text-slate-900 p-4 rounded-xl shadow-2xl border-l-4 border-blue-500 flex items-center space-x-3 max-w-sm`
  - Subtle 'slide-in' animation from the right.
- **Logic**:
  - Triggered only after a "success" action (e.g., generating a report, successfully applying a filter, reaching a data milestone).
  - Auto-dismiss after 8 seconds.
  - Only appears once per session.
