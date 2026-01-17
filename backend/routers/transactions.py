"""
Transactions Router - History and Logs
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from models.loan import TransactionResponse
from database import get_database
from middleware.auth import get_current_active_user

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    branchId: Optional[str] = None,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Get transactions history"""
    db = await get_database()
    
    # If not admin, can only see own transactions (optional requirement, but good practice)
    # But usually this endpoint is for Admin Portal.
    # Let's restrict to Admin/Staff for global view, or specific user if filter provided?
    # For simplicity of this "Verification" task, allow Admin to see all, User to see theirs.
    
    filter_query = {}
    
    if current_user["role"] not in ["admin", "staff"]:
        filter_query["memberId"] = current_user["_id"]
    
    if branchId:
        filter_query["branchId"] = branchId
    if type:
        filter_query["type"] = type
        
    cursor = db.transactions.find(filter_query).sort("createdAt", -1).skip(skip).limit(limit)
    transactions = await cursor.to_list(length=limit)
    
    return transactions
