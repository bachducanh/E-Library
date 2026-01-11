import requests
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

BASE_URL = "http://localhost:8000"
MONGO_DETAILS = "mongodb://localhost:27020"
DB_NAME = "elibrary"
EMAIL = "debug_admin@example.com"
PASSWORD = "password123"

def create_and_test():
    # 1. Register
    print(f"Registering {EMAIL}...")
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": EMAIL, "password": PASSWORD, "fullName": "Debug Admin", "phone": "0000000000", "branchId": "HN"
    })
    
    # 2. Promote to Admin (Direct DB)
    print("Promoting to Admin via DB...")
    async def promote():
        client = AsyncIOMotorClient(MONGO_DETAILS)
        db = client[DB_NAME]
        await db.members.update_one({"email": EMAIL}, {"$set": {"role": "admin"}}) # Lowercase admin
    asyncio.run(promote())
    
    # 3. Login
    print("Logging in...")
    resp = requests.post(f"{BASE_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    if resp.status_code != 200:
        print(f"Login failed: {resp.text}")
        return
    token = resp.json()["access_token"]
    
    # 4. Get Users
    print("Fetching users API...")
    resp = requests.get(f"{BASE_URL}/users/", headers={"Authorization": f"Bearer {token}"})
    print(f"Status Code: {resp.status_code}")
    print(f"Response Body: {resp.text}")

if __name__ == "__main__":
    create_and_test()
