import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def update_current_user_profile():
    # Setup: Register and login a new user to get JWT token
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    profile_url = f"{BASE_URL}/api/auth/me"
    password = "TestPass123!"
    unique_suffix = str(uuid.uuid4()).replace("-", "")[:8]
    user_email = f"testuser_{unique_suffix}@example.com"
    user_name = f"Test User {unique_suffix}"
    new_name = f"Updated User {unique_suffix}"
    new_email = f"updated_{unique_suffix}@example.com"

    # Register user
    register_payload = {
        "email": user_email,
        "password": password,
        "name": user_name
    }
    r = requests.post(register_url, json=register_payload, timeout=TIMEOUT)
    assert r.status_code == 201 or r.status_code == 200, f"Unexpected status code on register: {r.status_code}"

    try:
        # Login user
        login_payload = {
            "email": user_email,
            "password": password
        }
        r = requests.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert r.status_code == 200, f"Unexpected status code on login: {r.status_code}"
        token = r.json().get("token") or r.json().get("access_token")
        assert token, "JWT token not found in login response"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        # Update profile (name and email)
        update_payload = {
            "name": new_name,
            "email": new_email
        }
        r = requests.put(profile_url, json=update_payload, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Unexpected status code on profile update: {r.status_code}"
        updated_profile = r.json()
        assert updated_profile.get("name") == new_name, "Name was not updated correctly"
        assert updated_profile.get("email") == new_email, "Email was not updated correctly"

        # Verify update by retrieving the profile again
        r = requests.get(profile_url, headers=headers, timeout=TIMEOUT)
        assert r.status_code == 200, f"Unexpected status code on profile get: {r.status_code}"
        profile = r.json()
        assert profile.get("name") == new_name, "Name in profile get does not match updated name"
        assert profile.get("email") == new_email, "Email in profile get does not match updated email"
    finally:
        # Cleanup: No explicit delete user endpoint from PRD, so skipping user deletion.
        # If such an endpoint existed, would use it here.
        pass

update_current_user_profile()