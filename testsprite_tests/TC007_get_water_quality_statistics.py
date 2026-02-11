import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_get_water_quality_statistics():
    url = f"{BASE_URL}/api/water-quality/stats"
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

    # Validate that the response contains expected keys and types
    # Typical aggregated statistics might include risk distribution by levels: Safe, Medium, High, Critical
    expected_keys = ["riskDistribution", "totalReadings", "averageValues"]
    for key in expected_keys:
        assert key in data, f"Missing expected key in response: {key}"

    # Validate riskDistribution is a dict with expected risk levels as string keys and numeric counts
    risk_distribution = data.get("riskDistribution")
    assert isinstance(risk_distribution, dict), "riskDistribution should be a dictionary"

    expected_risk_levels = {"Safe", "Medium", "High", "Critical"}
    assert expected_risk_levels <= set(risk_distribution.keys()), "riskDistribution missing some risk levels"

    for level in expected_risk_levels:
        count = risk_distribution.get(level)
        assert isinstance(count, (int, float)) and count >= 0, f"Invalid count for risk level {level}"

    # Validate totalReadings is a positive integer
    total_readings = data.get("totalReadings")
    assert isinstance(total_readings, int) and total_readings >= 0, "totalReadings should be a non-negative integer"

    # Validate averageValues contains numeric values (example: pH, DO, etc.)
    average_values = data.get("averageValues")
    assert isinstance(average_values, dict), "averageValues should be a dictionary"
    for param, value in average_values.items():
        assert isinstance(param, str), "Parameter name in averageValues should be string"
        assert isinstance(value, (int, float)), f"Average value for {param} should be numeric"

test_get_water_quality_statistics()