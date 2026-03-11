import unittest
import sqlite3
import os
import sys
from pathlib import Path

# Add parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from fetch_data import WaterQualityDataFetcher

class TestPersistence(unittest.TestCase):
    def setUp(self):
        self.db_path = "test_persistence.db"
        # Ensure clean start
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        self.fetcher = WaterQualityDataFetcher(db_path=self.db_path)
        self.fetcher.use_postgres = False # Force SQLite for testing

    def tearDown(self):
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_save_to_sqlite(self):
        sample_data = [
            {
                "location_name": "Test River",
                "state": "Test State",
                "district": "Test District",
                "latitude": 10.0,
                "longitude": 20.0,
                "parameter": "BOD",
                "value": 5.0,
                "unit": "mg/L",
                "measurement_date": "2026-03-11",
                "source": "government",
                "external_id": "ext-123",
                "station_code": "ST-001",
                "raw_data": {"original": "data"}
            }
        ]
        
        self.fetcher._save_to_sqlite(sample_data)
        
        # Verify data in DB
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT location_name, parameter, value, external_id FROM water_quality_readings")
        row = cursor.fetchone()
        
        self.assertIsNotNone(row)
        self.assertEqual(row[0], "Test River")
        self.assertEqual(row[1], "BOD")
        self.assertEqual(row[2], 5.0)
        self.assertEqual(row[3], "ext-123")
        
        cursor.execute("SELECT name, station_code FROM locations")
        loc_row = cursor.fetchone()
        self.assertEqual(loc_row[0], "Test River")
        self.assertEqual(loc_row[1], "ST-001")
        
        conn.close()

if __name__ == '__main__':
    unittest.main()
