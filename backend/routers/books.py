"""
Books Router - Catalog and Search
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from models.book import BookResponse, BookSearchResult, CopyResponse, DigitalLicenseResponse, BookCreate, BookUpdate
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/books", tags=["Books"], dependencies=[Depends(get_current_user)])

@router.get("/search", response_model=List[BookSearchResult])
async def search_books(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, le=100)
):
    """Full-text search for books"""
    db = await get_database()
    
    # Full-text search with score
    cursor = db.books.find(
        {"$text": {"$search": q}},
        {"score": {"$meta": "textScore"}}
    ).sort([("score", {"$meta": "textScore"})]).limit(limit)
    
    books = await cursor.to_list(length=limit)
    
    # Add score to results
    for book in books:
        book["score"] = book.get("score", 0)
    
    return books

@router.get("/", response_model=List[BookResponse])
async def get_books(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, le=100),
    lccCode: Optional[str] = None,
    language: Optional[str] = None
):
    """Get books with pagination and filters"""
    db = await get_database()
    
    # Build filter
    filter_query = {}
    if lccCode:
        filter_query["lccCode"] = lccCode
    if language:
        filter_query["language"] = language
    
    cursor = db.books.find(filter_query).skip(skip).limit(limit)
    books = await cursor.to_list(length=limit)
    
    return books

@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: str):
    """Get book by ID"""
    db = await get_database()
    
    book = await db.books.find_one({"_id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    return book

@router.get("/{book_id}/copies", response_model=List[CopyResponse])
async def get_book_copies(
    book_id: str,
    branchId: Optional[str] = None,
    status: Optional[str] = None
):
    """Get physical copies of a book"""
    db = await get_database()
    
    # Build filter
    filter_query = {"bookId": book_id}
    if branchId:
        filter_query["branchId"] = branchId
    if status:
        filter_query["status"] = status
    
    copies = await db.copies.find(filter_query).to_list(length=100)
    return copies

@router.get("/{book_id}/digital", response_model=Optional[DigitalLicenseResponse])
async def get_digital_license(book_id: str):
    """Get digital license for a book"""
    db = await get_database()
    
    license = await db.digital_licenses.find_one({"bookId": book_id})
    return license

@router.get("/categories/list")
async def get_categories():
    """Get list of book categories with counts"""
    db = await get_database()
    
    pipeline = [
        {"$group": {
            "_id": "$lccCode",
            "name": {"$first": "$lccName"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"count": -1}}
    ]
    
    categories = await db.books.aggregate(pipeline).to_list(length=100)
    return categories

@router.post("/", response_model=BookResponse, status_code=201)
async def create_book(book: BookCreate):
    """Create a new book"""
    db = await get_database()
    
    # Check if book already exists (by ISBN)
    existing_book = await db.books.find_one({"isbn": book.isbn})
    if existing_book:
        raise HTTPException(status_code=400, detail="Book with this ISBN already exists")
    
    book_dict = book.model_dump(by_alias=True)
    
    # Insert book
    new_book = await db.books.insert_one(book_dict)
    created_book = await db.books.find_one({"_id": new_book.inserted_id})
    
    return created_book

@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, book_update: BookUpdate):
    """Update a book"""
    db = await get_database()
    
    # Check if book exists
    existing_book = await db.books.find_one({"_id": book_id})
    if not existing_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Update fields
    update_data = book_update.model_dump(exclude_unset=True)
    
    if update_data:
        await db.books.update_one(
            {"_id": book_id},
            {"$set": update_data}
        )
    
    updated_book = await db.books.find_one({"_id": book_id})
    return updated_book

@router.delete("/{book_id}", status_code=204)
async def delete_book(book_id: str):
    """Delete a book"""
    db = await get_database()
    
    # Check if book exists
    existing_book = await db.books.find_one({"_id": book_id})
    if not existing_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Delete book
    await db.books.delete_one({"_id": book_id})
    
    return None
