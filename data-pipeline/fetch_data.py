"""
Main data fetching script for Aqua-AI
Fetches water quality data from various government sources
"""
import asyncio
import aiohttp
import sqlite3
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import random
import pandas as pd
import numpy as np
from pathlib import Path
from dateutil import parser as date_parser
import psycopg2
from psycopg2.extras import RealDictCursor

from config import GOVERNMENT_APIS, WATER_QUALITY_PARAMETERS, INDIAN_WATER_BODIES, DB_CONFIG

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("data-pipeline/fetch_debug.log", encoding='utf-8'),
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
        self.setup_database()
    
    def get_postgres_connection(self):
        """Get PostgreSQL database connection"""
        try:
            return psycopg2.connect(
                host=DB_CONFIG.host,
                port=DB_CONFIG.port,
                database=DB_CONFIG.database,
                user=DB_CONFIG.username,
                password=DB_CONFIG.password
            )
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            return None

    def setup_database(self):
        """Initialize database (Postgres or SQLite fallback)"""
        if self.use_postgres:
            conn = self.get_postgres_connection()
            if conn:
                logger.info("Connected to PostgreSQL database")
                # We assume schema is managed by backend migrations (Knex)
                # But we can verify if tables exist if needed
                conn.close()
                return
            else:
                logger.warning("Falling back to SQLite due to connection failure")
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
        logger.info("SQLite database initialized successfully")
    
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
        logger.info("Fetching data from data.gov.in")
        
        if not GOVERNMENT_APIS["data_gov_in"].api_key:
            logger.warning("No API key for data.gov.in, using sample data")
            return self._generate_sample_data("data_gov_in")
        
        try:
            # API call using Resource ID
            url = f"{GOVERNMENT_APIS['data_gov_in'].base_url}{GOVERNMENT_APIS['data_gov_in'].resource_id}"
            params = {
                "api-key": GOVERNMENT_APIS["data_gov_in"].api_key,
                "format": "json",
                "limit": 1000
            }
            
            async with self.session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    return self._process_data_gov_in(data)
                else:
                    logger.error(f"API request failed: {response.status}")
                    return self._generate_sample_data("data_gov_in")
        
        except Exception as e:
            logger.error(f"Error fetching from data.gov.in: {str(e)}")
            return self._generate_sample_data("data_gov_in")
    
    async def fetch_cpcb_data(self) -> List[Dict[str, Any]]:
        """Fetch data from CPCB (Central Pollution Control Board)"""
        logger.info("Fetching data from CPCB")
        
        try:
            # CPCB data fetching logic would go here
            # For now, return sample data
            return self._generate_sample_data("cpcb")
        
        except Exception as e:
            logger.error(f"Error fetching from CPCB: {str(e)}")
            return self._generate_sample_data("cpcb")
    
    async def fetch_weather_data(self, locations: List[Dict]) -> List[Dict[str, Any]]:
        """Fetch weather data for correlation analysis"""
        logger.info("Fetching weather data")
        
        if not GOVERNMENT_APIS["weather_api"].api_key:
            logger.warning("No weather API key, skipping weather data")
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
                logger.error(f"Error fetching weather for {location['name']}: {str(e)}")
                continue
        
        return weather_data
    
    def _generate_sample_data(self, source: str) -> List[Dict[str, Any]]:
        """Generate sample water quality data for development"""
        logger.info(f"Generating sample data for {source}")
        
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
        logger.info("Processing data from data.gov.in")

        if not raw_data or "records" not in raw_data:
            logger.warning("No records found in data.gov.in response")
            return []

        processed_data = []
        records = raw_data["records"]

        # Mapping for fuzzy matching of fields
        # Key: Standardized field name
        # Value: List of potential field names in API response
        field_mapping = {
            "state": ["state", "state_name", "state name"],
            "district": ["district", "district_name", "city"],
            "location": ["station", "station_name", "location", "location_name", "water quality locations", "water_quality_locations"],
            "latitude": ["latitude", "lat"],
            "longitude": ["longitude", "long", "lon"]
        }

        # Parameter mapping
        # Key: Parameter name in WATER_QUALITY_PARAMETERS
        # Value: List of potential field names in API response
        param_mapping = {
            "BOD": ["biochemical oxygen demand-mean", "biochemical_oxygen_demand-mean", "bod", "b.o.d", "biochemical_oxygen_demand", "bod_mg_l"],
            "TDS": ["conductivity-mean", "conductivity-mean", "tds", "total_dissolved_solids"], # Map Conductivity to TDS as proxy
            "pH": ["ph-mean", "ph-mean", "ph", "p_h", "ph_level"],
            "DO": ["dissolved oxygen-mean", "dissolved_oxygen-mean", "do", "d.o", "dissolved_oxygen"],
            "Lead": ["lead", "pb"],
            "Mercury": ["mercury", "hg"],
            "Coliform": ["fecal coliform-mean", "fecal_coliform-mean", "coliform", "total_coliform", "fecal_coliform"],
            "Nitrates": ["nitrate-mean", "nitrate-mean", "nitrate", "nitrates", "no3"]
        }

        for record in records:
            try:
                # normalize keys to lowercase for matching
                record_lower = {k.lower(): v for k, v in record.items()}

                # Extract location info
                state = None
                for key in field_mapping["state"]:
                    if key in record_lower:
                        state = record_lower[key]
                        break

                district = None
                for key in field_mapping["district"]:
                    if key in record_lower:
                        district = record_lower[key]
                        break

                location_name = None
                for key in field_mapping["location"]:
                    if key in record_lower:
                        location_name = record_lower[key]
                        break

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
                    if state and state in INDIAN_WATER_BODIES:
                         # Use a slightly randomized location around state center to avoid overlap
                         # We use standard random instead of numpy to avoid heavy dependency usage for simple random
                         base_lat, base_lon = INDIAN_WATER_BODIES[state]["coordinates"]
                         latitude = base_lat + random.uniform(-0.1, 0.1)
                         longitude = base_lon + random.uniform(-0.1, 0.1)
                    else:
                        # Skip if no location data available
                        continue

                # measurement date
                measurement_date = datetime.now().strftime("%Y-%m-%d")
                # Try to find a date field
                for date_key in ["date", "created_date", "updated_date", "timestamp", "measurement_date"]:
                    if date_key in record_lower:
                        try:
                            # Parse date using dateutil which is robust
                            dt = date_parser.parse(str(record_lower[date_key]))
                            measurement_date = dt.strftime("%Y-%m-%d")
                            break
                        except (ValueError, TypeError):
                            continue

                # Extract parameters
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

            except Exception as e:
                logger.warning(f"Error processing record: {str(e)}")
                continue

        return processed_data
    
    def save_to_database(self, data: List[Dict[str, Any]]):
        """Save fetched data to database (Postgres or SQLite)"""
        if not data:
            logger.warning("No data to save")
            return
        
        if self.use_postgres:
            self._save_to_postgres(data)
        else:
            self._save_to_sqlite(data)

    def _save_to_postgres(self, data: List[Dict[str, Any]]):
        """Save data to PostgreSQL"""
        conn = self.get_postgres_connection()
        if not conn:
            logger.error("Could not connect to Postgres to save data")
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
            logger.info(f"Upserting {len(locations)} unique locations found in data")
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
            
            logger.info(f"Successfully upserted/retrieved {len(location_ids)} location IDs")

            # Get parameter IDs
            cursor.execute("SELECT parameter_code, id FROM water_quality_parameters")
            param_map = {row[0]: row[1] for row in cursor.fetchall()}
            logger.info(f"Loaded {len(param_map)} parameters from DB: {list(param_map.keys())}")

            # Insert readings using IDs
            logger.info(f"Starting insertion of {len(data)} readings...")
            inserted_count = 0
            for record in data:
                location_key = (record["location_name"], record["state"])
                if location_key not in location_ids:
                    logger.warning(f"Location ID not found for {record['location_name']}")
                    continue

                param_code = record["parameter"]
                if param_code not in param_map:
                    # Try to match case-insensitive or mapped codes if needed, or skip
                    # For now, skip if unknown parameter code to avoid FK error
                    logger.warning(f"Parameter ID not found for {param_code}")
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
            
            logger.info(f"Finished processing readings. Inserted: {inserted_count}, Skipped: {len(data) - inserted_count}")

            conn.commit()
            logger.info(f"Transaction committed. Saved {inserted_count} records to PostgreSQL")

        except Exception as e:
            logger.error(f"Error saving to PostgreSQL: {e}")
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
        
        logger.info(f"Saved {len(data)} records to SQLite")
    
    async def fetch_all_data(self):
        """Fetch data from all sources"""
        logger.info("Starting data fetch from all sources")
        
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
        logger.info(f"Fetched {len(all_data)} water quality records")
        logger.info(f"Fetched {len(weather_data)} weather records")
        
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
            for key, value in sample.items():
                print(f"  {key}: {value}")

if __name__ == "__main__":
    asyncio.run(main())