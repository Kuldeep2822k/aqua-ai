import unittest
from unittest.mock import patch, MagicMock, AsyncMock
import asyncio
import sys
from pathlib import Path

# Add parent directory to sys.path to allow importing from data-pipeline
sys.path.append(str(Path(__file__).parent.parent))

from collectors.jal_shakti import JalShaktiCollector

class TestJalShaktiCollector(unittest.TestCase):
    def setUp(self):
        self.collector = JalShaktiCollector()
        self.sample_response = {
            "data": [
                {
                    "location_name": "Cauvery at Mettur",
                    "state": "Tamil Nadu",
                    "parameter": "DO",
                    "value": 7.2,
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
        mock_get.return_value.__aenter__.return_value = mock_response

        # Run async function
        result = asyncio.run(self.collector.fetch_raw_data(allow_sample_data=False))

        self.assertEqual(len(result), 1)
        self.assertEqual(result[0]['location_name'], "Cauvery at Mettur")
        self.assertEqual(result[0]['value'], 7.2)

    @patch('aiohttp.ClientSession.get')
    def test_fetch_raw_data_failure(self, mock_get):
        # Setup mock response for failure
        mock_response = MagicMock()
        mock_response.status = 404
        mock_get.return_value.__aenter__.return_value = mock_response

        # Run async function
        result = asyncio.run(self.collector.fetch_raw_data(allow_sample_data=False))

        self.assertEqual(result, [])

if __name__ == '__main__':
    unittest.main()
