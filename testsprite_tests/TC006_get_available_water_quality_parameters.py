import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def test_get_available_water_quality_parameters():
    url = f"{BASE_URL}/api/water-quality/parameters"
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate response structure and contents
    assert isinstance(data, list), "Response should be a list of parameters"
    assert len(data) > 0, "Parameter list should not be empty"

    # Check each parameter item is a string (assuming parameters are simple names)
    for param in data:
        assert isinstance(param, str), f"Parameter should be string, got {type(param)}"


test_get_available_water_quality_parameters()