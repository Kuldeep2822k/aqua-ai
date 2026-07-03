# Contributing to AQUA-AI 🌊

Thanks for your interest in improving **AQUA-AI**, an AI-powered water quality
monitoring platform for India! Contributions of all sizes are welcome — from
fixing a typo to adding a new feature.

## Getting started

1. **Fork** the repository and **clone** your fork locally.
2. Install dependencies from the project root:

   ```bash
   npm install
   ```

   The `postinstall` script also installs the `backend/` and `frontend/`
   dependencies for you.
3. Copy the example environment file and fill in your values:

   ```bash
   cp .env.example .env.development
   ```
4. Start the full stack (React frontend + Node.js backend) in dev mode:

   ```bash
   npm run dev
   ```

## Project layout

| Directory        | Description                              |
| ---------------- | ---------------------------------------- |
| `frontend/`      | React 18 + TypeScript UI                 |
| `backend/`       | Node.js + Express API                    |
| `ai-models/`     | Python ML models                         |
| `data-pipeline/` | Data ingestion from government sources   |
| `docs/`          | Project documentation                    |

## Development workflow

1. Create a branch off `main`:

   ```bash
   git checkout -b feat/short-description
   ```
2. Make your changes and keep commits focused and descriptive. We follow
   [Conventional Commits](https://www.conventionalcommits.org/) (e.g.
   `feat:`, `fix:`, `docs:`, `chore:`).
3. Before opening a pull request, run the checks below.

## Checks before opening a PR

```bash
npm run lint          # Lint frontend and backend
npm run format:check  # Verify Prettier formatting
npm test              # Run frontend and backend tests
```

To auto-format your changes, run `npm run format`.

## Pull request checklist

- [ ] The branch is up to date with `main`.
- [ ] Linting, formatting, and tests pass locally.
- [ ] Commits follow the Conventional Commits style.
- [ ] The PR description explains **what** changed and **why**.

## Reporting issues

Found a bug or have a feature idea? Please
[open an issue](https://github.com/Kuldeep2822k/aqua-ai/issues) with as much
detail as possible — steps to reproduce, expected behavior, and screenshots
where relevant.

## Code of conduct

Please be respectful and constructive in all interactions. We want AQUA-AI to
be a welcoming project for everyone working toward safer water for India. 💧
