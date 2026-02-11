import requests
import uuid

BASE_URL = "http://localhost:5000"
REGISTER_ENDPOINT = "/api/auth/register"
HEADERS = {'Content-Type': 'application/json'}
TIMEOUT = 30

def test_register_new_user():
    unique_email = f"testuser_{uuid.uuid4()}@example.com"
    payload = {
        "email": unique_email,
        "password": "StrongPass!123",
        "name": "Test User"
    }
    try:
        response = requests.post(
            BASE_URL + REGISTER_ENDPOINT,
            json=payload,
            headers=HEADERS,
            timeout=TIMEOUT
        )
        assert response.status_code == 201 or response.status_code == 200, f"Expected status code 200 or 201, got {response.status_code}"
        data = response.json()
        # Usually registration returns user id or some success message
        assert "id" in data or "message" in data or "token" in data, "Response JSON missing expected keys"
        # Validate returned email/name if available
        if "user" in data:
            assert data["user"]["email"] == unique_email
            assert data["user"]["name"] == "Test User"
        if "email" in data:
            assert data["email"] == unique_email
    except requests.RequestException as e:
        assert False, f"HTTP request to register failed: {e}"

test_register_new_user()