import requests
import json
import sys

try:
    response = requests.get("http://localhost:8000/openapi.json")
    if response.status_code != 200:
        print(f"Failed to fetch openapi.json: {response.status_code}")
        sys.exit(1)
        
    openapi = response.json()
    paths = openapi.get("paths", {})
    
    missing = []
    
    if "/books/" not in paths or "post" not in paths["/books/"]:
        missing.append("POST /books/")
        
    if "/books/{book_id}" not in paths or "put" not in paths["/books/{book_id}"]:
        missing.append("PUT /books/{book_id}")
        
    if "/books/{book_id}" not in paths or "delete" not in paths["/books/{book_id}"]:
        missing.append("DELETE /books/{book_id}")
        
    if missing:
        print(f"Missing endpoints: {missing}")
        sys.exit(1)
        
    print("All endpoints found!")
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
