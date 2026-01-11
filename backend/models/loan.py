"""
Pydantic models for loans and transactions
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class LoanCreate(BaseModel):
    copyId: str
    memberId: str

class LoanResponse(BaseModel):
    id: str = Field(alias="_id")
    branchId: str
    memberId: str
    copyId: str
    bookId: str
    borrowedAt: datetime
    dueAt: datetime
    returnedAt: Optional[datetime] = None
    status: str
    renewCount: int = 0
    
    class Config:
        populate_by_name = True

class TransactionResponse(BaseModel):
    id: str = Field(alias="_id")
    branchId: str
    type: str
    memberId: str
    copyId: str
    loanId: str
    createdAt: datetime
    
    class Config:
        populate_by_name = True
