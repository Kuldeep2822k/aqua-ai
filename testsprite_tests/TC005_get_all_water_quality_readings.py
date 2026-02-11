import requests
import datetime

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_get_all_water_quality_readings():
    """
    Test retrieval of all water quality readings with optional filters like location and date range,
    ensuring correct data and pagination.
    """

    # Optional filters to test
    # 1. No filters - retrieve first page default
    url = f"{BASE_URL}/api/water-quality"
    try:
        resp = requests.get(url, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        assert isinstance(data, dict), "Response should be a JSON object"
        assert "readings" in data or "items" in data, "Response missing readings/items key"
        # Pagination keys usually like page, total_pages etc can be checked if exist
        # We'll allow either to cater for unknown pagination style
        assert any(k in data for k in ["page", "current_page", "total_pages", "total", "limit", "offset"]), "Pagination metadata missing"

        # Validate readings content if present
        readings = data.get("readings") or data.get("items") or []
        assert isinstance(readings, list), "Readings should be a list"
        for reading in readings:
            # A minimal check for expected fields
            assert isinstance(reading, dict)
            # Example fields: id, location, datetime, parameters, risk_level
            # We don't have exact schema for reading fields from PRD so check some plausible keys
            assert "id" in reading
            assert "location" in reading or "locationId" in reading
            assert "datetime" in reading or "timestamp" in reading
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    # 2. Filter by location (need a valid location id, so try to get one from /api/locations first)
    locations_url = f"{BASE_URL}/api/locations"
    try:
        loc_resp = requests.get(locations_url, timeout=TIMEOUT)
        loc_resp.raise_for_status()
        locations_data = loc_resp.json()
        locations = locations_data.get("locations") or locations_data.get("items") or []
        if locations:
            location_id = None
            first_loc = locations[0]
            # location could have id or _id field
            location_id = first_loc.get("id") or first_loc.get("_id")
            if location_id:
                params = {"location": location_id}
                resp = requests.get(url, params=params, timeout=TIMEOUT)
                resp.raise_for_status()
                data = resp.json()
                assert "readings" in data or "items" in data
                readings = data.get("readings") or data.get("items") or []
                for reading in readings:
                    # Confirm readings belong to the location filter
                    loc_in_reading = reading.get("location") or reading.get("locationId")
                    assert loc_in_reading == location_id, "Reading location does not match filter"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed during location filtered call: {e}"

    # 3. Filter by date range (use ISO 8601 format)
    # Define last 7 days range
    end_date = datetime.datetime.utcnow().date()
    start_date = end_date - datetime.timedelta(days=7)
    params = {
        "startDate": start_date.isoformat(),
        "endDate": end_date.isoformat()
    }
    try:
        resp = requests.get(url, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        readings = data.get("readings") or data.get("items") or []
        for reading in readings:
            dt_str = reading.get("datetime") or reading.get("timestamp")
            assert dt_str, "Reading missing datetime/timestamp"
            # Parse date portion only for comparison (assuming ISO 8601)
            dt = datetime.datetime.fromisoformat(dt_str.replace("Z", "+00:00")).date()
            assert start_date <= dt <= end_date, f"Reading datetime {dt} out of filter range"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed during date range filtered call: {e}"

    # 4. Pagination test with page and limit parameters if supported
    params = {"page": 1, "limit": 5}
    try:
        resp = requests.get(url, params=params, timeout=TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        readings = data.get("readings") or data.get("items") or []
        assert len(readings) <= 5, "Pagination limit exceeded"
        # Check pagination metadata present and correct
        pagination_keys = ["page", "current_page", "limit", "total", "total_pages"]
        assert any(k in data for k in pagination_keys), "Pagination metadata missing"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed during pagination test: {e}"


test_get_all_water_quality_readings()