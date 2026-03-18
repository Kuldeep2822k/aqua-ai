# 📘 Learn Aqua-AI — Part 7: DevOps & Deployment

## Docker — What & Why

**Docker** packages your application and ALL its dependencies into a standardized unit called a **container**. Think of it as a lightweight virtual machine.

**Why we use Docker:**
- "Works on my machine" → "Works everywhere"
- No need to install Node.js, Python, PostgreSQL separately
- One command (`docker-compose up`) starts everything

---

## Docker Compose (`docker-compose.yml`)

We have **5 services** defined:

### 1. Database Service (PostgreSQL + PostGIS)
```yaml
database:
  image: postgis/postgis:14-3.2   # Pre-built image from Docker Hub
  environment:
    POSTGRES_DB: aqua_ai_db
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: aqua_ai_password
  ports:
    - '5432:5432'                  # Map host port 5432 → container port 5432
  volumes:
    - postgres_data:/var/lib/postgresql/data  # Persist data across restarts
```
Uses `postgis/postgis` image which includes PostgreSQL + PostGIS extension pre-installed.

### 2. Backend Service (Node.js/Express)
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
  ports:
    - '5000:5000'
  environment:
    DATABASE_URL: postgresql://postgres:password@database:5432/aqua_ai_db
  command: ['sh', '-c', 'npm run migrate && npm start']
  depends_on:
    - database     # Wait for DB to start before backend
```
Note: `@database` refers to the database service by its Docker Compose name — Docker's internal DNS resolves it.

### 3. Frontend Service (React/Vite)
```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  ports:
    - '3000:3000'
  depends_on:
    - backend      # Wait for backend before frontend
```
The frontend Dockerfile:
1. Builds the React app (produces static HTML/JS/CSS in `dist/`)
2. Serves it via **nginx** web server
3. nginx also proxies `/api` requests to the backend

### 4. AI Pipeline Service (Python)
```yaml
ai-pipeline:
  build:
    context: .
    dockerfile: ai-models/Dockerfile
  environment:
    DATABASE_URL: postgresql://...@database:5432/aqua_ai_db
    DATA_GOV_IN_API_KEY: ${DATA_GOV_IN_API_KEY}
  command: ['python', '/app/data-pipeline/fetch_data.py']
```
Runs the data pipeline to fetch and store water quality data.

### 5. Redis (Optional Caching)
```yaml
redis:
  image: redis:7-alpine
  ports:
    - '6379:6379'
```
For future use — caching frequently accessed API responses.

---

## How to Run with Docker

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode (background)
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend

# Rebuild a specific service
docker-compose build backend
```

---

## CI/CD Pipeline (GitHub Actions)

Located in `.github/workflows/ci.yml`, it runs automatically on every push/PR.

### What the Pipeline Does

```
Push/PR to GitHub
       │
       ▼
┌──────────────────┐
│   Lint Stage      │
│  ├─ Hadolint     │  ← Lint Dockerfiles
│  ├─ Yamllint     │  ← Lint YAML files
│  └─ Prettier     │  ← Check code formatting
└──────────────────┘
       │
       ▼
┌──────────────────┐
│   Test Stage      │
│  ├─ Backend tests │  ← Jest + Supertest (with Postgres service)
│  └─ Frontend tests│  ← Vitest + React Testing Library
└──────────────────┘
       │
       ▼
┌──────────────────┐
│   Build Stage     │
│  ├─ Backend build │  ← Verify it compiles
│  └─ Frontend build│  ← Vite production build
└──────────────────┘
```

### Postgres Service Container
The CI pipeline spins up a **real PostgreSQL database** for backend tests:
```yaml
services:
  postgres:
    image: postgres:14
    env:
      POSTGRES_DB: test_db
      POSTGRES_PASSWORD: test_password
    ports:
      - 5432:5432
```
This means backend tests run against a real database, not mocks.

---

## Deployment Options

### Option 1: Render (Current Setup)
- Backend deployed as a **Web Service** on Render
- Frontend deployed on **Vercel** (or also Render)
- Database on **Supabase** (managed PostgreSQL)
- Configuration file: `render.yaml`

### Option 2: Docker (Self-Hosted)
```bash
docker-compose up -d
```
Runs everything on a single server.

### Option 3: Vercel + Supabase
- Frontend: `vercel.json` configures Vercel deployment
- Backend: Deployed as Vercel serverless function (the `api/` folder)
- Database: Supabase

---

## Environment Variables Reference

| Variable | Service | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Backend, Pipeline | PostgreSQL connection string |
| `SUPABASE_URL` | Backend | Supabase project URL |
| `SUPABASE_ANON_KEY` | Backend | Supabase anonymous key |
| `JWT_SECRET` | Backend | Secret for signing JWT tokens |
| `PORT` | Backend | Server port (default 5000) |
| `NODE_ENV` | Backend | Environment (development/production) |
| `FRONTEND_URL` | Backend | Frontend URL for CORS |
| `DATA_GOV_IN_API_KEY` | Pipeline | data.gov.in API key |
| `CPCB_API_KEY` | Pipeline | CPCB dataset API key |
| `WEATHER_API_KEY` | Pipeline | OpenWeatherMap API key |
| `VITE_API_URL` | Frontend | Backend API URL |
| `ALLOW_SAMPLE_DATA` | Pipeline | Enable synthetic data |

---

## Testing Strategy

### Backend Tests (`backend/tests/`)
- **Framework:** Jest + Supertest
- **What they test:** API endpoints return correct status codes and data format
- **Run command:** `npm run backend:test`

### Frontend Tests (`frontend/src/__tests__/`)
- **Framework:** Vitest + React Testing Library
- **What they test:** Components render correctly, buttons work
- **Run command:** `npm run frontend:test`

### Running All Tests
```bash
npm test   # Runs frontend + backend tests sequentially
```

---

## Dependabot (Automated Dependency Updates)
GitHub Dependabot automatically:
- Checks for outdated npm packages
- Creates pull requests to update them
- Configuration: `.github/dependabot.yml`

---

## Next Steps

Continue to:
- **Part 8**: [Hackathon Presentation Guide](./LEARN_08_PRESENTATION.md) — What to say in your demo
