import logging
import re
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class DataNormalizer:
    """Normalizes water quality data from various sources into a standard internal schema"""
    
    PARAM_MAPPING = {
        "BOD": ["bod", "b.o.d", "biochemical oxygen demand", "biochemical_oxygen_demand"],
        "TDS": ["tds", "total dissolved solids", "conductivity", "total_dissolved_solids"],
        "pH": ["ph", "p h", "ph level", "ph_level"],
        "DO": ["do", "d.o", "dissolved oxygen", "dissolved_oxygen"],
        "Lead": ["lead", "pb"],
        "Mercury": ["mercury", "hg"],
        "Coliform": ["coliform", "fecal coliform", "total coliform"],
        "Nitrates": ["nitrate", "nitrates", "no3"]
    }

    def __init__(self):
        # Create a reverse mapping for fast lookup
        """
        Initialize the DataNormalizer and build a reverse lookup from alias to standard parameter code.
        
        Creates the `reverse_map` attribute mapping each alias (lowercased) from `PARAM_MAPPING` to its corresponding standard parameter code for fast parameter normalization.
        """
        self.reverse_map = {}
        for standard, aliases in self.PARAM_MAPPING.items():
            for alias in aliases:
                self.reverse_map[alias.lower()] = standard

    def map_parameter(self, raw_param: str) -> str:
        """
        Map a raw parameter label from source data to the canonical internal parameter code.
        
        Parameters:
            raw_param (str): The parameter label from input data; underscores and hyphens are treated as spaces and matching is case-insensitive.
        
        Returns:
            str: The canonical parameter code when a match is found, `"Unknown"` if `raw_param` is empty, or the original `raw_param` if no mapping is found.
        """
        if not raw_param:
            return "Unknown"
            
        normalized = raw_param.lower().strip().replace("_", " ").replace("-", " ")
        normalized = " ".join(normalized.split())
        
        # Exact match in reverse map
        if normalized in self.reverse_map:
            return self.reverse_map[normalized]
            
        # Fuzzy match
        for standard, aliases in self.PARAM_MAPPING.items():
            if any(alias in normalized for alias in aliases):
                return standard
                
        return raw_param # Return as is if no mapping found

    def normalize(self, record: Dict[str, Any], source: str) -> Dict[str, Any]:
        """
        Normalize a water-quality record into the module's standard internal schema.
        
        Performs parameter mapping, fills missing canonical fields from common fallbacks, generates a traceable external_id when absent, and attaches the original record under `raw_data`.
        
        Parameters:
            record (Dict[str, Any]): The incoming record to normalize.
            source (str): Identifier of the data source; used when generating `external_id`.
        
        Returns:
            Dict[str, Any]: A shallow copy of `record` with:
                - `parameter` mapped to a standard code when possible,
                - `location_name`, `measurement_date`, and `station_code` populated from fallback keys if missing,
                - `external_id` set to an MD5 hex digest of `"{source}-{location_name}-{parameter}-{measurement_date}"` if not present,
                - `raw_data` containing the original input record.
        """
        normalized_record = record.copy()
        
        # Map parameter
        raw_param = record.get("parameter")
        if raw_param:
            normalized_record["parameter"] = self.map_parameter(raw_param)
            
        # Ensure standard fields exist
        if "location_name" not in normalized_record:
            # Try fallback keys
            for key in ["station_name", "river_name", "location", "station"]:
                if key in record:
                    normalized_record["location_name"] = record[key]
                    break
        
        if "measurement_date" not in normalized_record:
            for key in ["timestamp", "date", "year", "measurement_date"]:
                if key in record:
                    normalized_record["measurement_date"] = record[key]
                    break
        
        # New fields for traceability
        if "station_code" not in normalized_record:
            for key in ["station_code", "station_id", "id"]:
                if key in record:
                    normalized_record["station_code"] = record[key]
                    break
        
        if "external_id" not in normalized_record:
            # Generate a unique ID if not present
            import hashlib
            raw_id = f"{source}-{normalized_record.get('location_name')}-{normalized_record.get('parameter')}-{normalized_record.get('measurement_date')}"
            normalized_record["external_id"] = hashlib.md5(raw_id.encode()).hexdigest()
            
        normalized_record["raw_data"] = record # Store the original record
                    
        return normalized_record

if __name__ == "__main__":
    # Test execution
    normalizer = DataNormalizer()
    sample = {"parameter": "biochemical_oxygen_demand", "value": 5.0}
    print(f"Normalized: {normalizer.normalize(sample, 'test')}")
