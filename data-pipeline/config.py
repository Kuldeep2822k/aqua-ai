"""
Configuration settings for the data pipeline
"""
import os
from dataclasses import dataclass
from typing import Dict, List

@dataclass
class APIConfig:
    """API configuration for different data sources"""
    base_url: str
    api_key: str = None
    rate_limit: int = 100  # requests per minute
    timeout: int = 30
    retry_attempts: int = 3

@dataclass
class DatabaseConfig:
    """Database configuration"""
    host: str
    port: int
    database: str
    username: str
    password: str
    ssl_mode: str = "prefer"

# Government API configurations
GOVERNMENT_APIS = {
    "data_gov_in": APIConfig(
        base_url="https://api.data.gov.in/rest/",
        api_key=os.getenv("DATA_GOV_IN_API_KEY"),
        rate_limit=100
    ),
    "cpcb": APIConfig(
        base_url="https://cpcb.nic.in/",
        rate_limit=50
    ),
    "jal_shakti": APIConfig(
        base_url="https://jal.gov.in/",
        rate_limit=30
    ),
    "weather_api": APIConfig(
        base_url="https://api.openweathermap.org/data/2.5/",
        api_key=os.getenv("WEATHER_API_KEY"),
        rate_limit=60
    )
}

# Database configuration
DB_CONFIG = DatabaseConfig(
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "5432")),
    database=os.getenv("DB_NAME", "aqua_ai_db"),
    username=os.getenv("DB_USER", "postgres"),
    password=os.getenv("DB_PASSWORD", "aqua_ai_password")
)

# Water quality parameters and their thresholds
WATER_QUALITY_PARAMETERS = {
    "BOD": {
        "name": "Biochemical Oxygen Demand",
        "unit": "mg/L",
        "safe_limit": 3.0,
        "moderate_limit": 6.0,
        "high_limit": 10.0,
        "critical_limit": 15.0
    },
    "TDS": {
        "name": "Total Dissolved Solids",
        "unit": "mg/L",
        "safe_limit": 500,
        "moderate_limit": 1000,
        "high_limit": 1500,
        "critical_limit": 2000
    },
    "pH": {
        "name": "pH Level",
        "unit": "",
        "safe_min": 6.5,
        "safe_max": 8.5,
        "moderate_range": 1.0,
        "critical_range": 2.0
    },
    "DO": {
        "name": "Dissolved Oxygen",
        "unit": "mg/L",
        "safe_limit": 6.0,
        "moderate_limit": 4.0,
        "high_limit": 2.0,
        "critical_limit": 1.0
    },
    "Lead": {
        "name": "Lead",
        "unit": "mg/L",
        "safe_limit": 0.01,
        "moderate_limit": 0.05,
        "high_limit": 0.1,
        "critical_limit": 0.2
    },
    "Mercury": {
        "name": "Mercury",
        "unit": "mg/L",
        "safe_limit": 0.001,
        "moderate_limit": 0.005,
        "high_limit": 0.01,
        "critical_limit": 0.02
    },
    "Coliform": {
        "name": "Coliform Count",
        "unit": "MPN/100ml",
        "safe_limit": 2.2,
        "moderate_limit": 10,
        "high_limit": 50,
        "critical_limit": 100
    },
    "Nitrates": {
        "name": "Nitrates",
        "unit": "mg/L",
        "safe_limit": 45,
        "moderate_limit": 100,
        "high_limit": 200,
        "critical_limit": 300
    }
}

# Indian states and their major water bodies
INDIAN_WATER_BODIES = {
    "Uttar Pradesh": {
        "rivers": ["Ganga", "Yamuna", "Gomti", "Ghaghara"],
        "coordinates": [26.8467, 80.9462]
    },
    "Delhi": {
        "rivers": ["Yamuna"],
        "coordinates": [28.7041, 77.1025]
    },
    "Maharashtra": {
        "rivers": ["Godavari", "Krishna", "Tapi", "Narmada"],
        "coordinates": [19.7515, 75.7139]
    },
    "Karnataka": {
        "rivers": ["Krishna", "Cauvery", "Tungabhadra"],
        "coordinates": [15.3173, 75.7139]
    },
    "Tamil Nadu": {
        "rivers": ["Cauvery", "Vaigai", "Thamirabarani"],
        "coordinates": [11.1271, 78.6569]
    },
    "West Bengal": {
        "rivers": ["Ganga", "Hooghly", "Damodar"],
        "coordinates": [22.9868, 87.8550]
    },
    "Gujarat": {
        "rivers": ["Narmada", "Tapi", "Sabarmati"],
        "coordinates": [23.0225, 72.5714]
    },
    "Rajasthan": {
        "rivers": ["Chambal", "Luni", "Banas"],
        "coordinates": [27.0238, 74.2179]
    },
    "Madhya Pradesh": {
        "rivers": ["Narmada", "Chambal", "Betwa", "Sone"],
        "coordinates": [22.9734, 78.6569]
    },
    "Andhra Pradesh": {
        "rivers": ["Godavari", "Krishna", "Penna"],
        "coordinates": [15.9129, 79.7400]
    }
}

