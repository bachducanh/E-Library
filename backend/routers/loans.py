"""
Loans Router - Borrow and Return Operations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional
from models.loan import LoanCreate, LoanResponse, TransactionResponse
from database import get_database
from middleware.auth import get_current_active_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/loans", tags=["Loans"])

@router.post("/borrow", response_model=LoanResponse, status_code=201)
async def borrow_book(
    loan_data: LoanCreate,
    current_user: dict = Depends(get_current_active_user)
):
    """Borrow a physical book"""
    db = await get_database()
    
    # Check if user has reached max loans
    active_loans = await db.loans.count_documents({
        "memberId": current_user["_id"],
        "status": {"$in": ["active", "overdue"]}
    })
    
    max_loans = current_user["subscription"]["maxLoans"]
    if active_loans >= max_loans:
        raise HTTPException(
            status_code=400,
            detail=f"You have reached the maximum number of loans ({max_loans})"
        )
    
    # Check if subscription is expired
    if current_user["subscription"]["endDate"] and current_user["subscription"]["endDate"] < datetime.now():
        raise HTTPException(
            status_code=403,
            detail="Your subscription has expired. Please renew."
        )

    # Check if copy exists and is available
    copy = await db.copies.find_one({"_id": loan_data.copyId})
    if not copy:
        raise HTTPException(status_code=404, detail="Copy not found")
    
    if copy["status"] != "available":
        raise HTTPException(status_code=400, detail="Copy is not available")
    
    # Check if copy is in user's branch
    if copy["branchId"] != current_user["branchId"]:
        raise HTTPException(
            status_code=400,
            detail=f"This copy is only available at {copy['branchId']} branch"
        )
    
    # Create loan
    loan_count = await db.loans.count_documents({})
    loan_id = f"LN{str(loan_count + 1).zfill(6)}"
    
    borrowed_at = datetime.now()
    due_at = borrowed_at + timedelta(days=current_user["subscription"]["loanDuration"])
    
    loan_doc = {
        "_id": loan_id,
        "branchId": current_user["branchId"],
        "memberId": current_user["_id"],
        "copyId": copy["_id"],
        "bookId": copy["bookId"],
        "borrowedAt": borrowed_at,
        "dueAt": due_at,
        "returnedAt": None,
        "status": "active",
        "renewCount": 0
    }
    
    await db.loans.insert_one(loan_doc)
    
    # Update copy status
    await db.copies.update_one(
        {"_id": copy["_id"]},
        {"$set": {"status": "borrowed"}}
    )
    
    # Create transaction
    tx_count = await db.transactions.count_documents({})
    tx_id = f"TX{str(tx_count + 1).zfill(8)}"
    
    transaction_doc = {
        "_id": tx_id,
        "branchId": current_user["branchId"],
        "type": "borrow",
        "memberId": current_user["_id"],
        "copyId": copy["_id"],
        "loanId": loan_id,
        "createdAt": borrowed_at
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    return loan_doc

@router.post("/return/{loan_id}", response_model=LoanResponse)
async def return_book(
    loan_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Return a borrowed book"""
    db = await get_database()
    
    # Find loan
    loan = await db.loans.find_one({"_id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Check authorization
    if loan["memberId"] != current_user["_id"] and current_user["role"] not in ["STAFF", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if loan["status"] == "returned":
        raise HTTPException(status_code=400, detail="Book already returned")
    
    # Calculate Fine
    return_date = datetime.now()
    fine_amount = 0
    overdue_days = 0
    
    if return_date > loan["dueAt"]:
        delta = return_date - loan["dueAt"]
        overdue_days = delta.days
        if overdue_days > 0:
            fine_amount = overdue_days * 5000 # 5000 VND per day
    
    # Update loan
    update_data = {
        "returnedAt": return_date,
        "status": "returned",
        "overdueDays": overdue_days,
        "fineAmount": fine_amount
    }
    
    await db.loans.update_one(
        {"_id": loan_id},
        {"$set": update_data}
    )
    
    # Update copy status
    await db.copies.update_one(
        {"_id": loan["copyId"]},
        {"$set": {"status": "available"}}
    )
    
    # Generate Transaction ID
    tx_count = await db.transactions.count_documents({})
    
    # Create return transaction
    tx_id_return = f"TX{str(tx_count + 1).zfill(8)}"
    
    transaction_doc = {
        "_id": tx_id_return,
        "branchId": loan["branchId"],
        "type": "return",
        "memberId": loan["memberId"],
        "copyId": loan["copyId"],
        "loanId": loan_id,
        "createdAt": return_date
    }
    await db.transactions.insert_one(transaction_doc)
    
    # Create Fine Transaction if applicable
    if fine_amount > 0:
        tx_id_fine = f"TX{str(tx_count + 2).zfill(8)}"
        fine_doc = {
             "_id": tx_id_fine,
             "branchId": loan["branchId"],
             "type": "fine",
             "memberId": loan["memberId"],
             "loanId": loan_id,
             "amount": fine_amount,
             "description": f"Overdue fine for {overdue_days} days",
             "status": "pending", # User needs to pay this
             "createdAt": return_date
        }
        await db.transactions.insert_one(fine_doc)
    
    # Get updated loan
    updated_loan = await db.loans.find_one({"_id": loan_id})
    return updated_loan

@router.post("/renew/{loan_id}", response_model=LoanResponse)
async def renew_loan(
    loan_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Renew a loan (extend due date)"""
    db = await get_database()
    
    # Find loan
    loan = await db.loans.find_one({"_id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Check authorization
    if loan["memberId"] != current_user["_id"] and current_user["role"].lower() not in ["staff", "admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if loan["status"] == "returned":
        raise HTTPException(status_code=400, detail="Cannot renew returned book")
    
    # Check renew count (max 2 renewals)
    renew_count = loan.get("renewCount", 0)
    if renew_count >= 2:
        raise HTTPException(status_code=400, detail="Maximum renewal limit reached (2 times)")
    
    # Check if overdue by more than 3 days
    current_date = datetime.now()
    if current_date > loan["dueAt"]:
        days_overdue = (current_date - loan["dueAt"]).days
        if days_overdue > 3:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot renew: Book is overdue by {days_overdue} days. Please return it."
            )
    
    # Calculate new due date (add 14 days from current due date)
    new_due_date = loan["dueAt"] + timedelta(days=14)
    
    # Update loan
    await db.loans.update_one(
        {"_id": loan_id},
        {
            "$set": {
                "dueAt": new_due_date,
                "renewCount": renew_count + 1,
                "status": "active"  # Reset to active if was overdue
            }
        }
    )
    
    # Create renewal transaction
    tx_count = await db.transactions.count_documents({})
    tx_id = f"TX{str(tx_count + 1).zfill(8)}"
    
    transaction_doc = {
        "_id": tx_id,
        "branchId": loan["branchId"],
        "type": "renew",
        "memberId": loan["memberId"],
        "copyId": loan["copyId"],
        "loanId": loan_id,
        "createdAt": current_date,
        "description": f"Renewal #{renew_count + 1}"
    }
    await db.transactions.insert_one(transaction_doc)
    
    # Get updated loan
    updated_loan = await db.loans.find_one({"_id": loan_id})
    return updated_loan

@router.get("/my-loans", response_model=List[LoanResponse])
async def get_my_loans(
    status: Optional[str] = Query(None, regex="^(active|overdue|returned)?$"),
    current_user: dict = Depends(get_current_active_user)
):
    """Get current user's loans"""
    db = await get_database()
    
    filter_query = {"memberId": current_user["_id"]}
    if status:
        filter_query["status"] = status
    
    loans = await db.loans.find(filter_query).sort("borrowedAt", -1).to_list(length=100)
    return loans

@router.get("/", response_model=List[LoanResponse])
async def get_all_loans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    status: Optional[str] = None,
    branchId: Optional[str] = None,
    current_user: dict = Depends(get_current_active_user)
):
    """Get all loans (Admin/Staff only)"""
    if current_user["role"].lower() not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    db = await get_database()
    filter_query = {}
    if status:
        filter_query["status"] = status
    if branchId:
        filter_query["branchId"] = branchId
        
    cursor = db.loans.find(filter_query).sort("borrowedAt", -1).skip(skip).limit(limit)
    loans = await cursor.to_list(length=limit)
    return loans

@router.get("/{loan_id}", response_model=LoanResponse)
async def get_loan(
    loan_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get loan details"""
    db = await get_database()
    
    loan = await db.loans.find_one({"_id": loan_id})
    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")
    
    # Check authorization
    if loan["memberId"] != current_user["_id"] and current_user["role"] not in ["STAFF", "ADMIN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return loan
