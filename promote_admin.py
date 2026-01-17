
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# MongoDB Connection URL (pointing to mongos router)
MONGODB_URL = "mongodb://localhost:27020/"
DATABASE_NAME = "elibrary"

async def promote_user(email):
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    
    user = await db.members.find_one({"email": email})
    
    if not user:
        print(f"User with email {email} not found.")
        return
    
    if user.get("role") == "admin":
        print(f"User {email} is already an ADMIN.")
        return

    result = await db.members.update_one(
        {"email": email},
        {"$set": {"role": "admin"}}
    )
    
    if result.modified_count > 0:
        print(f"Successfully promoted {email} to ADMIN.")
    else:
        print(f"Failed to update user {email}.")

    client.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python promote_admin.py <email>")
    else:
        email = sys.argv[1]
        asyncio.run(promote_user(email))
