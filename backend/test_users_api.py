import requests
import sys

BASE_URL = "http://localhost:8000"

def test_users_api(email, password):
    # 1. Login
    print(f"Logging in as {email}...")
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return
        token = resp.json()["access_token"]
        print("Login successful.")
        
        # 2. Get Users
        print("Fetching users...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/users/", headers=headers)
        
        if resp.status_code == 200:
            users = resp.json()
            print(f"Success! Found {len(users)} users.")
            if len(users) > 0:
                print("First user sample:", users[0])
            else:
                print("List is empty.")
        else:
            print(f"Failed to get users: {resp.status_code} - {resp.text}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python test_users_api.py <email> <password>")
    else:
        test_users_api(sys.argv[1], sys.argv[2])
