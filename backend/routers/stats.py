"""
Statistics Router - Aggregation Pipelines for Dashboard
"""

from fastapi import APIRouter, Query, Depends
from typing import List, Optional
from database import get_database
from middleware.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get comprehensive dashboard statistics"""
    db = await get_database()
    
    # Total counts
    total_books = await db.books.count_documents({})
    total_copies = await db.copies.count_documents({})
    total_members = await db.members.count_documents({})
    total_loans = await db.loans.count_documents({})
    
    # Active loans
    active_loans = await db.loans.count_documents({"status": {"$in": ["active", "overdue"]}})
    
    # Available copies
    available_copies = await db.copies.count_documents({"status": "available"})
    
    return {
        "totalBooks": total_books,
        "totalCopies": total_copies,
        "totalMembers": total_members,
        "totalLoans": total_loans,
        "activeLoans": active_loans,
        "availableCopies": available_copies
    }

@router.get("/books-by-category")
async def get_books_by_category():
    """Get book distribution by category"""
    db = await get_database()
    
    pipeline = [
        {"$group": {
            "_id": "$lccName",
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    
    results = await db.books.aggregate(pipeline).to_list(length=10)
    return results

@router.get("/loans-by-branch")
async def get_loans_by_branch():
    """Get loan statistics by branch"""
    db = await get_database()
    
    pipeline = [
        {"$group": {
            "_id": "$branchId",
            "totalLoans": {"$sum": 1},
            "activeLoans": {
                "$sum": {
                    "$cond": [{"$in": ["$status", ["active", "overdue"]]}, 1, 0]
                }
            }
        }},
        {"$sort": {"totalLoans": -1}}
    ]
    
    results = await db.loans.aggregate(pipeline).to_list(length=10)
    return results

@router.get("/transaction-trends")
async def get_transaction_trends(days: int = Query(30, le=365)):
    """Get transaction trends over time"""
    db = await get_database()
    
    start_date = datetime.now() - timedelta(days=days)
    
    pipeline = [
        {"$match": {"createdAt": {"$gte": start_date}}},
        {"$group": {
            "_id": {
                "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$createdAt"}},
                "type": "$type"
            },
            "count": {"$sum": 1}
        }},
        {"$sort": {"_id.date": 1}}
    ]
    
    results = await db.transactions.aggregate(pipeline).to_list(length=1000)
    return results

@router.get("/top-borrowed-books")
async def get_top_borrowed_books(limit: int = Query(10, le=50)):
    """Get most borrowed books"""
    db = await get_database()
    
    pipeline = [
        {"$group": {
            "_id": "$bookId",
            "borrowCount": {"$sum": 1}
        }},
        {"$sort": {"borrowCount": -1}},
        {"$limit": limit},
        {"$lookup": {
            "from": "books",
            "localField": "_id",
            "foreignField": "_id",
            "as": "book"
        }},
        {"$unwind": "$book"},
        {"$project": {
            "bookId": "$_id",
            "title": "$book.title",
            "authors": "$book.authors",
            "borrowCount": 1
        }}
    ]
    
    results = await db.loans.aggregate(pipeline).to_list(length=limit)
    return results

@router.get("/member-activity")
async def get_member_activity():
    """Get member activity statistics"""
    db = await get_database()
    
    pipeline = [
        {"$group": {
            "_id": "$subscription.tier",
            "count": {"$sum": 1},
            "active": {
                "$sum": {
                    "$cond": ["$subscription.active", 1, 0]
                }
            }
        }}
    ]
    
    results = await db.members.aggregate(pipeline).to_list(length=10)
    return results

@router.get("/branch-performance")
async def get_branch_performance():
    """Get comprehensive branch performance metrics"""
    db = await get_database()
    
    branches = await db.branches.find({}).to_list(length=10)
    
    performance = []
    for branch in branches:
        branch_id = branch["_id"]
        
        # Get metrics
        total_copies = await db.copies.count_documents({"branchId": branch_id})
        available_copies = await db.copies.count_documents({"branchId": branch_id, "status": "available"})
        total_members = await db.members.count_documents({"branchId": branch_id})
        total_loans = await db.loans.count_documents({"branchId": branch_id})
        active_loans = await db.loans.count_documents({
            "branchId": branch_id,
            "status": {"$in": ["active", "overdue"]}
        })
        
        performance.append({
            "branchId": branch_id,
            "branchName": branch["name"],
            "city": branch["city"],
            "totalCopies": total_copies,
            "availableCopies": available_copies,
            "totalMembers": total_members,
            "totalLoans": total_loans,
            "activeLoans": active_loans,
            "utilizationRate": round((total_copies - available_copies) / total_copies * 100, 2) if total_copies > 0 else 0
        })
    
    return performance
