"""
Authentication Router
"""

from fastapi import APIRouter, HTTPException, status, Depends
from models.auth import UserLogin, UserRegister, Token, UserResponse
from utils.security import hash_password, verify_password, create_access_token
from database import get_database
from middleware.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """Register a new user"""
    db = await get_database()
    
    # Check if email already exists
    existing_user = await db.members.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Generate user ID
    count = await db.members.count_documents({})
    user_id = f"MEM{str(count + 1).zfill(6)}"
    
    # Create user document
    user_doc = {
        "_id": user_id,
        "email": user_data.email,
        "passwordHash": hash_password(user_data.password),
        "fullName": user_data.fullName,
        "phone": user_data.phone,
        "branchId": user_data.branchId,
        "role": "MEMBER",
        "subscription": {
            "tier": "BASIC",
            "active": True,
            "startDate": datetime.now(),
            "endDate": datetime.now().replace(year=datetime.now().year + 1),
            "maxLoans": 5,
            "loanDuration": 14
        },
        "joinedAt": datetime.now()
    }
    
    await db.members.insert_one(user_doc)
    
    return user_doc

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    """Login and get access token"""
    db = await get_database()
    
    # Find user by email
    user = await db.members.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["passwordHash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token = create_access_token(
        data={
            "sub": user["_id"],
            "email": user["email"],
            "role": user["role"]
        }
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user
