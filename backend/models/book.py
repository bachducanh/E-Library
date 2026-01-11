"""
Pydantic models for books
"""

from typing import List, Optional, Any, Annotated
from pydantic import BaseModel, Field, BeforeValidator

# Helper to convert ObjectId to str
PyObjectId = Annotated[str, BeforeValidator(str)]

class BookBase(BaseModel):
    isbn: str
    title: str
    authors: List[str]
    lccCode: str
    lccName: str
    subjects: List[str]
    description: str
    publisher: str
    publishedYear: int
    pages: Optional[int] = None
    language: str = "en"

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    isbn: Optional[str] = None
    title: Optional[str] = None
    authors: Optional[List[str]] = None
    lccCode: Optional[str] = None
    lccName: Optional[str] = None
    subjects: Optional[List[str]] = None
    description: Optional[str] = None
    publisher: Optional[str] = None
    publishedYear: Optional[int] = None
    pages: Optional[int] = None
    language: Optional[str] = None

class BookResponse(BookBase):
    id: PyObjectId = Field(alias="_id")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            # This is optional in v2 but good for safety if using .json()
        }

class BookSearchResult(BookResponse):
    score: Optional[float] = None

class CopyResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    bookId: str
    branchId: str
    barcode: str
    status: str
    condition: str
    
    class Config:
        populate_by_name = True

class DigitalLicenseResponse(BaseModel):
    id: PyObjectId = Field(alias="_id")
    bookId: str
    vendor: str
    licenseType: str
    maxConcurrentUsers: Optional[int] = None
    url: str
    
    class Config:
        populate_by_name = True
