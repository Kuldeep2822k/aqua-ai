import requests

BASE_URL = "http://localhost:5000"
REGISTER_URL = f"{BASE_URL}/api/auth/register"
LOGIN_URL = f"{BASE_URL}/api/auth/login"
PROFILE_URL = f"{BASE_URL}/api/auth/me"
TIMEOUT = 30

def test_get_current_user_profile():
    # Test user details for registration/login
    user_data = {
        "email": "testuser_tc003@example.com",
        "password": "StrongPass!123",
        "name": "Test User TC003"
    }

    token = None
    headers = None

    try:
        # Register the user (ignore if user already exists)
        try:
            reg_resp = requests.post(REGISTER_URL, json=user_data, timeout=TIMEOUT)
            # 201 Created expected or 409 Conflict if already exists
            assert reg_resp.status_code in (201, 409)
        except requests.RequestException as e:
            raise AssertionError(f"User registration request failed: {e}")

        # Login the user to get JWT token
        try:
            login_resp = requests.post(LOGIN_URL, json={"email": user_data["email"], "password": user_data["password"]}, timeout=TIMEOUT)
            assert login_resp.status_code == 200, f"Login failed with status {login_resp.status_code}"
            login_json = login_resp.json()
            token = login_json.get("token")
            assert token and isinstance(token, str), "JWT token missing or invalid in login response"
        except requests.RequestException as e:
            raise AssertionError(f"User login request failed: {e}")

        headers = {"Authorization": f"Bearer {token}"}

        # Get current user profile with token
        try:
            profile_resp = requests.get(PROFILE_URL, headers=headers, timeout=TIMEOUT)
            assert profile_resp.status_code == 200, f"Profile retrieval failed with status {profile_resp.status_code}"
            profile_json = profile_resp.json()
            # Validate expected fields in the user profile response
            assert isinstance(profile_json, dict), "Profile response is not a JSON object"
            assert "email" in profile_json and profile_json["email"] == user_data["email"], "Email in profile does not match"
            assert "name" in profile_json and profile_json["name"] == user_data["name"], "Name in profile does not match"
            assert "id" in profile_json, "User profile missing 'id' field"
        except requests.RequestException as e:
            raise AssertionError(f"Profile retrieval request failed: {e}")

    finally:
        # Cleanup: delete user if API for deletion existed (not specified in PRD, so skipping)
        # Leaving this block for potential future cleanup steps.
        pass

test_get_current_user_profile()