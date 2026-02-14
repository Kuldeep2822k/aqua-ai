# Project History & Evolution Structure

This document outlines the development history of the project based on the commit log (approx. 274 commits), structured by chronological phases and key milestones.

## Phase 1: Infrastructure & Deployment Stabilization (Early Jan 2026)
**Focus:** Setting up the environment, CI/CD, and resolving initial deployment issues.

- **Initial Fixes (Jan 6):**
  - Resolved blank page issues in the App.
  - Added Docker configurations and initial CI/CD pipelines.
  - Fixed backend route paths and critical vulnerabilities.
- **Deployment Strategy Shift (Jan 12 - Jan 14):**
  - Initially targeted Vercel deployment.
  - Encountered and fixed multiple build/runtime errors on Vercel.
  - **Major Decision:** Migrated from Vercel to Render (Jan 14).
  - Configured root-based scripts and `index.js` shims for Render deployment.
  - "No API" mode implemented temporarily to stabilize frontend.

## Phase 2: Backend Integration & Data Pipelines (Mid Jan 2026)
**Focus:** Connecting real data sources and establishing the database layer.

- **Data Integration (Jan 13 - Jan 21):**
  - Implemented data processing logic for `data.gov.in`.
  - Integrated backend API for Water Quality Map.
  - Added CPCB (Central Pollution Control Board) data fetching pipeline.
- **Database & Backend:**
  - Configured Knex.js and migrations.
  - Fixed Docker build and route registration.
  - Added "Sentinel" security fixes for hardcoded secrets and SQL wildcard injections.
  - Implemented rate limiting and proxy trust settings.

## Phase 3: Maintenance & Security Hardening (Late Jan 2026)
**Focus:** Updating dependencies, enforcing code quality, and deep security improvements.

- **Dependency Management (Jan 20):**
  - Large wave of Dependabot updates (GitHub Actions, Node, Python, Docker).
  - Bumped major versions for `actions/setup-node`, `actions/checkout`, `jest`, `helmet`, etc.
- **Code Quality:**
  - Set up Prettier and formatted the entire codebase.
  - Relaxed Hadolint rules to fix infrastructure linting.
- **Security (Sentinel Initiatives) (Jan 21 - Jan 30):**
  - **RBAC:** Enforced Role-Based Access Control on alert resolution.
  - **Timing Attacks:** Mitigated timing attacks on login endpoints.
  - **HPP:** Added HTTP Parameter Pollution protection middleware (High priority).
  - **XSS:** Fixed Stored XSS vulnerabilities in user registration.
  - **Secrets:** Removed hardcoded database passwords.

## Phase 4: Frontend Redesign & Modernization (Feb 4 - Feb 13, 2026)
**Focus:** Overhauling the UI/UX and modernizing the frontend stack.

- **Tech Stack Update (Feb 4):**
  - **Migration:** Completed frontend redesign with **Vite + TailwindCSS**.
  - **Maps:** Replaced canvas-based map with **React-Leaflet** for better zoom/markers.
  - **PWA:** Added SEO tags and PWA manifest.
- **Quality Assurance:**
  - Added end-to-end system validation.
  - Fixed map data/WQI (Water Quality Index) calculation issues.
  - Standardized code formatting and quotes across frontend.
  - Added error boundaries and lazy loading for analytics charts.
  - Configured Vitest with `jsdom` for frontend testing.

## Phase 5: Documentation & Workflow Automation (Feb 14, 2026)
**Focus:** Finalizing documentation and improving developer experience.

- **Documentation:**
  - Added comprehensive architecture diagrams (SVG/Mermaid) to `docs/` and `README.md`.
  - Revised README with correct tech stack and quick start guide.
- **Workflow Automation:**
  - Added GitHub Actions for labeling PRs and summarizing issues.
  - Fixed YAML linting in workflows.
- **Merge & Conflict Resolution:**
  - Merged multiple feature branches (`sentinel-hpp-fix`, `new-frontend`, `sentinel-fix-xss`).
  - Resolved conflicts in main branch merges.

---
**Summary Stats:**
- **Total Commits:** ~274
- **Active Contributors:** Kuldeep2822k (primary)
- **Key Branches Merged:** `new-frontend`, `sentinel/*` (security series), `dependabot/*`
