import requests

BASE_URL = "http://localhost:5000"
LOCATIONS_ENDPOINT = f"{BASE_URL}/api/locations"
TIMEOUT = 30

def test_get_monitoring_locations_list():
    headers = {
        "Accept": "application/json"
    }

    # Test retrieval without filters
    try:
        response = requests.get(LOCATIONS_ENDPOINT, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to get monitoring locations failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    # Validate response structure and pagination
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Basic checks on expected keys
    assert "locations" in data, "Response JSON does not contain 'locations' key"
    assert isinstance(data["locations"], list), "'locations' should be a list"
    # pagination keys might be present such as total, page, per_page
    # Check at least one key to confirm pagination presence
    pagination_keys = {"total", "page", "per_page"}
    assert any(key in data for key in pagination_keys), "Pagination info keys not found in response"

    # If there is at least one location, verify that essential fields are present
    if data["locations"]:
        loc = data["locations"][0]
        # Expected fields, for example: id, name, state, district, coordinates
        expected_fields = {"id", "name", "state", "district", "coordinates"}
        missing_fields = expected_fields - loc.keys()
        assert not missing_fields, f"Missing fields in location data: {missing_fields}"

    # Test retrieval with filters: for example, state filter
    params = {
        "state": "Maharashtra",
        "page": 1,
        "per_page": 5
    }
    try:
        filtered_response = requests.get(LOCATIONS_ENDPOINT, headers=headers, params=params, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request to get filtered monitoring locations failed: {e}"

    assert filtered_response.status_code == 200, f"Expected status code 200 for filtered request, got {filtered_response.status_code}"

    try:
        filtered_data = filtered_response.json()
    except ValueError:
        assert False, "Filtered response is not valid JSON"

    # Validate filtered response structure
    assert "locations" in filtered_data, "Filtered response JSON does not contain 'locations' key"
    assert isinstance(filtered_data["locations"], list), "'locations' in filtered response should be a list"

    # If locations returned, check that each location's state matches the filter
    for location in filtered_data["locations"]:
        assert "state" in location, "Location missing 'state' field"
        assert location["state"].lower() == "maharashtra".lower(), f"Location state {location['state']} does not match filter 'Maharashtra'"

test_get_monitoring_locations_list()