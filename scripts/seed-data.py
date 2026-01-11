"""
E-Library Data Seeding Script
Generates realistic data for the distributed library system
"""

import random
from datetime import datetime, timedelta
from pymongo import MongoClient
from faker import Faker
import bcrypt

# Initialize Faker
fake = Faker(['vi_VN', 'en_US'])

# MongoDB connection (via mongos)
MONGO_URI = "mongodb://localhost:27020/"
client = MongoClient(MONGO_URI)
db = client['elibrary']

# LCC Classification System
LCC_CATEGORIES = {
    "A": {"name": "General Works", "subjects": ["Encyclopedias", "Reference", "Museums"]},
    "B": {"name": "Philosophy & Psychology", "subjects": ["Philosophy", "Psychology", "Ethics", "Religion"]},
    "D": {"name": "History", "subjects": ["World History", "European History", "Asian History"]},
    "DS": {"name": "Asian History", "subjects": ["Vietnam History", "Chinese History", "Japanese History"]},
    "G": {"name": "Geography & Recreation", "subjects": ["Geography", "Travel", "Sports"]},
    "H": {"name": "Social Sciences", "subjects": ["Economics", "Business", "Sociology", "Commerce"]},
    "J": {"name": "Political Science", "subjects": ["Politics", "Law", "Government"]},
    "K": {"name": "Law", "subjects": ["Vietnamese Law", "International Law", "Civil Law"]},
    "L": {"name": "Education", "subjects": ["Education", "Teaching", "Learning"]},
    "M": {"name": "Music", "subjects": ["Music Theory", "Musical Scores", "Music History"]},
    "N": {"name": "Fine Arts", "subjects": ["Art", "Architecture", "Painting", "Sculpture"]},
    "P": {"name": "Language & Literature", "subjects": ["Literature", "Fiction", "Poetry", "Drama"]},
    "PL": {"name": "Asian Literature", "subjects": ["Vietnamese Literature", "Chinese Literature"]},
    "Q": {"name": "Science", "subjects": ["Mathematics", "Physics", "Chemistry", "Biology"]},
    "QA": {"name": "Mathematics & Computer Science", "subjects": ["Computer Science", "Programming", "Algorithms"]},
    "R": {"name": "Medicine", "subjects": ["Medicine", "Health", "Nursing", "Pharmacy"]},
    "S": {"name": "Agriculture", "subjects": ["Agriculture", "Farming", "Horticulture"]},
    "T": {"name": "Technology", "subjects": ["Engineering", "Technology", "Manufacturing"]},
    "TX": {"name": "Home Economics", "subjects": ["Cooking", "Nutrition", "Home Management"]},
}

# Vietnamese book titles by category
VIETNAMESE_BOOKS = {
    "DS": [
        "Đại Việt Sử Ký Toàn Thư",
        "Lịch Sử Việt Nam",
        "Chiến Tranh Việt Nam",
        "Văn Hóa Việt Nam",
        "Hồ Chí Minh Toàn Tập"
    ],
    "PL": [
        "Truyện Kiều - Nguyễn Du",
        "Số Đỏ - Vũ Trọng Phụng",
        "Tắt Đèn - Ngô Tất Tố",
        "Chí Phèo - Nam Cao",
        "Lão Hạc - Nam Cao"
    ],
    "K": [
        "Luật Dân Sự 2015",
        "Luật Hình Sự Việt Nam",
        "Hiến Pháp 2013",
        "Luật Lao Động",
        "Luật Đất Đai"
    ]
}

# English book title templates
ENGLISH_BOOK_TEMPLATES = {
    "QA": [
        "Introduction to {subject}",
        "Advanced {subject}",
        "{subject} Programming",
        "Mastering {subject}",
        "{subject} for Beginners"
    ],
    "H": [
        "Principles of {subject}",
        "{subject} Theory and Practice",
        "Modern {subject}",
        "{subject} in the 21st Century"
    ],
    "T": [
        "{subject} Engineering",
        "Fundamentals of {subject}",
        "{subject} Design",
        "Applied {subject}"
    ]
}

PUBLISHERS = [
    "NXB Kim Đồng", "NXB Trẻ", "NXB Văn Học", "NXB Giáo Dục",
    "O'Reilly Media", "Pearson", "McGraw-Hill", "Wiley",
    "Springer", "Cambridge University Press", "Oxford University Press"
]

BRANCHES = ["HN", "HP", "DN"]

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def generate_books(count=1000):
    """Generate realistic books with LCC classification"""
    print(f"\n[1/5] Generating {count} books...")
    books = []
    
    for i in range(1, count + 1):
        # Select random category
        lcc_code = random.choice(list(LCC_CATEGORIES.keys()))
        category = LCC_CATEGORIES[lcc_code]
        
        # Generate title
        if lcc_code in VIETNAMESE_BOOKS and random.random() < 0.3:
            # 30% Vietnamese books for relevant categories
            title = random.choice(VIETNAMESE_BOOKS[lcc_code])
            authors = [fake.name()]
        elif lcc_code in ENGLISH_BOOK_TEMPLATES:
            template = random.choice(ENGLISH_BOOK_TEMPLATES[lcc_code])
            subject = random.choice(category["subjects"])
            title = template.format(subject=subject)
            authors = [fake.name() for _ in range(random.randint(1, 3))]
        else:
            title = f"{category['name']} - Volume {i % 10 + 1}"
            authors = [fake.name() for _ in range(random.randint(1, 2))]
        
        # Generate ISBN
        isbn = f"978-{random.randint(1000000000, 9999999999)}"
        
        book = {
            "_id": f"BK{str(i).zfill(6)}",
            "isbn": isbn,
            "title": title,
            "authors": authors,
            "lccCode": lcc_code,
            "lccName": category["name"],
            "subjects": random.sample(category["subjects"], min(2, len(category["subjects"]))),
            "description": f"A comprehensive guide to {category['name'].lower()}. {fake.text(max_nb_chars=200)}",
            "publisher": random.choice(PUBLISHERS),
            "publishedYear": random.randint(2000, 2024),
            "pages": random.randint(100, 800)
            # Note: language field removed to avoid conflict with text index
        }
        books.append(book)
    
    db.books.insert_many(books)
    print(f"✓ Inserted {len(books)} books")
    return books

def generate_copies(books, count=5000):
    """Generate physical copies distributed across branches"""
    print(f"\n[2/5] Generating {count} physical copies...")
    copies = []
    barcode_counter = 100000
    
    for i in range(count):
        book = random.choice(books)
        branch = random.choice(BRANCHES)
        
        # Status distribution: 90% available, 10% borrowed
        status = "available" if random.random() < 0.9 else "borrowed"
        
        copy = {
            "_id": f"CP{str(i+1).zfill(6)}",
            "bookId": book["_id"],
            "branchId": branch,
            "barcode": f"BC{barcode_counter}",
            "status": status,
            "condition": random.choice(["New", "Good", "Good", "Fair"]),
            "acquiredDate": datetime.combine(fake.date_between(start_date='-5y', end_date='today'), datetime.min.time())
        }
        copies.append(copy)
        barcode_counter += 1
    
    db.copies.insert_many(copies)
    print(f"✓ Inserted {len(copies)} copies")
    return copies

def generate_members(count=1000):
    """Generate members with subscription tiers"""
    print(f"\n[3/5] Generating {count} members...")
    members = []
    
    for i in range(1, count + 1):
        # Branch distribution: HN 50%, HP 25%, DN 25%
        branch = random.choices(BRANCHES, weights=[50, 25, 25])[0]
        
        # Subscription tier: 70% BASIC, 30% VIP
        tier = "VIP" if random.random() < 0.3 else "BASIC"
        
        # Subscription status: 90% active, 10% inactive
        active = random.random() < 0.9
        
        member = {
            "_id": f"MEM{str(i).zfill(6)}",
            "email": f"member{i}@example.com",
            "passwordHash": hash_password("password123"),
            "fullName": fake.name(),
            "phone": fake.phone_number(),
            "branchId": branch,
            "role": "STAFF" if i % 50 == 0 else "MEMBER",  # 2% staff
            "subscription": {
                "tier": tier,
                "active": active,
                "startDate": datetime.combine(fake.date_between(start_date='-2y', end_date='today'), datetime.min.time()),
                "endDate": datetime.combine(fake.date_between(start_date='today', end_date='+1y'), datetime.min.time()),
                "maxLoans": 10 if tier == "VIP" else 3,
                "loanDuration": 30 if tier == "VIP" else 14
            },
            "joinedAt": fake.date_time_between(start_date='-3y', end_date='now'),
            "address": fake.address()
        }
        members.append(member)
    
    db.members.insert_many(members)
    print(f"✓ Inserted {len(members)} members")
    
    # Create admin user
    admin = {
        "_id": "ADMIN001",
        "email": "admin@elibrary.vn",
        "passwordHash": hash_password("admin123"),
        "fullName": "System Administrator",
        "phone": "0900000000",
        "branchId": "HN",
        "role": "ADMIN",
        "subscription": {
            "tier": "VIP",
            "active": True,
            "startDate": datetime.now(),
            "endDate": datetime.now() + timedelta(days=3650),
            "maxLoans": 999,
            "loanDuration": 999
        },
        "joinedAt": datetime.now()
    }
    db.members.insert_one(admin)
    print("✓ Created admin user (email: admin@elibrary.vn, password: admin123)")
    
    return members

def generate_loans_and_transactions(members, copies, loan_count=3000):
    """Generate loans and corresponding transactions"""
    print(f"\n[4/5] Generating {loan_count} loans and transactions...")
    loans = []
    transactions = []
    tx_counter = 1
    
    # Filter only member role users
    member_users = [m for m in members if m["role"] == "MEMBER"]
    
    for i in range(1, loan_count + 1):
        member = random.choice(member_users)
        
        # Find copies from member's branch
        branch_copies = [c for c in copies if c["branchId"] == member["branchId"]]
        if not branch_copies:
            continue
        
        copy = random.choice(branch_copies)
        
        # Random borrow date in past 90 days
        borrowed_at = fake.date_time_between(start_date='-90d', end_date='now')
        due_at = borrowed_at + timedelta(days=member["subscription"]["loanDuration"])
        
        # 66% returned, 34% still active/overdue
        returned = random.random() < 0.66
        
        if returned:
            return_date = borrowed_at + timedelta(days=random.randint(1, member["subscription"]["loanDuration"] + 5))
            status = "returned"
        else:
            return_date = None
            status = "overdue" if due_at < datetime.now() else "active"
        
        loan = {
            "_id": f"LN{str(i).zfill(6)}",
            "branchId": member["branchId"],
            "memberId": member["_id"],
            "copyId": copy["_id"],
            "bookId": copy["bookId"],
            "borrowedAt": borrowed_at,
            "dueAt": due_at,
            "returnedAt": return_date,
            "status": status,
            "renewCount": random.randint(0, 2) if status != "returned" else 0
        }
        loans.append(loan)
        
        # Borrow transaction
        transactions.append({
            "_id": f"TX{str(tx_counter).zfill(8)}",
            "branchId": member["branchId"],
            "type": "borrow",
            "memberId": member["_id"],
            "copyId": copy["_id"],
            "loanId": loan["_id"],
            "createdAt": borrowed_at
        })
        tx_counter += 1
        
        # Return transaction
        if returned:
            transactions.append({
                "_id": f"TX{str(tx_counter).zfill(8)}",
                "branchId": member["branchId"],
                "type": "return",
                "memberId": member["_id"],
                "copyId": copy["_id"],
                "loanId": loan["_id"],
                "createdAt": return_date
            })
            tx_counter += 1
    
    db.loans.insert_many(loans)
    print(f"✓ Inserted {len(loans)} loans")
    
    db.transactions.insert_many(transactions)
    print(f"✓ Inserted {len(transactions)} transactions")

def generate_digital_licenses(books):
    """Generate digital licenses for some books"""
    print(f"\n[5/5] Generating digital licenses...")
    licenses = []
    
    # 40% of books have digital versions
    digital_books = random.sample(books, int(len(books) * 0.4))
    
    for i, book in enumerate(digital_books, 1):
        license = {
            "_id": f"DL{str(i).zfill(6)}",
            "bookId": book["_id"],
            "vendor": random.choice(["O'Reilly", "Springer", "IEEE", "ACM"]),
            "licenseType": random.choice(["UNLIMITED", "CONCURRENT_USER"]),
            "maxConcurrentUsers": random.randint(3, 10) if random.random() < 0.5 else None,
            "url": f"https://ebooks.elibrary.vn/{book['_id']}",
            "acquiredDate": datetime.combine(fake.date_between(start_date='-2y', end_date='today'), datetime.min.time()),
            "expiryDate": datetime.combine(fake.date_between(start_date='today', end_date='+2y'), datetime.min.time())
        }
        licenses.append(license)
    
    if licenses:
        db.digital_licenses.insert_many(licenses)
        print(f"✓ Inserted {len(licenses)} digital licenses")

def print_summary():
    """Print data summary"""
    print("\n" + "="*50)
    print("DATA SEEDING SUMMARY")
    print("="*50)
    
    print(f"\nBooks:              {db.books.count_documents({})}")
    print(f"Copies:             {db.copies.count_documents({})}")
    print(f"Members:            {db.members.count_documents({})}")
    print(f"Loans:              {db.loans.count_documents({})}")
    print(f"Transactions:       {db.transactions.count_documents({})}")
    print(f"Digital Licenses:   {db.digital_licenses.count_documents({})}")
    
    print("\nDistribution by Branch:")
    for branch_id in BRANCHES:
        branch = db.branches.find_one({"_id": branch_id})
        copies_count = db.copies.count_documents({"branchId": branch_id})
        members_count = db.members.count_documents({"branchId": branch_id})
        loans_count = db.loans.count_documents({"branchId": branch_id})
        
        print(f"  {branch['name']}:")
        print(f"    Copies: {copies_count}, Members: {members_count}, Loans: {loans_count}")
    
    print("\nBooks by Category:")
    pipeline = [
        {"$group": {"_id": "$lccName", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10}
    ]
    for cat in db.books.aggregate(pipeline):
        print(f"  {cat['_id']}: {cat['count']} books")
    
    print("\n" + "="*50)
    print("✓ Data seeding completed successfully!")
    print("="*50)
    print("\nDefault credentials:")
    print("  Admin: admin@elibrary.vn / admin123")
    print("  Member: member1@example.com / password123")
    print("\nMongoDB Compass: mongodb://localhost:27020/")
    print("="*50)

if __name__ == "__main__":
    print("="*50)
    print("E-LIBRARY DATA SEEDING")
    print("="*50)
    print("\nThis will generate ~10,000 records")
    print("Connecting to MongoDB at:", MONGO_URI)
    
    try:
        # Test connection
        client.admin.command('ping')
        print("✓ Connected to MongoDB")
        
        # Clear existing data
        print("\nClearing existing data...")
        db.books.delete_many({})
        db.copies.delete_many({})
        db.members.delete_many({})
        db.loans.delete_many({})
        db.transactions.delete_many({})
        db.digital_licenses.delete_many({})
        print("✓ Cleared old data")
        
        # Generate data
        books = generate_books(1000)
        copies = generate_copies(books, 5000)
        members = generate_members(1000)
        generate_loans_and_transactions(members, copies, 3000)
        generate_digital_licenses(books)
        
        # Print summary
        print_summary()
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        client.close()
