import unittest
import sys
from pathlib import Path

# Add parent directory to sys.path
sys.path.append(str(Path(__file__).parent.parent))

from transformers.normalizer import DataNormalizer

class TestDataNormalizer(unittest.TestCase):
    def setUp(self):
        self.normalizer = DataNormalizer()

    def test_normalize_cpcb_record(self):
        raw_record = {
            "location_name": "Ganga at Varanasi",
            "state": "Uttar Pradesh",
            "parameter": "BOD",
            "value": 4.5,
            "unit": "mg/L",
            "measurement_date": "2026-03-11",
            "source": "government"
        }
        normalized = self.normalizer.normalize(raw_record, source="cpcb")
        
        self.assertEqual(normalized['parameter'], "BOD")
        self.assertEqual(normalized['value'], 4.5)
        self.assertEqual(normalized['source'], "government")

    def test_normalize_jal_shakti_record(self):
        raw_record = {
            "location_name": "Cauvery at Mettur",
            "state": "Tamil Nadu",
            "parameter": "DO",
            "value": 7.2,
            "unit": "mg/L",
            "measurement_date": "2026-03-11",
            "source": "government"
        }
        normalized = self.normalizer.normalize(raw_record, source="jal_shakti")
        
        self.assertEqual(normalized['parameter'], "DO")
        self.assertEqual(normalized['value'], 7.2)

    def test_parameter_mapping(self):
        # Test fuzzy parameter mapping
        self.assertEqual(self.normalizer.map_parameter("Biochemical Oxygen Demand"), "BOD")
        self.assertEqual(self.normalizer.map_parameter("Dissolved Oxygen"), "DO")
        self.assertEqual(self.normalizer.map_parameter("ph level"), "pH")
        self.assertEqual(self.normalizer.map_parameter("Unknown"), "Unknown")

if __name__ == '__main__':
    unittest.main()
