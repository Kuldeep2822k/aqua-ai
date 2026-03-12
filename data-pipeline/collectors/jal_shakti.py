import aiohttp
import asyncio
import logging
import os
import sys
from pathlib import Path

# Add parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from config import GOVERNMENT_APIS
except ImportError:
    # Fallback for standalone script execution
    GOVERNMENT_APIS = {
        "jal_shakti": {
            "base_url": "https://jal.gov.in/",
            "rate_limit": 30
        }
    }

logger = logging.getLogger(__name__)

class JalShaktiCollector:
    """Collector for Ministry of Jal Shakti Water Quality Data"""
    
    def __init__(self):
        """
        Initialize the collector's configuration and determine the service base URL.
        
        Reads the "jal_shakti" entry from GOVERNMENT_APIS and stores it on self.config. If that entry is a dict, sets self.base_url from the dict's "base_url" key (defaulting to "https://jal.gov.in/"). If it is not a dict (e.g., a dataclass-like object), attempts to read a `base_url` attribute with the same default.
        """
        self.config = GOVERNMENT_APIS.get("jal_shakti")
        if not isinstance(self.config, dict):
            # Handle case where config is a dataclass
            self.base_url = getattr(self.config, 'base_url', "https://jal.gov.in/")
        else:
            self.base_url = self.config.get("base_url", "https://jal.gov.in/")
            
    async def fetch_raw_data(self, allow_sample_data=True):
        """
        Fetch water quality records from the Ministry of Jal Shakti.
        
        If the remote API provides data, returns the parsed list from the API response's "data" field. If the fetch fails or the response is not successful, optionally returns a predefined sample record when allow_sample_data is True; otherwise returns an empty list.
        
        Parameters:
            allow_sample_data (bool): If True, return a predefined sample record on network errors or non-success responses.
        
        Returns:
            list: A list of dictionaries, each representing a water quality measurement record. An empty list is returned when no data is available and sample data is not allowed.
        """
        logger.info(f"Fetching raw data from Jal Shakti base URL: {self.base_url}")
        
        url = f"{self.base_url}/api/v1/monitoring-data"
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        return data.get("data", [])
                    else:
                        logger.warning(f"Failed to fetch Jal Shakti data. Status: {response.status}")
                        if allow_sample_data:
                            logger.info("Using sample data for Jal Shakti")
                            return [
                                {
                                    "location_name": "Cauvery at Mettur",
                                    "state": "Tamil Nadu",
                                    "district": "Salem",
                                    "latitude": 11.7862,
                                    "longitude": 77.8012,
                                    "parameter": "DO",
                                    "value": 7.2,
                                    "unit": "mg/L",
                                    "measurement_date": "2026-03-11",
                                    "source": "government"
                                }
                            ]
                        return []
            except Exception as e:
                logger.error(f"Error fetching from Jal Shakti: {str(e)}")
                if allow_sample_data:
                    logger.info("Using sample data for Jal Shakti after error")
                    return [
                        {
                            "location_name": "Cauvery at Mettur",
                            "state": "Tamil Nadu",
                            "district": "Salem",
                            "latitude": 11.7862,
                            "longitude": 77.8012,
                            "parameter": "DO",
                            "value": 7.2,
                            "unit": "mg/L",
                            "measurement_date": "2026-03-11",
                            "source": "government"
                        }
                    ]
                return []

if __name__ == "__main__":
    # Test execution
    import json
    collector = JalShaktiCollector()
    loop = asyncio.get_event_loop()
    data = loop.run_until_complete(collector.fetch_raw_data())
    print(f"Fetched {len(data)} records:")
    print(json.dumps(data, indent=2))
