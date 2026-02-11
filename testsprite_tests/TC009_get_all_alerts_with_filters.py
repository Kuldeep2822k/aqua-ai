import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30


def test_get_all_alerts_with_filters():
    url = f"{BASE_URL}/api/alerts"

    # Test without filters (get all alerts)
    try:
        response = requests.get(url, timeout=TIMEOUT)
        response.raise_for_status()
        alerts = response.json()
        assert isinstance(alerts, list), "Response should be a list"
    except Exception as e:
        assert False, f"Failed to get all alerts without filters: {e}"

    # Test filter for active alerts only
    try:
        params = {"status": "active"}
        response = requests.get(url, params=params, timeout=TIMEOUT)
        response.raise_for_status()
        active_alerts = response.json()
        assert isinstance(active_alerts, list), "Active alerts response should be a list"
        # Assert all alerts have status active if status field exists
        for alert in active_alerts:
            assert alert.get("status") == "active"
    except Exception as e:
        assert False, f"Failed to get active alerts: {e}"

    # Test filter for resolved alerts only
    try:
        params = {"status": "resolved"}
        response = requests.get(url, params=params, timeout=TIMEOUT)
        response.raise_for_status()
        resolved_alerts = response.json()
        assert isinstance(resolved_alerts, list), "Resolved alerts response should be a list"
        for alert in resolved_alerts:
            assert alert.get("status") == "resolved"
    except Exception as e:
        assert False, f"Failed to get resolved alerts: {e}"

    # Test filter for dismissed alerts only
    try:
        params = {"status": "dismissed"}
        response = requests.get(url, params=params, timeout=TIMEOUT)
        response.raise_for_status()
        dismissed_alerts = response.json()
        assert isinstance(dismissed_alerts, list), "Dismissed alerts response should be a list"
        for alert in dismissed_alerts:
            assert alert.get("status") == "dismissed"
    except Exception as e:
        assert False, f"Failed to get dismissed alerts: {e}"


test_get_all_alerts_with_filters()