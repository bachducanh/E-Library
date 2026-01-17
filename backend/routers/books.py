"""
Books Router - Catalog and Search
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from typing import List, Optional
from models.book import BookResponse, BookSearchResult, CopyResponse, DigitalLicenseResponse, BookCreate, BookUpdate, CopyCreate
from database import get_database
from middleware.auth import get_current_user

router = APIRouter(prefix="/books", tags=["Books"])

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
    
    cursor = db.books.find(filter_query).sort("_id", -1).skip(skip).limit(limit)
    books = await cursor.to_list(length=limit)
    
    return books

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

@router.post("/{book_id}/copies", response_model=CopyResponse, status_code=201)
async def create_copy(book_id: str, copy: CopyCreate, current_user: dict = Depends(get_current_user)):
    """Add a physical copy to the book (Admin only)"""
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = await get_database()
    
    # Verify book exists
    book = await db.books.find_one({"_id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # Generate unique barcode (e.g., BK001-C001)
    # Count existing copies for this book to append suffix
    count = await db.copies.count_documents({"bookId": book_id})
    barcode = f"{book_id}-C{str(count + 1).zfill(3)}"
    
    # Create copy document
    copy_doc = {
        "_id": barcode, # Use barcode as ID for simplicity or generate separate ID? 
                        # Existing data might use ObjectId or String. 
                        # Let's generate a new ID explicitly if needed, but barcode is unique enough? 
                        # The `CopyResponse` expects `id` (alias _id).
                        # Let's simple format: ID = barcode.
        "bookId": book_id,
        "branchId": copy.branchId,
        "barcode": barcode,
        "status": "available",
        "condition": copy.condition
    }
    
    await db.copies.insert_one(copy_doc)
    
    created_copy = await db.copies.find_one({"_id": barcode})
    return created_copy

@router.get("/{book_id}/digital", response_model=Optional[DigitalLicenseResponse])
async def get_digital_license(book_id: str):
    """Get digital license for a book"""
    db = await get_database()
    
    license = await db.digital_licenses.find_one({"bookId": book_id})
    return license


@router.post("/", response_model=BookResponse, status_code=201)
async def create_book(book: BookCreate, current_user: dict = Depends(get_current_user)):
    """Create a new book (Admin only)"""
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = await get_database()
    
    # Check if book already exists (by ISBN)
    existing_book = await db.books.find_one({"isbn": book.isbn})
    if existing_book:
        raise HTTPException(status_code=400, detail="Book with this ISBN already exists")
    
    book_dict = book.model_dump(by_alias=True)
    
    # Generate custom ID (BKxxxx)
    count = await db.books.count_documents({})
    book_id = f"BK{str(count + 1).zfill(3)}"
    book_dict["_id"] = book_id
    
    # Insert book
    await db.books.insert_one(book_dict)
    created_book = await db.books.find_one({"_id": book_id})
    
    return created_book

@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: str, book_update: BookUpdate, current_user: dict = Depends(get_current_user)):
    """Update a book (Admin only)"""
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
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
async def delete_book(book_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a book (Admin only)"""
    if current_user["role"].lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    
    db = await get_database()
    
    # Check if book exists
    existing_book = await db.books.find_one({"_id": book_id})
    if not existing_book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Delete book
    await db.books.delete_one({"_id": book_id})
    
    return None
