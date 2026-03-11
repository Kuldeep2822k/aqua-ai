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
        """
        Prepare a clean SQLite test database and initialize a WaterQualityDataFetcher configured to use it.
        
        Removes any existing test database file at "test_persistence.db", creates a WaterQualityDataFetcher using that path, and forces the fetcher to use SQLite for testing.
        """
        self.db_path = "test_persistence.db"
        # Ensure clean start
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
        self.fetcher = WaterQualityDataFetcher(db_path=self.db_path)
        self.fetcher.use_postgres = False # Force SQLite for testing

    def tearDown(self):
        """
        Remove the test database file specified by self.db_path if it exists.
        
        This cleans up any persisted SQLite database created during the test to ensure no leftover files remain after the test case.
        """
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_save_to_sqlite(self):
        """
        Verify that _save_to_sqlite persists a water quality reading and its location to the SQLite database.
        
        Creates a sample record, calls the fetcher's _save_to_sqlite method, and asserts that a corresponding row exists
        in the water_quality_readings table with the expected location_name, parameter, value, and external_id, and that
        the locations table contains the expected name and station_code.
        """
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
