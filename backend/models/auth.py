"""
Pydantic models for authentication
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    fullName: str
    phone: str
    branchId: str = "HN"

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None

class UserResponse(BaseModel):
    id: str = Field(alias="_id")
    email: str
    fullName: str
    phone: str
    branchId: str
    role: str
    subscription: dict
    
    class Config:
        populate_by_name = True

class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    phone: Optional[str] = None
    branchId: Optional[str] = None
    role: Optional[str] = None
    subscription: Optional[dict] = None
