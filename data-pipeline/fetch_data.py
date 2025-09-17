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
import pandas as pd
import numpy as np
from pathlib import Path

from config import GOVERNMENT_APIS, WATER_QUALITY_PARAMETERS, INDIAN_WATER_BODIES

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class WaterQualityDataFetcher:
    """Main class for fetching water quality data from various sources"""
    
    def __init__(self, db_path: str = "water_quality_data.db"):
        self.db_path = db_path
        self.session = None
        self.setup_database()
    
    def setup_database(self):
        """Initialize SQLite database for development"""
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
        logger.info("Database initialized successfully")
    
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
            # Sample API call structure (would need actual API endpoints)
            url = f"{GOVERNMENT_APIS['data_gov_in'].base_url}water-quality"
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
                            "source": source
                        })
        
        return data
    
    def _process_data_gov_in(self, raw_data: Dict) -> List[Dict[str, Any]]:
        """Process raw data from data.gov.in API"""
        # This would contain actual data processing logic
        # For now, return sample data
        return self._generate_sample_data("data_gov_in")
    
    def save_to_database(self, data: List[Dict[str, Any]]):
        """Save fetched data to database"""
        if not data:
            logger.warning("No data to save")
            return
        
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
        
        logger.info(f"Saved {len(data)} records to database")
    
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
        print(f"\n🌊 Data Fetch Summary:")
        print(f"📊 Water Quality Records: {len(water_data)}")
        print(f"🌤️ Weather Records: {len(weather_data)}")
        print(f"🗄️ Database: water_quality_data.db")
        
        # Show sample data
        if water_data:
            print(f"\n📋 Sample Water Quality Data:")
            sample = water_data[0]
            for key, value in sample.items():
                print(f"  {key}: {value}")

if __name__ == "__main__":
    asyncio.run(main())