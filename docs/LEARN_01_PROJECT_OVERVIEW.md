# 📘 Learn Aqua-AI — Part 1: Project Overview & Architecture

## What is Aqua-AI?

Aqua-AI is an **AI-powered water quality monitoring platform** built specifically for **India**. It solves a real problem — India has thousands of rivers, lakes, and groundwater sources, but monitoring water quality across such a vast country is extremely difficult.

### The Problem We Solve

- India's **Central Pollution Control Board (CPCB)** and **State Pollution Control Boards** collect water quality data, but it's scattered across multiple government portals and hard to access.
- Citizens and officials have **no easy way** to see real-time pollution levels or get warned about contamination.
- There's **no predictive system** to warn communities _before_ pollution events happen.

### Our Solution

Aqua-AI brings together:
1. **Government data** from CPCB and data.gov.in (official water quality readings)
2. **Machine learning models** that predict future pollution events
3. **Interactive maps and dashboards** so anyone can visualize water quality across India
4. **Alerts system** that warns about dangerous pollution levels

---

## 🏗️ High-Level Architecture

The platform has **4 major components** that work together:

```
┌─────────────────────────────────────────────────────────┐
│                    👤 USER (Browser)                     │
│                    React Frontend (Vite)                 │
│    Dashboard │ Map │ Analytics │ Alerts │ Settings       │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTP (Axios)
                      ▼
┌─────────────────────────────────────────────────────────┐
│                 🖥️ BACKEND (Node.js/Express)             │
│    Auth │ Water Quality │ Locations │ Alerts Routes      │
│    JWT Auth │ Rate Limiting │ Validation │ Security      │
└────────┬────────────────────────┬───────────────────────┘
         │ Knex.js / Supabase     │
         ▼                        │
┌────────────────────┐            │
│  🗄️ PostgreSQL      │            │
│  + PostGIS          │            │
│  (Supabase hosted)  │            │
└────────────────────┘            │
                                  │
┌─────────────────────────────────┴───────────────────────┐
│              🐍 PYTHON LAYER                             │
│  ┌──────────────────┐  ┌───────────────────────────┐    │
│  │ Data Pipeline     │  │ AI Models                  │    │
│  │ (fetch_data.py)   │  │ (train_model.py)          │    │
│  │ Fetches from      │  │ Random Forest             │    │
│  │ data.gov.in/CPCB  │  │ Gradient Boosting         │    │
│  └──────────────────┘  │ Neural Networks            │    │
│                         └───────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### How Data Flows Through the System

1. **Data Pipeline** (`data-pipeline/fetch_data.py`) fetches water quality readings from Indian government APIs (data.gov.in, CPCB).
2. The data is cleaned, normalized, and stored in **PostgreSQL** (hosted on Supabase).
3. **AI Models** (`ai-models/train_model.py`) read this data and train prediction models.
4. The **Backend** (Node.js/Express) serves this data through REST API endpoints.
5. The **Frontend** (React) fetches data from the backend and displays it via dashboards, maps, and charts.

---

## 🛠️ Technology Stack Explained

### Frontend (What the User Sees)

| Technology | What it Does | Why We Use It |
|-----------|-------------|---------------|
| **React 18** | UI library | Component-based, efficient rendering with virtual DOM |
| **TypeScript** | Type-safe JavaScript | Catches bugs at compile time, better code quality |
| **Vite** | Build tool & dev server | Extremely fast hot-reload during development |
| **Tailwind CSS** | Utility-first CSS | Rapid UI design without writing custom CSS |
| **Leaflet/Mapbox** | Interactive maps | Display monitoring stations on India's map |
| **Recharts** | React charting library | Visualize water quality trends and analytics |
| **Axios** | HTTP client | Make API calls to the backend |

### Backend (Server Logic)

| Technology | What it Does | Why We Use It |
|-----------|-------------|---------------|
| **Node.js** | JavaScript runtime | Run JavaScript on the server |
| **Express.js** | Web framework | Handle HTTP routes, middleware, and APIs |
| **JWT (jsonwebtoken)** | Authentication tokens | Secure, stateless user authentication |
| **bcryptjs** | Password hashing | Securely store user passwords |
| **Helmet** | Security headers | Protect against common web vulnerabilities |
| **express-validator** | Input validation | Validate and sanitize user input |
| **express-rate-limit** | Rate limiting | Prevent abuse and DDoS attacks |
| **Winston** | Logging | Structured, leveled logging for debugging |
| **Knex.js** | SQL query builder | Write database queries in JavaScript |
| **Supabase JS** | Database client | Interact with Supabase (managed PostgreSQL) |

### Database

| Technology | What it Does | Why We Use It |
|-----------|-------------|---------------|
| **PostgreSQL** | Relational database | Industry-standard, reliable, supports complex queries |
| **PostGIS** | Spatial extension | Geographic queries (find stations within X km) |
| **Supabase** | Managed Postgres | Free-tier hosting, built-in REST API, real-time features |

### AI/ML (Python)

| Technology | What it Does | Why We Use It |
|-----------|-------------|---------------|
| **Scikit-Learn** | ML library | Random Forest, Gradient Boosting models |
| **TensorFlow/Keras** | Deep learning | Neural networks for complex pattern recognition |
| **Pandas** | Data manipulation | Clean and transform tabular data |
| **NumPy** | Numerical computing | Mathematical operations on arrays |

### Infrastructure

| Technology | What it Does | Why We Use It |
|-----------|-------------|---------------|
| **Docker** | Containerization | Package app with all dependencies |
| **Docker Compose** | Multi-container orchestration | Run all services (DB, backend, frontend, AI) together |
| **GitHub Actions** | CI/CD automation | Auto-test code, lint, and deploy on every push |

---

## 📂 Project Folder Structure

```
aqua-ai/
├── frontend/              # React SPA (Single Page Application)
│   ├── src/
│   │   ├── App.tsx        # Main app component with routing
│   │   ├── pages/         # Full page components (Dashboard, Map, etc.)
│   │   ├── components/    # Reusable UI components
│   │   ├── services/      # API client (api.ts)
│   │   └── styles/        # CSS files
│   ├── vite.config.ts     # Vite bundler configuration
│   └── package.json       # Frontend dependencies
│
├── backend/               # Node.js REST API
│   ├── src/
│   │   ├── server.js      # Express app setup & middleware chain
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/        # Database models (User.js)
│   │   ├── db/            # Database connection logic
│   │   └── utils/         # Logger, helpers
│   ├── database/          # SQL schema & migrations
│   └── package.json       # Backend dependencies
│
├── ai-models/             # Python ML pipeline
│   └── train_model.py     # Model training script
│
├── data-pipeline/         # Python ETL (Extract-Transform-Load)
│   ├── fetch_data.py      # Main data fetching script
│   └── config.py          # API keys, thresholds, Indian water bodies
│
├── docker-compose.yml     # Run all services together
├── .github/workflows/     # CI/CD pipeline configuration
└── package.json           # Root-level scripts (npm run dev, etc.)
```

---

## 🔑 Key Concepts You Must Know

### 1. REST API
A **RESTful API** is an interface that uses HTTP methods (GET, POST, PUT, DELETE) to perform operations on resources. Our backend exposes endpoints like:
- `GET /api/water-quality` → Get water quality readings
- `POST /api/auth/register` → Register a new user
- `GET /api/locations` → Get monitoring station locations

### 2. JWT (JSON Web Token)
After a user logs in, the server generates a **JWT token**. This token:
- Is sent back to the frontend
- Gets included in every subsequent request as `Authorization: Bearer <token>`
- Contains the user's `id`, `email`, and `role` (encoded, not encrypted)
- Expires after 7 days (configurable)

### 3. Middleware
In Express.js, **middleware** are functions that execute in a chain before the actual route handler. Our middleware chain:
```
Request → Helmet (Security) → CORS → Rate Limit → Auth → Validation → Route Handler → Response
```

### 4. Supabase
**Supabase** is an open-source alternative to Firebase. We use it as:
- A managed PostgreSQL database (no need to manage our own DB server)
- The Supabase JS client for some queries (especially foreign-key joins)
- Knex.js for more complex aggregation queries

### 5. PostGIS
An extension to PostgreSQL that adds **geographic objects** support. For example:
- Store each monitoring station as a `POINT(longitude, latitude)`
- Query: "Find all stations within 50km of Delhi"
- This uses the `GEOMETRY` column type and spatial indexes

### 6. Docker Compose
Instead of manually starting the database, backend, frontend, and AI pipeline separately, Docker Compose lets you run **one command** to start everything:
```bash
docker-compose up
```
This spins up 5 services: PostgreSQL, Backend, Frontend, AI Pipeline, and Redis.

---

## 📊 What the Water Quality Parameters Mean

Our platform monitors **8 key parameters**:

| Parameter | Full Name | What it Measures | Safe Limit |
|-----------|-----------|-----------------|------------|
| **BOD** | Biochemical Oxygen Demand | Organic pollution — how much oxygen bacteria need to decompose organic matter | ≤ 3 mg/L |
| **TDS** | Total Dissolved Solids | Overall water purity — dissolved minerals, salts, metals | ≤ 500 mg/L |
| **pH** | pH Level | Acidity/alkalinity of water (7 is neutral) | 6.5 – 8.5 |
| **DO** | Dissolved Oxygen | Oxygen available for fish and aquatic life (higher = better) | ≥ 6 mg/L |
| **Lead** | Lead (Pb) | Heavy metal contamination — toxic even in small amounts | ≤ 0.01 mg/L |
| **Mercury** | Mercury (Hg) | Highly toxic heavy metal from industrial discharge | ≤ 0.001 mg/L |
| **Coliform** | Coliform Count | Bacterial contamination from sewage/waste | ≤ 2.2 MPN/100ml |
| **Nitrates** | Nitrates (NO₃) | Agricultural runoff — fertilizer contamination | ≤ 45 mg/L |

### Risk Levels
Each reading is classified into one of 4 risk levels:
- **🟢 Low** — Within safe limits, water is clean
- **🟡 Medium** — Approaching concern, needs monitoring
- **🔴 High** — Exceeds safe limits, potential health risk
- **⚫ Critical** — Severely polluted, immediate action needed

---

## Next Steps

Continue to:
- **Part 2**: [Backend Deep Dive](./LEARN_02_BACKEND.md) — How the Express server works
- **Part 3**: [Frontend Deep Dive](./LEARN_03_FRONTEND.md) — How the React UI works
- **Part 4**: [Database & Schema](./LEARN_04_DATABASE.md) — PostgreSQL + PostGIS schema
- **Part 5**: [AI/ML Pipeline](./LEARN_05_AI_ML.md) — How the ML models work
- **Part 6**: [Data Pipeline](./LEARN_06_DATA_PIPELINE.md) — How we fetch government data
- **Part 7**: [DevOps & Deployment](./LEARN_07_DEVOPS.md) — Docker, CI/CD, deployment
- **Part 8**: [Hackathon Presentation Guide](./LEARN_08_PRESENTATION.md) — What to say in your demo
