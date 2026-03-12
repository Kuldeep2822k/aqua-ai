import unittest
from unittest.mock import patch, MagicMock, AsyncMock
import asyncio
import json
import os
import sys
from pathlib import Path

# Add parent directory to sys.path to allow importing from data-pipeline
sys.path.append(str(Path(__file__).parent.parent))

from collectors.cpcb import CPCBCollector

class TestCPCBCollector(unittest.TestCase):
    def setUp(self):
        """
        Prepare common test fixtures: instantiate a CPCBCollector and define self.sample_response containing a single-record CPCB API-like response used by the tests.
        """
        self.collector = CPCBCollector()
        self.sample_response = {
            "records": [
                {
                    "location_name": "Ganga at Varanasi",
                    "state": "Uttar Pradesh",
                    "parameter": "BOD",
                    "value": 4.5,
                    "unit": "mg/L",
                    "measurement_date": "2026-03-11",
                    "source": "government"
                }
            ]
        }

    @patch('aiohttp.ClientSession.get')
    def test_fetch_raw_data_success(self, mock_get):
        # Setup mock response
        mock_response = MagicMock()
        mock_response.status = 200
        mock_response.json = AsyncMock(return_value=self.sample_response)
        
        # Mocking the async context manager
        mock_get.return_value.__aenter__.return_value = mock_response

        # Run async function
        result = asyncio.run(self.collector.fetch_raw_data(allow_sample_data=False))

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['location_name'], "Ganga at Varanasi")
        self.assertEqual(result[0]['parameter'], "BOD")

    @patch('aiohttp.ClientSession.get')
    def test_fetch_raw_data_failure(self, mock_get):
        # Setup mock response for failure
        mock_response = MagicMock()
        mock_response.status = 500
        mock_get.return_value.__aenter__.return_value = mock_response

        # Run async function
        result = asyncio.run(self.collector.fetch_raw_data(allow_sample_data=False))

        self.assertEqual(result, [])

if __name__ == '__main__':
    unittest.main()
