import requests

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_login_user_and_receive_jwt():
    login_url = f"{BASE_URL}/api/auth/login"
    # Use valid test credentials - these must exist in the system for this test to succeed
    payload = {
        "email": "testuser@example.com",
        "password": "TestPassword123!"
    }
    headers = {
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(login_url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        json_response = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # The response should contain a JWT token string, conventionally in a field named 'token' or 'accessToken'
    token = json_response.get("token") or json_response.get("accessToken")
    assert token is not None, "JWT token not found in response"
    assert isinstance(token, str) and len(token) > 0, "JWT token is empty or not a string"

test_login_user_and_receive_jwt()