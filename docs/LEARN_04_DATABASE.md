# 📘 Learn Aqua-AI — Part 4: Database & Schema

## Database Overview

We use **PostgreSQL** with the **PostGIS** extension, hosted on **Supabase** (managed cloud PostgreSQL).

---

## Database Tables (Entity Relationship)

```
┌──────────────┐     ┌──────────────────────────┐     ┌──────────────────────────┐
│   locations   │     │  water_quality_readings    │     │ water_quality_parameters  │
├──────────────┤     ├──────────────────────────┤     ├──────────────────────────┤
│ id (PK)      │◄───┤ location_id (FK)          │     │ id (PK)                  │
│ name (UNIQUE)│     │ parameter_id (FK)─────────┼────►│ parameter_code (UNIQUE)  │
│ state        │     │ value                     │     │ parameter_name           │
│ district     │     │ measurement_date          │     │ unit                     │
│ latitude     │     │ risk_level (ENUM)         │     │ safe_limit               │
│ longitude    │     │ quality_score             │     │ moderate_limit           │
│ water_body   │     │ source (ENUM)             │     │ high_limit               │
│ geom (PostGIS)│    │ is_validated              │     │ critical_limit           │
└──────┬───────┘     └──────────────────────────┘     └──────────────────────────┘
       │
       ├──────────────┐──────────────┐──────────────┐
       ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌───────────────┐
│ ai_predictions│ │  alerts   │ │ weather_data  │ │ water_quality │
│              │ │           │ │               │ │ _index (WQI)  │
│ predicted_val│ │ severity  │ │ temperature   │ │ wqi_score     │
│ confidence   │ │ message   │ │ humidity      │ │ wqi_category  │
│ forecast_hrs │ │ status    │ │ precipitation │ │ parameters    │
└──────────────┘ └──────────┘ └───────────────┘ └───────────────┘
```

---

## Each Table Explained

### 1. `locations` — Monitoring Stations

```sql
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,  -- e.g., "Yamuna at Delhi"
    state VARCHAR(100) NOT NULL,        -- e.g., "Delhi"
    district VARCHAR(100),              -- e.g., "Central Delhi"
    latitude DECIMAL(10, 8) NOT NULL,   -- e.g., 28.61390000
    longitude DECIMAL(11, 8) NOT NULL,  -- e.g., 77.20900000
    water_body_type VARCHAR(50),        -- "river", "lake", "groundwater"
    water_body_name VARCHAR(255),       -- e.g., "Yamuna"
    geom GEOMETRY(POINT, 4326)          -- PostGIS spatial column
);
```

**What is `GEOMETRY(POINT, 4326)`?**

- `POINT` = a single geographic point
- `4326` = SRID (Spatial Reference System Identifier) = WGS 84 (standard GPS coordinates)
- This allows spatial queries like "find all stations within 50km of this point"

**The `CONSTRAINT valid_coordinates`** ensures lat/lon values are valid:

```sql
CONSTRAINT valid_coordinates CHECK (
    latitude BETWEEN -90 AND 90 AND
    longitude BETWEEN -180 AND 180
)
```

### 2. `water_quality_parameters` — Reference Table

```sql
CREATE TABLE water_quality_parameters (
    id SERIAL PRIMARY KEY,
    parameter_code VARCHAR(20) UNIQUE NOT NULL,  -- "BOD", "TDS", "pH"
    parameter_name VARCHAR(255) NOT NULL,         -- "Biochemical Oxygen Demand"
    unit VARCHAR(50) NOT NULL,                    -- "mg/L"
    safe_limit DECIMAL(10, 4),                    -- 3.0 for BOD
    moderate_limit DECIMAL(10, 4),                -- 6.0 for BOD
    high_limit DECIMAL(10, 4),                    -- 10.0 for BOD
    critical_limit DECIMAL(10, 4)                 -- 15.0 for BOD
);
```

This is a **reference table** — it defines what parameters exist and their threshold values. It's pre-populated with 8 parameters (BOD, TDS, pH, DO, Lead, Mercury, Coliform, Nitrates).

### 3. `water_quality_readings` — The Main Data Table

```sql
CREATE TABLE water_quality_readings (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    parameter_id INTEGER REFERENCES water_quality_parameters(id) ON DELETE CASCADE,
    value DECIMAL(12, 6) NOT NULL,
    measurement_date TIMESTAMP NOT NULL,
    source data_source_type DEFAULT 'government',  -- ENUM
    quality_score DECIMAL(5, 2),                   -- 0-100 score
    risk_level risk_level,                          -- ENUM: low/medium/high/critical
    is_validated BOOLEAN DEFAULT FALSE
);
```

**Foreign Keys:**

- `location_id → locations(id)` — Which station took this reading
- `parameter_id → water_quality_parameters(id)` — What was measured
- `ON DELETE CASCADE` — If a location is deleted, all its readings are deleted too

### 4. `alerts` — Pollution Warnings

```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id),
    parameter_id INTEGER REFERENCES water_quality_parameters(id),
    alert_type VARCHAR(50),       -- "threshold_exceeded", "rapid_change"
    severity risk_level NOT NULL, -- low/medium/high/critical
    message TEXT NOT NULL,        -- Human-readable alert text
    threshold_value DECIMAL,     -- The safe limit that was exceeded
    actual_value DECIMAL,        -- The actual measured value
    status alert_status DEFAULT 'active',  -- active/resolved/dismissed
    triggered_at TIMESTAMP
);
```

### 5. `ai_predictions` — ML Model Predictions

Stores future predictions made by the AI models:

- `predicted_value` — What the model predicts the parameter value will be
- `confidence_score` — How confident the model is (0-100%)
- `forecast_hours` — How far into the future the prediction is

### 6. `weather_data` — For Correlation Analysis

Stores weather data (temperature, humidity, rainfall) at each location. This helps the AI model correlate weather patterns with water quality changes. For example, heavy rainfall → increased runoff → higher pollution.

### 7. `water_quality_index` — Composite Score

The Water Quality Index (WQI) combines multiple parameter readings into a single score:

- **Excellent** (90-100): Clean drinking water
- **Good** (70-89): Suitable for most purposes
- **Fair** (50-69): Needs treatment
- **Poor** (25-49): Polluted, limited use
- **Very Poor** (0-24): Severely polluted

---

## Custom ENUMs (Data Types)

PostgreSQL lets you create custom data types:

```sql
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'resolved', 'dismissed');
CREATE TYPE data_source_type AS ENUM ('government', 'community', 'sensor', 'satellite');
```

ENUMs ensure only valid values can be stored — you can't accidentally insert `risk_level = 'danger'`.

---

## Database Triggers (Automatic Calculations)

### Trigger 1: Auto-Update Geometry

When a location's latitude/longitude changes, the PostGIS geometry column auto-updates:

```sql
CREATE FUNCTION update_location_geometry() RETURNS TRIGGER AS $$
BEGIN
    NEW.geom = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

- `ST_MakePoint(lon, lat)` creates a PostGIS POINT from coordinates
- `ST_SetSRID(..., 4326)` sets the spatial reference to WGS 84
- This trigger fires **BEFORE INSERT OR UPDATE** on `locations`

### Trigger 2: Auto-Calculate Risk Level

When a new water quality reading is inserted, the risk level is automatically calculated:

```sql
CREATE FUNCTION calculate_risk_level(param_code VARCHAR, value DECIMAL)
RETURNS risk_level AS $$
BEGIN
    -- Look up thresholds from water_quality_parameters table
    -- Compare value against safe/moderate/high/critical limits
    -- Special handling for pH (range-based) and DO (inverted)
    -- Return appropriate risk level
END;
$$ LANGUAGE plpgsql;
```

**Why DO (Dissolved Oxygen) is special:** Unlike other parameters where higher = worse, for DO, **lower = worse** because fish need dissolved oxygen. So the comparison is inverted — safe limit is the _minimum_ (≥ 6 mg/L is safe).

---

## Database Views (Pre-Built Queries)

Views are saved SQL queries that act like virtual tables:

### `recent_water_quality` — Last 7 Days of Data

```sql
CREATE VIEW recent_water_quality AS
SELECT l.name, l.state, wqp.parameter_name, wqr.value, wqr.risk_level
FROM water_quality_readings wqr
JOIN locations l ON wqr.location_id = l.id
JOIN water_quality_parameters wqp ON wqr.parameter_id = wqp.id
WHERE wqr.measurement_date >= CURRENT_DATE - INTERVAL '7 days';
```

### `active_alerts` — All Unresolved Alerts

### `location_summary` — Station Summary with Active Alert Count

---

## Indexes (Performance Optimization)

Indexes make queries faster by creating lookup structures:

```sql
CREATE INDEX idx_readings_location_date ON water_quality_readings(location_id, measurement_date);
CREATE INDEX idx_readings_risk_level ON water_quality_readings(risk_level);
CREATE INDEX idx_locations_geom ON locations USING GIST (geom);  -- Spatial index
```

**GIST index** is special — it's used for spatial queries (geographic searches). Without it, finding "all stations near Delhi" would scan every row.

---

## Database Migrations (Knex.js)

Instead of running raw SQL, we use **Knex.js migrations** to version-control schema changes:

```bash
# Run all pending migrations
npm run db:migrate

# Create a new migration file
cd backend && npx knex migrate:make add_new_column
```

Each migration has an `up()` (apply) and `down()` (rollback) function. This means you can safely evolve the database schema over time.

---

## Next Steps

Continue to:

- **Part 5**: [AI/ML Pipeline](./LEARN_05_AI_ML.md) — How the ML models work
- **Part 6**: [Data Pipeline](./LEARN_06_DATA_PIPELINE.md) — How we fetch government data
