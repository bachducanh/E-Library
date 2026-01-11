"""
Users Router - Admin Management
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from typing import List, Optional
from models.auth import UserResponse, UserUpdate, UserRegister
from database import get_database
from middleware.auth import get_current_user
from bson import ObjectId
from passlib.context import CryptContext

router = APIRouter(prefix="/users", tags=["Users"], dependencies=[Depends(get_current_user)])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def check_admin(user: dict):
    role = user.get("role", "").lower()
    if role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

@router.get("/")
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    q: Optional[str] = None,
    role: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get all users (Admin only)"""
    check_admin(current_user)
    db = await get_database()
    
    filter_query = {}
    if q:
        filter_query["$or"] = [
            {"email": {"$regex": q, "$options": "i"}},
            {"fullName": {"$regex": q, "$options": "i"}}
        ]
    if role:
        filter_query["role"] = role
        
    cursor = db.members.find(filter_query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    return users

@router.post("/", response_model=UserResponse, status_code=201)
async def create_user(user: UserRegister, current_user: dict = Depends(get_current_user)):
    """Create a new user (Admin only)"""
    check_admin(current_user)
    db = await get_database()
    
    existing_user = await db.members.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = pwd_context.hash(user.password)
    user_dict = user.model_dump()
    user_dict["password"] = hashed_password
    user_dict["role"] = "member" # Default, or could be passed? adhering to Register model logic for now but allowing updates later
    # Initialize implementation details
    user_dict["subscription"] = {
        "plan": "BASIC",
        "startDate": None,
        "endDate": None,
        "status": "active"
    }
    user_dict["walletBalance"] = 0
    
    new_user = await db.members.insert_one(user_dict)
    created_user = await db.members.find_one({"_id": new_user.inserted_id})
    return created_user

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: str, 
    user_update: UserUpdate, 
    current_user: dict = Depends(get_current_user)
):
    """Update user (Admin only)"""
    check_admin(current_user)
    db = await get_database()
    
    # Try finding by ObjectId first, effectively handling both if needed, but existing data uses String IDs "MEM..."
    # WAIT! auth.py generates "MEMxxxxxx" (String) IDs, not ObjectId.
    # So ObjectId(user_id) will FAIL for existing users.
    # I must remove ObjectId casting and query by _id string.
    
    existing_user = await db.members.find_one({"_id": user_id})
    if not existing_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    
    if update_data:
        await db.members.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        
    updated_user = await db.members.find_one({"_id": user_id})
    return updated_user

@router.delete("/{user_id}", status_code=204)
async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
    """Delete user (Admin only)"""
    check_admin(current_user)
    db = await get_database()
    
    result = await db.members.delete_one({"_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return None
