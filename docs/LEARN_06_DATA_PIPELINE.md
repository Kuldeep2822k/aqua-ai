# 📘 Learn Aqua-AI — Part 6: Data Pipeline

## Overview

The data pipeline (`data-pipeline/fetch_data.py`) is responsible for **extracting water quality data from Indian government APIs**, transforming it into a standard format, and loading it into the database. This is called an **ETL** process (Extract, Transform, Load).

---

## Where Does the Data Come From?

### 1. data.gov.in (Open Government Data Platform)
- India's official open data portal
- Provides water quality datasets collected by government agencies
- API endpoint: `https://api.data.gov.in/resource/{resource_id}`
- Requires an **API key** (free registration)

### 2. CPCB (Central Pollution Control Board)
- India's apex body for pollution monitoring
- Monitors water quality at 4,000+ stations across India
- Data also available through data.gov.in with different resource IDs

### 3. OpenWeatherMap (Weather Correlation)
- Weather data for correlation analysis
- Temperature, humidity, rainfall affect water quality
- API: `https://api.openweathermap.org/data/2.5/weather`

---

## The `WaterQualityDataFetcher` Class

```python
class WaterQualityDataFetcher:
    def setup_database()       # Create tables (SQLite fallback or verify Postgres)
    def fetch_data_gov_in()    # Fetch from data.gov.in
    def fetch_cpcb_data()      # Fetch from CPCB
    def fetch_weather_data()   # Fetch weather for correlation
    def save_to_database()     # Store into Postgres or SQLite
```

---

## Step 1: Database Setup

The fetcher has a **dual database strategy**:

```python
def setup_database(self):
    if self.use_postgres:
        conn = self.get_postgres_connection()
        if conn:
            # Connected to Postgres (Supabase) ✓
            return
        else:
            # Can't connect → fall back to SQLite
            self.use_postgres = False

    # SQLite fallback for local development
    conn = sqlite3.connect(self.db_path)
    cursor.execute('CREATE TABLE IF NOT EXISTS ...')
```

**Why dual database?**
- In production: Uses PostgreSQL (Supabase) — the "real" database
- For local development/offline: Falls back to SQLite — a file-based database that needs no setup

---

## Step 2: Fetching Data from APIs

The `_fetch_from_resource()` method handles paginated API calls:

```python
async def _fetch_from_resource(self, config_key):
    # 1. Check for API key
    if not config.api_key:
        if self.allow_sample_data:
            return self._generate_sample_data()  # Use synthetic data
        raise RuntimeError("API key required!")

    # 2. Paginate through results
    while page < max_pages:
        params = { "api-key": key, "limit": 1000, "offset": offset }
        response = await self.session.get(url, params=params)
        processed = self._process_data_gov_in(response_data)
        all_processed.extend(processed)
        offset += 1000
```

**Key features:**
- **Async HTTP** using `aiohttp` (doesn't block while waiting for API response)
- **Pagination** — fetches 1000 records per page, up to 10 pages
- **Graceful fallback** — if API is down or no key, generates sample data

---

## Step 3: Data Transformation (`_process_data_gov_in`)

Government APIs return data in inconsistent formats. This function standardizes everything:

### Problem: Inconsistent Field Names
Different government datasets use different column names for the same data:
```
Dataset 1: {"state_name": "Delhi", "bod": 4.5}
Dataset 2: {"State": "DELHI", "biochemical_oxygen_demand-mean": 4.5}
Dataset 3: {"state": "delhi", "BOD_mg_l": 4.5}
```

### Solution: Field Mapping
```python
field_mapping = {
    "state": ["state", "state_name", "state name"],
    "location": ["location", "location_name", "station_name", "station_code"],
    "latitude": ["latitude", "lat"],
    "longitude": ["longitude", "long", "lon"]
}

param_mapping = {
    "BOD": ["bod", "b.o.d", "biochemical_oxygen_demand", "bod_mg_l", ...],
    "pH":  ["ph", "p_h", "ph_level", "ph-mean", ...],
    "DO":  ["do", "d.o", "dissolved_oxygen", "dissolved_oxygen_mg_l", ...],
    # ... more mappings for each parameter
}
```

The code tries EACH possible field name until it finds a match. This handles the inconsistency.

### Coordinate Estimation
If latitude/longitude are missing (common in government data), the pipeline estimates them from the state name using a lookup table:
```python
INDIAN_WATER_BODIES = {
    "Uttar Pradesh": { "coordinates": [26.8467, 80.9462] },
    "Delhi":         { "coordinates": [28.7041, 77.1025] },
    "Maharashtra":   { "coordinates": [19.7515, 75.7139] },
    # ... more states
}
```

---

## Step 4: Sample Data Generation

When no API keys are available, the pipeline generates **realistic synthetic data**:

```python
def _generate_sample_data(self, source):
    for state, info in INDIAN_WATER_BODIES.items():
        for river in info["rivers"]:
            for _ in range(num_readings):
                for param, config in WATER_QUALITY_PARAMETERS.items():
                    # Generate realistic values
                    if param == "pH":
                        value = np.random.normal(7.0, 1.0)  # Mean 7, std dev 1
                    elif param in ["Lead", "Mercury"]:
                        value = np.random.lognormal(-4, 1)   # Log-normal for trace elements
```

**Why lognormal for Lead/Mercury?** Heavy metal concentrations in nature follow a **lognormal distribution** — most readings are very low, but occasional spikes can be very high. Using `normal()` would generate unrealistic negative values.

---

## Step 5: Saving to Database

### PostgreSQL (Production)
```python
def _save_to_postgres(self, data):
    # 1. Extract unique locations from data
    # 2. UPSERT each location (insert or update if exists)
    cursor.execute("""
        INSERT INTO locations (name, state, lat, lon)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (name) DO UPDATE SET
            latitude = EXCLUDED.latitude
        RETURNING id
    """)
    # 3. Look up parameter IDs
    # 4. Insert water quality readings
    # 5. Deduplicate using hash(location + parameter + date + value)
```

**`ON CONFLICT ... DO UPDATE`** is PostgreSQL's UPSERT — if a location with the same name already exists, update its coordinates instead of throwing an error.

### SQLite (Local Development)
```python
def _save_to_sqlite(self, data):
    cursor.execute("""
        INSERT INTO water_quality_readings
        (location_name, state, parameter, value, measurement_date)
        VALUES (?, ?, ?, ?, ?)
    """)
```

---

## Configuration (`config.py`)

### API Configs
```python
GOVERNMENT_APIS = {
    "data_gov_in": APIConfig(
        base_url="https://api.data.gov.in/resource/",
        api_key=os.getenv("DATA_GOV_IN_API_KEY"),
        resource_id="19697d76-...",  # Government dataset ID
    ),
    "cpcb": APIConfig(
        base_url="https://api.data.gov.in/resource/",
        resource_id="3b206138-...",  # CPCB dataset ID
    ),
    "weather_api": APIConfig(
        base_url="https://api.openweathermap.org/data/2.5/",
        api_key=os.getenv("WEATHER_API_KEY"),
    )
}
```

### Water Quality Parameter Thresholds
```python
WATER_QUALITY_PARAMETERS = {
    "BOD": {
        "name": "Biochemical Oxygen Demand",
        "unit": "mg/L",
        "safe_limit": 3.0,
        "moderate_limit": 6.0,
        "high_limit": 10.0,
        "critical_limit": 15.0
    },
    # ... same thresholds as the database
}
```

### Indian Water Bodies (10 states covered)
```python
INDIAN_WATER_BODIES = {
    "Uttar Pradesh": {
        "rivers": ["Ganga", "Yamuna", "Gomti", "Ghaghara"],
        "coordinates": [26.8467, 80.9462]
    },
    # ... Delhi, Maharashtra, Karnataka, Tamil Nadu, etc.
}
```

---

## Running the Pipeline

```bash
# Fetch data from government APIs
npm run data:fetch
# or directly:
cd data-pipeline && python fetch_data.py
```

Environment variables needed:
- `DATA_GOV_IN_API_KEY` — Get from https://data.gov.in
- `DATABASE_URL` — PostgreSQL connection string
- `ALLOW_SAMPLE_DATA=true` — Use synthetic data if APIs unavailable

---

## Next Steps

Continue to:
- **Part 7**: [DevOps & Deployment](./LEARN_07_DEVOPS.md) — Docker, CI/CD, deployment
- **Part 8**: [Hackathon Presentation Guide](./LEARN_08_PRESENTATION.md) — What to say in your demo
