import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

MONGO_DETAILS = "mongodb://localhost:27020"
DB_NAME = "elibrary"

async def list_users():
    client = AsyncIOMotorClient(MONGO_DETAILS)
    db = client[DB_NAME]
    
    print(f"--- Checking collection: members ---")
    count = await db.members.count_documents({})
    print(f"Total documents: {count}")
    
    async for user in db.members.find({}):
        print(f"ID: {user.get('_id')}, Email: {user.get('email')}, Role: {user.get('role')}")

if __name__ == "__main__":
    asyncio.run(list_users())
