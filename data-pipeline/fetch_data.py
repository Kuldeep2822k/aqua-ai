"""
Main data fetching script for Aqua-AI
Fetches water quality data from various government sources
"""
import asyncio
import aiohttp
import sqlite3
import json
import logging
import os
import uuid
from urllib.parse import urlparse
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import random
import pandas as pd
import numpy as np
from pathlib import Path
from dateutil import parser as date_parser
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import re

from config import GOVERNMENT_APIS, WATER_QUALITY_PARAMETERS, INDIAN_WATER_BODIES, DB_CONFIG

# Setup logging
_script_dir = Path(__file__).parent
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(_script_dir / "fetch_debug.log", encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class WaterQualityDataFetcher:
    """Main class for fetching water quality data from various sources"""
    
    def __init__(self, db_path: str = "water_quality_data.db"):
        self.db_path = db_path
        self.session = None
        self.use_postgres = True # Flag to toggle Postgres usage
        self.run_id = os.getenv("AQUA_RUN_ID") or uuid.uuid4().hex
        self.allow_sample_data = os.getenv("ALLOW_SAMPLE_DATA", "false").lower() == "true"
        self.setup_database()
    
    def get_postgres_connection(self):
        """Get PostgreSQL database connection"""
        from urllib.parse import unquote
        try:
            database_url = os.getenv("DATABASE_URL")
            
            # Support for individual Supabase connection parameters (avoids URL encoding issues)
            supabase_host = os.getenv("SUPABASE_HOST")
            supabase_password = os.getenv("SUPABASE_PASSWORD")
            supabase_user = os.getenv("SUPABASE_USER", "postgres")
            supabase_port = int(os.getenv("SUPABASE_PORT", "5432"))
            supabase_database = os.getenv("SUPABASE_DATABASE", "postgres")
            
            if supabase_host and supabase_password:
                logger.info(f"[run_id={self.run_id}] Connecting via individual SUPABASE_* params")
                return psycopg2.connect(
                    host=supabase_host,
                    port=supabase_port,
                    database=supabase_database,
                    user=supabase_user,
                    password=supabase_password,
                    sslmode='require'
                )
            
            if database_url:
                clean_url = database_url.strip(" '\"")
                if clean_url.startswith("DATABASE_URL="):
                    clean_url = clean_url.replace("DATABASE_URL=", "", 1).strip(" '\"")
                logger.info(f"[run_id={self.run_id}] Connecting via DATABASE_URL string natively")
                return psycopg2.connect(clean_url, sslmode='require')
            return psycopg2.connect(
                host=DB_CONFIG.host,
                port=DB_CONFIG.port,
                database=DB_CONFIG.database,
                user=DB_CONFIG.username,
                password=DB_CONFIG.password
            )
        except Exception as e:
            logger.error(
                f"[run_id={self.run_id}] Failed to connect to PostgreSQL: {e}"
            )
            return None

    def setup_database(self):
        """Initialize database (Postgres or SQLite fallback)"""
        if self.use_postgres:
            conn = self.get_postgres_connection()
            if conn:
                logger.info(
                    f"[run_id={self.run_id}] Connected to PostgreSQL database "
                    f"(host={DB_CONFIG.host} port={DB_CONFIG.port} db={DB_CONFIG.database} user={DB_CONFIG.username})"
                )
                # We assume schema is managed by backend migrations (Knex)
                # But we can verify if tables exist if needed
                conn.close()
                return
            else:
                logger.warning(
                    f"[run_id={self.run_id}] Falling back to SQLite due to connection failure"
                )
                self.use_postgres = False

        # SQLite Fallback
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Create tables
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS water_quality_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                location_name TEXT NOT NULL,
                state TEXT NOT NULL,
                district TEXT,
                latitude REAL,
                longitude REAL,
                parameter TEXT NOT NULL,
                value REAL NOT NULL,
                unit TEXT,
                measurement_date DATE NOT NULL,
                source TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                state TEXT NOT NULL,
                district TEXT,
                latitude REAL,
                longitude REAL,
                water_body_type TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS data_sources (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT UNIQUE NOT NULL,
                api_url TEXT,
                last_fetch TIMESTAMP,
                status TEXT DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        logger.info(
            f"[run_id={self.run_id}] SQLite database initialized successfully (db_path={self.db_path})"
        )
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def fetch_data_gov_in(self) -> List[Dict[str, Any]]:
        """Fetch data from data.gov.in API"""
        logger.info(f"[run_id={self.run_id}] Fetching data from data.gov.in")
        
        if not GOVERNMENT_APIS["data_gov_in"].api_key:
            if not self.allow_sample_data:
                raise RuntimeError(
                    "DATA_GOV_IN_API_KEY is required when ALLOW_SAMPLE_DATA is false"
                )
            logger.warning(
                f"[run_id={self.run_id}] No API key for data.gov.in, using sample data"
            )
            return self._generate_sample_data("data_gov_in")
        
        try:
            # API call using Resource ID
            url = f"{GOVERNMENT_APIS['data_gov_in'].base_url}{GOVERNMENT_APIS['data_gov_in'].resource_id}"
            limit = int(os.getenv("DATA_GOV_IN_LIMIT", "1000"))
            headers = {
                "Accept": "application/json",
                "User-Agent": "Aqua-AI/1.0",
                "X-Api-Key": GOVERNMENT_APIS["data_gov_in"].api_key,
            }

            all_processed = []
            offset = 0
            total = None
            max_pages = int(os.getenv("DATA_GOV_IN_MAX_PAGES", "50"))
            page = 0

            while page < max_pages:
                params = {
                    "api-key": GOVERNMENT_APIS["data_gov_in"].api_key,
                    "api_key": GOVERNMENT_APIS["data_gov_in"].api_key,
                    "format": "json",
                    "limit": limit,
                    "offset": offset,
                }

                async with self.session.get(url, params=params, headers=headers) as response:
                    if response.status != 200:
                        response_text = (await response.text())[:500]
                        logger.error(
                            f"[run_id={self.run_id}] API request failed: {response.status} body={response_text}"
                        )
                        if not self.allow_sample_data:
                            raise RuntimeError(
                                f"data.gov.in request failed with status {response.status}: {response_text}"
                            )
                        return self._generate_sample_data("data_gov_in")

                    data = await response.json()
                    processed = self._process_data_gov_in(data)
                    all_processed.extend(processed)

                    try:
                        total = int(data.get("total")) if data.get("total") is not None else total
                    except (ValueError, TypeError):
                        pass

                    page_count = data.get("count")
                    if page_count is None:
                        page_count = len(data.get("records") or [])
                    try:
                        page_count = int(page_count)
                    except (ValueError, TypeError):
                        page_count = len(data.get("records") or [])

                    if page_count <= 0:
                        break

                    try:
                        page_limit = int(data.get("limit")) if data.get("limit") is not None else limit
                    except (ValueError, TypeError):
                        page_limit = limit

                    offset += page_limit
                    page += 1

                    if total is not None and offset >= total:
                        break

            return all_processed
        
        except Exception as e:
            logger.error(
                f"[run_id={self.run_id}] Error fetching from data.gov.in: {str(e)}"
            )
            if not self.allow_sample_data:
                raise
            return self._generate_sample_data("data_gov_in")
    
    async def fetch_cpcb_data(self) -> List[Dict[str, Any]]:
        """Fetch data from CPCB (Central Pollution Control Board)"""
        logger.info(f"[run_id={self.run_id}] Fetching data from CPCB")
        
        try:
            # CPCB data fetching logic would go here
            # For now, return sample data
            if not self.allow_sample_data:
                return []
            return self._generate_sample_data("cpcb")
        
        except Exception as e:
            logger.error(f"[run_id={self.run_id}] Error fetching from CPCB: {str(e)}")
            if not self.allow_sample_data:
                raise
            return self._generate_sample_data("cpcb")
    
    async def fetch_weather_data(self, locations: List[Dict]) -> List[Dict[str, Any]]:
        """Fetch weather data for correlation analysis"""
        logger.info(f"[run_id={self.run_id}] Fetching weather data")
        
        if not GOVERNMENT_APIS["weather_api"].api_key:
            logger.warning(
                f"[run_id={self.run_id}] No weather API key, skipping weather data"
            )
            return []
        
        weather_data = []
        
        for location in locations[:5]:  # Limit to 5 locations for demo
            try:
                url = f"{GOVERNMENT_APIS['weather_api'].base_url}weather"
                params = {
                    "lat": location["latitude"],
                    "lon": location["longitude"],
                    "appid": GOVERNMENT_APIS["weather_api"].api_key,
                    "units": "metric"
                }
                
                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        weather_data.append({
                            "location_name": location["name"],
                            "temperature": data["main"]["temp"],
                            "humidity": data["main"]["humidity"],
                            "pressure": data["main"]["pressure"],
                            "wind_speed": data["wind"]["speed"],
                            "weather_condition": data["weather"][0]["main"],
                            "measurement_date": datetime.now().strftime("%Y-%m-%d"),
                            "source": "weather_api"
                        })
            except Exception as e:
                logger.error(
                    f"[run_id={self.run_id}] Error fetching weather data: {str(e)}"
                )
                continue
        
        return weather_data
    
    def _generate_sample_data(self, source: str) -> List[Dict[str, Any]]:
        """Generate sample water quality data for development"""
        if not self.allow_sample_data:
            raise RuntimeError("Sample data generation is disabled")
        logger.info(f"[run_id={self.run_id}] Generating sample data for {source}")
        
        data = []
        np.random.seed(42)
        
        # Generate data for each state and their water bodies
        for state, info in INDIAN_WATER_BODIES.items():
            for river in info["rivers"]:
                # Generate 10-20 readings per river
                num_readings = np.random.randint(10, 21)
                
                for _ in range(num_readings):
                    # Random date within last 30 days
                    days_ago = np.random.randint(0, 30)
                    date = datetime.now() - timedelta(days=days_ago)
                    
                    # Random location along the river
                    base_lat, base_lon = info["coordinates"]
                    lat = base_lat + np.random.uniform(-0.5, 0.5)
                    lon = base_lon + np.random.uniform(-0.5, 0.5)
                    
                    # Generate readings for each parameter
                    for param, config in WATER_QUALITY_PARAMETERS.items():
                        # Generate realistic values based on parameter type
                        if param == "pH":
                            value = np.random.normal(7.0, 1.0)
                        elif param in ["Lead", "Mercury"]:
                            value = np.random.lognormal(-4, 1)
                        elif param == "Coliform":
                            value = np.random.lognormal(2, 1)
                        else:
                            value = np.random.normal(
                                config["safe_limit"] * 0.8, 
                                config["safe_limit"] * 0.3
                            )
                        
                        # Ensure positive values
                        value = max(0.001, value)
                        
                        data.append({
                            "location_name": f"{river} at {state}",
                            "state": state,
                            "district": f"District {np.random.randint(1, 10)}",
                            "latitude": lat,
                            "longitude": lon,
                            "parameter": param,
                            "value": round(value, 3),
                            "unit": config["unit"],
                            "measurement_date": date.strftime("%Y-%m-%d"),
                            "source": "government" if source in ["data_gov_in", "cpcb"] else "sensor"
                        })
        
        return data
    
    def _process_data_gov_in(self, raw_data: Dict) -> List[Dict[str, Any]]:
        """Process raw data from data.gov.in API"""
        logger.info(f"[run_id={self.run_id}] Processing data from data.gov.in")

        if not raw_data or "records" not in raw_data:
            logger.warning(
                f"[run_id={self.run_id}] No records found in data.gov.in response"
            )
            return []

        processed_data = []
        records = raw_data["records"]
        first_record_keys = None
        state_key_by_normalized = {k.lower().strip(): k for k in INDIAN_WATER_BODIES.keys()}
        title = str(raw_data.get("title") or "")
        year_match = re.search(r"(?:19|20)\d{2}", title)
        default_measurement_date = datetime.now().strftime("%Y-%m-%d")
        if year_match:
            default_measurement_date = f"{year_match.group(0)}-01-01"

        # Mapping for fuzzy matching of fields
        # Key: Standardized field name
        # Value: List of potential field names in API response
        field_mapping = {
            "state": ["state", "state_name", "state name"],
            "district": ["district", "district_name", "city"],
            "location": ["location", "location_name", "locations", "station_name", "station", "station_code", "water quality locations", "water_quality_locations"],
            "latitude": ["latitude", "lat"],
            "longitude": ["longitude", "long", "lon"]
        }

        # Parameter mapping
        # Key: Parameter name in WATER_QUALITY_PARAMETERS
        # Value: List of potential field names in API response
        param_mapping = {
            "BOD": [
                "biochemical oxygen demand-mean",
                "biochemical_oxygen_demand-mean",
                "biochemical_oxygen_demand_b_o_d_mg_l__mean",
                "bod",
                "b.o.d",
                "biochemical_oxygen_demand",
                "bod_mg_l",
            ],
            "TDS": [
                "conductivity-mean",
                "conductivity_mhos_cm__mean",
                "tds",
                "total_dissolved_solids",
            ],
            "pH": ["ph-mean", "ph_mean", "ph", "p_h", "ph_level"],
            "DO": [
                "dissolved oxygen-mean",
                "dissolved_oxygen-mean",
                "dissolved_oxygen_d_o_mg_l__mean",
                "do",
                "d.o",
                "dissolved_oxygen",
            ],
            "Lead": ["lead", "pb"],
            "Mercury": ["mercury", "hg"],
            "Coliform": [
                "fecal coliform-mean",
                "fecal_coliform-mean",
                "fecal_coliform_mpn_100ml__mean",
                "total_coliform_mpn_100ml__mean",
                "coliform",
                "total_coliform",
                "fecal_coliform",
            ],
            "Nitrates": [
                "nitrate-mean",
                "nitrate__n_nitrite_n_mg_l__mean",
                "nitrate",
                "nitrates",
                "no3",
            ],
        }

        for record in records:
            try:
                # normalize keys to lowercase for matching
                record_lower = {k.lower(): v for k, v in record.items()}
                if first_record_keys is None:
                    first_record_keys = sorted(list(record_lower.keys()))

                # Extract location info
                state = None
                for key in field_mapping["state"]:
                    if key in record_lower:
                        state = record_lower[key]
                        break
                if isinstance(state, str):
                    state = state.strip().replace('"', '').replace("'", "")
                    state = " ".join(state.split())

                district = None
                for key in field_mapping["district"]:
                    if key in record_lower:
                        district = record_lower[key]
                        break
                if isinstance(district, str):
                    district = district.strip().replace('"', '').replace("'", "")
                    district = " ".join(district.split())

                location_name = None
                for key in field_mapping["location"]:
                    if key in record_lower:
                        location_name = record_lower[key]
                        break
                if isinstance(location_name, str):
                    location_name = location_name.strip().replace('"', '').replace("'", "")
                    location_name = " ".join(location_name.split())

                # Default location name if missing
                if not location_name:
                    if district and state:
                        location_name = f"Station in {district}, {state}"
                    elif state:
                        location_name = f"Station in {state}"
                    else:
                        location_name = "Unknown Location"

                latitude = None
                for key in field_mapping["latitude"]:
                    if key in record_lower:
                        try:
                            latitude = float(record_lower[key])
                        except (ValueError, TypeError):
                            pass
                        break

                longitude = None
                for key in field_mapping["longitude"]:
                    if key in record_lower:
                        try:
                            longitude = float(record_lower[key])
                        except (ValueError, TypeError):
                            pass
                        break

                # If lat/long missing, try to estimate from state (very rough fallback)
                if latitude is None or longitude is None:
                    normalized_state = state.lower().strip() if isinstance(state, str) else None
                    if normalized_state and normalized_state in state_key_by_normalized:
                        state_key = state_key_by_normalized[normalized_state]
                        base_lat, base_lon = INDIAN_WATER_BODIES[state_key]["coordinates"]
                        latitude = base_lat + random.uniform(-0.15, 0.15)
                        longitude = base_lon + random.uniform(-0.15, 0.15)
                    else:
                        base_lat, base_lon = 22.9734, 78.6569
                        latitude = base_lat + random.uniform(-2.0, 2.0)
                        longitude = base_lon + random.uniform(-2.0, 2.0)

                # measurement date
                measurement_date = default_measurement_date
                # Try to find a date field
                for date_key in ["date", "created_date", "updated_date", "timestamp", "measurement_date", "year"]:
                    if date_key in record_lower:
                        try:
                            # Parse date using dateutil which is robust
                            dt = date_parser.parse(str(record_lower[date_key]))
                            measurement_date = dt.strftime("%Y-%m-%d")
                            break
                        except (ValueError, TypeError):
                            continue

                # Extract parameters
                any_parameter_added = False
                for param, potential_keys in param_mapping.items():
                    value = None
                    for key in potential_keys:
                        if key in record_lower:
                            try:
                                val_str = str(record_lower[key]).strip()
                                if val_str and val_str.lower() != "na" and val_str.lower() != "nan":
                                    value = float(val_str)
                                    break
                            except (ValueError, TypeError):
                                continue

                    if value is not None:
                        processed_data.append({
                            "location_name": location_name,
                            "state": state or "Unknown State",
                            "district": district,
                            "latitude": latitude,
                            "longitude": longitude,
                            "parameter": param,
                            "value": value,
                            "unit": WATER_QUALITY_PARAMETERS[param]["unit"],
                            "measurement_date": measurement_date,
                            "source": "government" # Mapped to schema enum
                        })
                        any_parameter_added = True

                if not any_parameter_added:
                    candidate_param = None
                    for key in ["parameter", "param", "parameter_name", "parameter code", "parameter_code", "indicator", "variable"]:
                        if key in record_lower and record_lower[key]:
                            candidate_param = str(record_lower[key]).strip()
                            break

                    candidate_value = None
                    for key in ["value", "val", "result", "reading", "measurement", "measured_value"]:
                        if key in record_lower and record_lower[key] is not None:
                            candidate_value = record_lower[key]
                            break

                    if candidate_param is not None and candidate_value is not None:
                        normalized_param = (
                            candidate_param.lower()
                            .replace("_", " ")
                            .replace("-", " ")
                            .replace(".", " ")
                        )
                        normalized_param = " ".join(normalized_param.split())

                        mapped_param = None
                        if normalized_param in ["bod", "b o d", "biochemical oxygen demand"]:
                            mapped_param = "BOD"
                        elif normalized_param in ["tds", "total dissolved solids", "conductivity"]:
                            mapped_param = "TDS"
                        elif normalized_param in ["ph", "p h", "ph level"]:
                            mapped_param = "pH"
                        elif normalized_param in ["do", "d o", "dissolved oxygen"]:
                            mapped_param = "DO"
                        elif "coliform" in normalized_param:
                            mapped_param = "Coliform"
                        elif "nitrate" in normalized_param or normalized_param == "no3":
                            mapped_param = "Nitrates"
                        elif normalized_param in ["lead", "pb"]:
                            mapped_param = "Lead"
                        elif normalized_param in ["mercury", "hg"]:
                            mapped_param = "Mercury"

                        if mapped_param:
                            try:
                                val_str = str(candidate_value).strip()
                                if val_str and val_str.lower() not in ["na", "nan", "null", "none", ""]:
                                    processed_data.append({
                                        "location_name": location_name,
                                        "state": state or "Unknown State",
                                        "district": district,
                                        "latitude": latitude,
                                        "longitude": longitude,
                                        "parameter": mapped_param,
                                        "value": float(val_str),
                                        "unit": WATER_QUALITY_PARAMETERS[mapped_param]["unit"],
                                        "measurement_date": measurement_date,
                                        "source": "government"
                                    })
                            except (ValueError, TypeError):
                                pass

            except Exception as e:
                logger.warning(f"Error processing record: {str(e)}")
                continue

        if not processed_data:
            logger.warning(
                f"[run_id={self.run_id}] Parsed 0 readings from data.gov.in; first record keys: {first_record_keys}"
            )

        return processed_data
    
    def save_to_database(self, data: List[Dict[str, Any]]):
        """Save fetched data to database (Postgres or SQLite)"""
        if not data:
            logger.warning(f"[run_id={self.run_id}] No data to save")
            return
        
        if self.use_postgres:
            logger.info(
                f"[run_id={self.run_id}] Saving to PostgreSQL (host={DB_CONFIG.host} port={DB_CONFIG.port} db={DB_CONFIG.database})"
            )
            self._save_to_postgres(data)
        else:
            logger.info(f"[run_id={self.run_id}] Saving to SQLite (db_path={self.db_path})")
            self._save_to_sqlite(data)

    def _save_to_postgres(self, data: List[Dict[str, Any]]):
        """Save data to PostgreSQL"""
        conn = self.get_postgres_connection()
        if not conn:
            logger.error(
                f"[run_id={self.run_id}] Could not connect to Postgres to save data"
            )
            return

        try:
            cursor = conn.cursor()

            # Upsert locations (assuming 'locations' table exists and has a unique constraint on name)
            # Note: We might need to adjust this query based on actual schema in backend migrations
            # If tables don't exist, this will fail. We assume backend has run migrations.

            # First ensure locations exist
            locations = {}
            for record in data:
                key = (record["location_name"], record["state"])
                if key not in locations:
                    locations[key] = {
                        "name": record["location_name"],
                        "state": record["state"],
                        "district": record.get("district"),
                        "latitude": record["latitude"],
                        "longitude": record["longitude"],
                        "water_body_type": "river" # Default
                    }

            # Upsert locations and get their IDs
            location_ids = {}
            logger.info(
                f"[run_id={self.run_id}] Upserting {len(locations)} unique locations found in data"
            )
            for location in locations.values():
                cursor.execute("""
                    INSERT INTO locations (name, state, district, latitude, longitude, water_body_type)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (name) DO UPDATE SET
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude
                    RETURNING id
                """, (
                    location["name"],
                    location["state"],
                    location["district"],
                    location["latitude"],
                    location["longitude"],
                    location["water_body_type"]
                ))
                location_id = cursor.fetchone()[0]
                location_ids[(location["name"], location["state"])] = location_id
            
            logger.info(
                f"[run_id={self.run_id}] Successfully upserted/retrieved {len(location_ids)} location IDs"
            )

            # Get parameter IDs
            cursor.execute("SELECT parameter_code, id FROM water_quality_parameters")
            param_map = {row[0]: row[1] for row in cursor.fetchall()}
            logger.info(
                f"[run_id={self.run_id}] Loaded {len(param_map)} parameters from DB: {list(param_map.keys())}"
            )

            # Insert readings using IDs
            logger.info(f"[run_id={self.run_id}] Starting insertion of {len(data)} readings...")
            inserted_count = 0
            for record in data:
                location_key = (record["location_name"], record["state"])
                if location_key not in location_ids:
                    logger.warning(
                        f"[run_id={self.run_id}] Location ID not found for {record['location_name']}"
                    )
                    continue

                param_code = record["parameter"]
                if param_code not in param_map:
                    # Try to match case-insensitive or mapped codes if needed, or skip
                    # For now, skip if unknown parameter code to avoid FK error
                    logger.warning(f"[run_id={self.run_id}] Parameter ID not found for {param_code}")
                    continue

                location_id = location_ids[location_key]
                parameter_id = param_map[param_code]

                cursor.execute("""
                    INSERT INTO water_quality_readings
                    (location_id, parameter_id, value, measurement_date, source)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    location_id,
                    parameter_id,
                    record["value"],
                    record["measurement_date"],
                    record["source"]
                ))
                inserted_count += 1
            
            logger.info(
                f"[run_id={self.run_id}] Finished processing readings. Inserted: {inserted_count}, Skipped: {len(data) - inserted_count}"
            )

            for source_name, api in GOVERNMENT_APIS.items():
                source_type = "government"
                status = "active"
                api_key = api.api_key
                last_error = None

                if source_name == "weather_api":
                    source_type = "sensor"
                    if not api_key:
                        status = "inactive"
                        last_error = "WEATHER_API_KEY missing"
                else:
                    if source_name == "data_gov_in" and not api_key:
                        status = "sample" if self.allow_sample_data else "inactive"
                        last_error = (
                            "DATA_GOV_IN_API_KEY missing"
                            if not self.allow_sample_data
                            else "DATA_GOV_IN_API_KEY missing; using sample data"
                        )

                api_key_hash = (
                    hashlib.sha256(api_key.encode("utf-8")).hexdigest()
                    if api_key
                    else None
                )

                cursor.execute(
                    """
                    INSERT INTO data_sources
                      (name, source_type, api_url, api_key_hash, last_fetch, status, error_count, last_error, updated_at)
                    VALUES
                      (%s, %s, %s, %s, NOW(), %s, 0, %s, NOW())
                    ON CONFLICT (name) DO UPDATE SET
                      api_url = EXCLUDED.api_url,
                      api_key_hash = COALESCE(EXCLUDED.api_key_hash, data_sources.api_key_hash),
                      last_fetch = EXCLUDED.last_fetch,
                      status = EXCLUDED.status,
                      last_error = EXCLUDED.last_error,
                      updated_at = NOW()
                    """,
                    (
                        source_name,
                        source_type,
                        api.base_url,
                        api_key_hash,
                        status,
                        last_error,
                    ),
                )

            conn.commit()
            logger.info(
                f"[run_id={self.run_id}] Transaction committed. Saved {inserted_count} records to PostgreSQL"
            )

        except Exception as e:
            logger.error(f"[run_id={self.run_id}] Error saving to PostgreSQL: {e}")
            conn.rollback()
        finally:
            conn.close()

    def _save_to_sqlite(self, data: List[Dict[str, Any]]):
        """Save fetched data to SQLite"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Insert water quality readings
        for record in data:
            cursor.execute('''
                INSERT OR REPLACE INTO water_quality_readings 
                (location_name, state, district, latitude, longitude, 
                 parameter, value, unit, measurement_date, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                record["location_name"],
                record["state"],
                record.get("district"),
                record["latitude"],
                record["longitude"],
                record["parameter"],
                record["value"],
                record["unit"],
                record["measurement_date"],
                record["source"]
            ))
        
        # Insert unique locations
        locations = {}
        for record in data:
            key = (record["location_name"], record["state"])
            if key not in locations:
                locations[key] = {
                    "name": record["location_name"],
                    "state": record["state"],
                    "district": record.get("district"),
                    "latitude": record["latitude"],
                    "longitude": record["longitude"],
                    "water_body_type": "river"
                }
        
        for location in locations.values():
            cursor.execute('''
                INSERT OR IGNORE INTO locations 
                (name, state, district, latitude, longitude, water_body_type)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                location["name"],
                location["state"],
                location["district"],
                location["latitude"],
                location["longitude"],
                location["water_body_type"]
            ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"[run_id={self.run_id}] Saved {len(data)} records to SQLite")
    
    async def fetch_all_data(self):
        """Fetch data from all sources"""
        logger.info(f"[run_id={self.run_id}] Starting data fetch from all sources")
        
        all_data = []
        
        # Fetch from different sources
        data_gov_data = await self.fetch_data_gov_in()
        cpcb_data = await self.fetch_cpcb_data()
        
        all_data.extend(data_gov_data)
        all_data.extend(cpcb_data)
        
        # Get unique locations for weather data
        locations = []
        seen = set()
        for record in all_data:
            key = (record["location_name"], record["state"])
            if key not in seen:
                locations.append({
                    "name": record["location_name"],
                    "latitude": record["latitude"],
                    "longitude": record["longitude"]
                })
                seen.add(key)
        
        # Fetch weather data
        weather_data = await self.fetch_weather_data(locations)
        
        # Save all data
        self.save_to_database(all_data)
        
        # Save weather data separately (would need weather table)
        logger.info(f"[run_id={self.run_id}] Fetched {len(all_data)} water quality records")
        logger.info(f"[run_id={self.run_id}] Fetched {len(weather_data)} weather records")
        
        return all_data, weather_data

async def main():
    """Main function to run data fetching"""
    async with WaterQualityDataFetcher() as fetcher:
        water_data, weather_data = await fetcher.fetch_all_data()
        
        # Print summary
        print(f"\nData Fetch Summary:")
        print(f"Water Quality Records: {len(water_data)}")
        print(f"Weather Records: {len(weather_data)}")
        print(f"Database: {'PostgreSQL' if fetcher.use_postgres else 'SQLite (water_quality_data.db)'}")
        
        # Show sample data
        if water_data:
            print(f"\nData Preview (First Record):")
            sample = water_data[0]
            sensitive_keys = {"latitude", "longitude"}
            for key, value in sample.items():
                if key in sensitive_keys:
                    print(f"  {key}: [REDACTED]")
                else:
                    print(f"  {key}: {value}")

if __name__ == "__main__":
    asyncio.run(main())
