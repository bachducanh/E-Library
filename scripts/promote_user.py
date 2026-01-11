import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# Database configuration
MONGO_DETAILS = "mongodb://localhost:27017"
DB_NAME = "elibrary"

async def promote_user(email: str):
    client = AsyncIOMotorClient(MONGO_DETAILS)
    db = client[DB_NAME]
    
    # Check if user exists
    user = await db.members.find_one({"email": email})
    if not user:
        print(f"❌ User with email '{email}' not found.")
        return

    # Update role
    await db.members.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    
    print(f"✅ User '{email}' has been promoted to ADMIN.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_to_admin.py <email>")
    else:
        email = sys.argv[1]
        asyncio.run(promote_user(email))
