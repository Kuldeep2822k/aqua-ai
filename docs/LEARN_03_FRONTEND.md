# 📘 Learn Aqua-AI — Part 3: Frontend Deep Dive

## Frontend Architecture

The frontend is a **React Single Page Application (SPA)** built with **TypeScript** and **Vite**.

---

## Entry Point: `App.tsx`

The main component manages:

1. **Page navigation** (Dashboard, Map, Alerts, Analytics, Settings)
2. **Theme management** (light/dark/auto)
3. **Lazy loading** (pages load only when needed)

```typescript
// Pages are loaded lazily — they don't download until the user navigates to them
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MapViewPage = lazy(() => import('./pages/MapViewPage'));
const AlertsPage = lazy(() => import('./pages/AlertsPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
```

**Why lazy loading?** If you load all pages at startup, the initial bundle size is huge and the first paint is slow. With lazy loading, the user only downloads the code for the page they're viewing.

**Navigation** uses simple state — no React Router is needed because we're not using URL-based routing:

```typescript
const [currentPage, setCurrentPage] = useState<
  'dashboard' | 'map' | 'alerts' | 'analytics' | 'settings'
>('dashboard');
```

**Dark Mode** works by:

1. Checking the user's system preference via `window.matchMedia('(prefers-color-scheme: dark)')`
2. Adding/removing the `dark` class on `<html>` element
3. Tailwind CSS then applies dark-mode styles via `dark:bg-gray-900` etc.

---

## The 5 Pages

### 1. Dashboard (`pages/Dashboard.tsx`)

The main landing page that shows:

- **MetricsCards** — Summary stats (total readings, active alerts, etc.)
- **MapView** — A mini map showing monitoring stations
- **RecentAlerts** — Latest active alerts
- **RiskHotspots** — Locations with highest pollution
- **QuickActions** — Shortcuts to navigate to other pages

### 2. MapViewPage (`pages/MapViewPage.tsx`)

Full-screen interactive map of India showing:

- All monitoring stations as markers
- Color-coded by risk level (green/yellow/red/black)
- Click a marker to see latest readings for that station
- Uses **Leaflet** (open-source map library) with OpenStreetMap tiles

### 3. AlertsPage (`pages/AlertsPage.tsx`)

A filterable, sortable list of all water quality alerts:

- Filter by status (active/resolved/dismissed)
- Filter by severity (low/medium/high/critical)
- Filter by date range and parameter
- Shows total count, severity distribution chart

### 4. AnalyticsPage (`pages/AnalyticsPage.tsx`)

Data visualization dashboard:

- **Recharts** based charts showing trends over time
- Filter by state, parameter, and date range
- Comparison views across different locations
- Risk level distribution pie charts

### 5. SettingsPage (`pages/SettingsPage.tsx`)

User preferences:

- Theme selection (light/dark/auto)
- Notification preferences
- Account settings

---

## Key Components

### Header (`components/Header.tsx`)

The main navigation bar at the top. Contains:

- Logo and app name
- Navigation buttons for each page
- Theme toggle button (sun/moon icon)
- Responsive — collapses to hamburger menu on mobile

### MapView (`components/MapView.tsx`)

The Leaflet-based map component. Key concepts:

- Uses `react-leaflet` for React integration
- Fetches GeoJSON data from `/api/locations/geojson`
- Each marker is color-coded based on the location's risk level
- Clicking a marker shows a popup with the station's details

### MetricsCards (`components/MetricsCards.tsx`)

Displays summary statistics in card format:

- Total monitoring locations
- Total water quality readings
- Active alerts count
- Average water quality score

### RecentAlerts (`components/RecentAlerts.tsx`)

Shows the latest active alerts with:

- Severity badge (color-coded)
- Location name and state
- Parameter that triggered the alert
- When the alert was triggered

### ErrorBoundary (`components/ErrorBoundary.tsx`)

A React error boundary that:

- Catches JavaScript errors in child components
- Displays a fallback UI instead of crashing the whole app
- Logs the error for debugging

---

## The API Service (`services/api.ts`)

This is the **single point of contact** between the frontend and backend.

### Setup

```typescript
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90000, // 90 seconds (for Render cold starts)
});
```

**How the URL is resolved:**

- In **development**: `http://localhost:5000/api` (frontend on 5173, backend on 5000)
- In **production**: `/api` (frontend and backend served from same domain via reverse proxy)

### TypeScript Interfaces

The file defines strict types for all API responses:

```typescript
export interface WaterQualityReading {
  id: number;
  location_id: number;
  location_name: string;
  state: string;
  parameter: string; // e.g., "BOD", "pH"
  parameter_code: string;
  value: number;
  unit: string;
  measurement_date: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  quality_score: number | null;
}
```

**Why TypeScript interfaces?** They ensure:

1. Your code knows exactly what shape the API response will be
2. You get autocomplete in your editor
3. You catch bugs before runtime (e.g., accessing `data.locaiton_name` → compile error)

### API Functions

The service is organized into groups:

```typescript
// Locations
locationsApi.getAll(); // Get all stations
locationsApi.getGeoJSON(); // Get stations as GeoJSON for map
locationsApi.getStats(); // Get station statistics
locationsApi.getById(id); // Get specific station

// Water Quality
waterQualityApi.getReadings(params); // Get readings with filters
waterQualityApi.getAllReadings(params); // Get ALL readings (auto-paginates)
waterQualityApi.getStats(); // Get aggregate statistics
waterQualityApi.getParameters(); // Get list of parameters

// Alerts
alertsApi.getAll(params); // Get all alerts
alertsApi.getActive(params); // Get active alerts only
alertsApi.getStats(params); // Get alert statistics

// Health
healthApi.check(); // Check if backend is running
```

### Auto-Pagination

The `getAllReadings()` function automatically handles pagination:

```typescript
// It fetches 1000 records at a time, up to 50 pages
// Between each page, it waits 150ms to avoid overloading the server
while (page < maxPages) {
  const res = await waterQualityApi.getReadings({
    ...params,
    limit: 1000,
    offset,
  });
  all.push(...res.data);
  if (!res.pagination?.hasMore) break;
  offset += 1000;
  await sleep(150);
}
```

### Error Handling

The API interceptor formats all errors consistently:

```typescript
api.interceptors.response.use(
  (response) => response, // Success: pass through
  (error) => {
    // Format error message based on status code
    // 429 → "Too many requests"
    // 400 with validation details → Show specific field errors
    // Other → Show server error message
    return Promise.reject(error);
  }
);
```

---

## Styling with Tailwind CSS

The frontend uses **Tailwind CSS** — a utility-first CSS framework.

Instead of writing custom CSS classes, you compose styles with utility classes:

```html
<!-- Traditional CSS approach -->
<div class="alert-card">...</div>
<!-- requires separate .alert-card CSS -->

<!-- Tailwind approach -->
<div class="p-4 bg-red-100 border-l-4 border-red-500 rounded-lg shadow-md">
  ...
</div>
```

Common Tailwind patterns used in the project:

| Pattern                          | Meaning                          |
| -------------------------------- | -------------------------------- |
| `p-4`                            | Padding: 1rem (16px)             |
| `bg-gray-50`                     | Background color: light gray     |
| `dark:bg-gray-900`               | Dark mode: dark gray background  |
| `text-sm`                        | Font size: small                 |
| `font-semibold`                  | Font weight: semi-bold           |
| `rounded-lg`                     | Border radius: large             |
| `shadow-md`                      | Box shadow: medium               |
| `flex items-center`              | Flexbox: center items vertically |
| `grid grid-cols-3`               | CSS Grid: 3 columns              |
| `transition-colors duration-200` | Smooth color transitions         |

---

## Vite Configuration (`vite.config.ts`)

Vite is the build tool. Key settings:

- **Dev server** runs on port 5173 with hot module replacement (HMR)
- **Build** outputs to `dist/` folder
- **TypeScript** is compiled automatically
- **Tailwind CSS** is processed via PostCSS

---

## How Frontend and Backend Connect

```
Frontend (localhost:5173)           Backend (localhost:5000)
         │                                    │
         │  GET /api/water-quality?state=UP   │
         │ ─────────────────────────────────> │
         │                                    │ Query PostgreSQL
         │                                    │ Process results
         │  { success: true, data: [...] }    │
         │ <───────────────────────────────── │
         │                                    │
         │  Display data in React components  │
```

In **development**, these are separate processes. In **production** (Docker), nginx serves the frontend AND proxies `/api` requests to the backend.

---

## Next Steps

Continue to:

- **Part 4**: [Database & Schema](./LEARN_04_DATABASE.md) — PostgreSQL tables and triggers
- **Part 5**: [AI/ML Pipeline](./LEARN_05_AI_ML.md) — How the ML models work
