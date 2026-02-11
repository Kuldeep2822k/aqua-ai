import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_resolve_alert_by_id():
    # Authenticate user to get JWT token (assuming test user exists)
    login_url = f"{BASE_URL}/api/auth/login"
    login_payload = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }
    login_resp = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
    assert login_resp.status_code == 200, "Login failed"
    token = login_resp.json().get("token")
    assert token, "No JWT token received"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Create a new alert to resolve (if no alert id provided, create one)
    # Since API does not specify alert creation endpoint in PRD, we'll check for active alerts then pick one or fail if none.
    # If create alert endpoint existed, we would create then delete it. Here, fallback to picking an active alert.
    active_alerts_url = f"{BASE_URL}/api/alerts/active"
    active_alerts_resp = requests.get(active_alerts_url, headers=headers, timeout=TIMEOUT)
    assert active_alerts_resp.status_code == 200, "Failed to retrieve active alerts"
    active_alerts = active_alerts_resp.json()
    assert isinstance(active_alerts, list), "Active alerts response is not a list"
    assert len(active_alerts) > 0, "No active alerts to resolve for test"

    alert = active_alerts[0]
    alert_id = alert.get("id")
    assert alert_id, "Alert has no ID"

    resolve_url = f"{BASE_URL}/api/alerts/{alert_id}/resolve"
    resolve_payload = {
        "notes": "Resolved during automated test"
    }

    # Resolve alert
    resolve_resp = requests.put(resolve_url, headers=headers, json=resolve_payload, timeout=TIMEOUT)
    assert resolve_resp.status_code == 200, f"Failed to resolve alert {alert_id}"

    resolved_alert = resolve_resp.json()
    # Validate updated status and notes
    assert resolved_alert.get("id") == alert_id, "Resolved alert ID mismatch"
    assert resolved_alert.get("status") == "resolved", "Alert status was not updated to resolved"
    assert "notes" in resolved_alert and "Resolved during automated test" in resolved_alert["notes"], "Notes not updated correctly"

    # Cleanup: Optionally, could try to revert alert status if needed, but PRD doesn't define this.
    # So no cleanup code is added here.

test_resolve_alert_by_id()