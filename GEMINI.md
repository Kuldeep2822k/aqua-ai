# GEMINI.md - Aqua-AI Instructional Context

## 🌊 Project Overview

**Aqua-AI** is an AI-powered water quality monitoring platform specifically designed for India. It integrates official government data (CPCB, Ministry of Jal Shakti) with machine learning to predict pollution events and provide real-time visualization of water quality indicators across the nation.

### 🛠 Tech Stack

- **Frontend:** React 18 (TypeScript), Vite, Leaflet/Mapbox (Maps), Tailwind CSS, Recharts.
- **Backend:** Node.js, Express.js, JWT Auth, Winston Logger, Helmet (Security).
- **Database:** PostgreSQL + PostGIS (Spatial Data), Supabase (Managed), Knex.js (Migrations/Queries).
- **AI/ML:** Python 3.11, Scikit-Learn (Random Forest, GBM), TensorFlow.
- **Infrastructure:** Docker, Docker Compose, GitHub Actions (CI/CD).

---

## 📂 Project Structure

- `frontend/`: React SPA handling UI, maps, and interactive dashboards.
- `backend/`: Node.js REST API handling business logic, authentication, and database interactions.
- `ai-models/`: Python scripts for training, evaluating, and serving machine learning models.
- `data-pipeline/`: Python ETL processes for fetching and cleaning government data.
- `database/`: Database schema definitions, Knex migrations, and seed data.
- `docs/`: Comprehensive technical documentation, architecture diagrams, and project plans.
- `.github/workflows/`: CI/CD automation for building, testing, and deploying the platform.

---

## 🚀 Building and Running

### Prerequisites

- Node.js (v18+)
- Python (v3.11+)
- PostgreSQL with PostGIS extension (or Supabase URL)
- Docker (optional, for containerized deployment)

### Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Environment Variables:**
   Copy `.env.example` to `.env.development` and configure `DATABASE_URL`, `JWT_SECRET`, and `PORT`.

### Key Commands

| Action               | Command                | Description                                  |
| :------------------- | :--------------------- | :------------------------------------------- |
| **Start All**        | `npm run dev`          | Runs Frontend and Backend concurrently.      |
| **Frontend Dev**     | `npm run frontend:dev` | Starts the React development server.         |
| **Backend Dev**      | `npm run backend:dev`  | Starts the Express server with nodemon.      |
| **Database Migrate** | `npm run db:migrate`   | Runs Knex migrations to set up the schema.   |
| **Database Seed**    | `npm run db:seed`      | Seeds the database with initial sample data. |
| **AI Train**         | `npm run ai:train`     | Runs Python model training script.           |
| **Data Fetch**       | `npm run data:fetch`   | Triggers the data ingestion pipeline.        |
| **Test**             | `npm test`             | Runs both frontend and backend tests.        |
| **Format**           | `npm run format`       | Formats the entire codebase using Prettier.  |

---

## 🛡️ Development Conventions

### 1. Security & Validation

- **Authentication:** All protected routes must use the `auth` middleware (JWT-based).
- **Validation:** Use `express-validator` for all incoming request bodies and parameters in the backend.
- **Security Headers:** Managed via `helmet`. Ensure no sensitive headers are leaked.
- **Sensitive Data:** NEVER hardcode API keys or secrets. Use environment variables.

### 2. Logging & Monitoring

- **Winston Logger:** Use the custom logger in `backend/src/utils/logger.js`. Avoid using `console.log` in production code.
- **Request Context:** Every request is assigned a unique `requestId` for tracking through logs.

### 3. Database

- **Migrations:** Always use Knex migrations for schema changes. Do not modify the database manually.
- **Spatial Data:** Leverage PostGIS functions for geographical queries (e.g., finding locations within a radius).

### 4. Code Style

- **Formatting:** Prettier is enforced. Run `npm run format` before committing.
- **Types:** Strictly use TypeScript interfaces/types for all API responses and component props in the frontend.

---

## 🧪 Testing Strategy

- **Backend:** Uses `Jest` and `Supertest` for API endpoint testing.
- **Frontend:** Uses `Vitest` and `React Testing Library` for component and smoke tests.
- **CI:** GitHub Actions automatically runs linting and tests on every Pull Request.
