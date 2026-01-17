# 3. THIẾT KẾ DỮ LIỆU & SHARD KEY

## 3.1. Database Schema

### 3.1.1. Tổng Quan Collections

E-Library database gồm **7 collections chính:**

| Collection | Sharded? | Shard Key | Documents | Mục đích |
|------------|----------|-----------|-----------|----------|
| **branches** | ❌ | N/A | 3 | Danh sách chi nhánh (reference data) |
| **books** | ❌ | N/A | 1,000 | Catalog sách (metadata) |
| **copies** | ✅ | `{barcode: 1}` | 5,000 | Bản sao vật lý |
| **members** | ❌ | N/A | 1,000 | Thông tin thành viên |
| **loans** | ✅ | `{branchId: 1, borrowedAt: 1}` | 3,000 | Giao dịch mượn sách |
| **transactions** | ✅ | `{branchId: 1, createdAt: 1}` | 6,000+ | Lịch sử giao dịch |
| **digital_licenses** | ❌ | N/A | 400 | Licenses sách điện tử |

### 3.1.2. Entity Relationship Diagram

```
┌─────────────────┐
│    branches     │
│  _id (PK)       │ ────┐
│  name           │     │
│  city           │     │
│  address        │     │
│  phone          │     │
│  email          │     │
└─────────────────┘     │
                        │
                        │ branchId (FK)
                        │
    ┌───────────────────┼───────────────────────┐
    │                   │                       │
    ▼                   ▼                       ▼
┌──────────┐      ┌─────────────┐       ┌──────────────┐
│  books   │      │   members   │       │    copies    │
│ _id (PK) │◄────┐│  _id (PK)   │       │  _id (PK)    │
│  title   │     ││  email      │       │  bookId (FK) │───┐
│  authors │     ││  name       │       │  barcode 🔑  │   │
│  isbn    │     ││  branchId   │◄──┐   │  branchId    │   │
│  lccCode │     ││  role       │   │   │  status      │   │
│  subjects│     ││  subscription│  │   └──────────────┘   │
│  ...     │     │└─────────────┘   │                      │
└──────────┘     │                  │                      │
    │            │                  │                      │
    │ bookId(FK) │                  │ memberId (FK)        │
    │            │                  │                      │
    ▼            │                  │                      │
┌───────────────────┐               │                      │
│ digital_licenses  │               │                      │
│  _id (PK)         │               │                      │
│  bookId (FK)      │────┘          │                      │
│  licenseType      │               │                      │
│  concurrent       │               │                      │
└───────────────────┘               │                      │
                                    │                      │
                                    │                      │
                ┌───────────────────┴──────────────────────┘
                │
                ▼
        ┌─────────────────┐         ┌────────────────────┐
        │     loans       │         │   transactions     │
        │  _id (PK)       │←────────│  _id (PK)          │
        │  branchId 🔑    │loanId   │  branchId 🔑       │
        │  memberId (FK)  │  (FK)   │  type              │
        │  copyId (FK)    │         │  memberId (FK)     │
        │  bookId (FK)    │         │  copyId (FK)       │
        │  borrowedAt 🔑  │         │  loanId (FK)       │
        │  dueAt          │         │  createdAt 🔑      │
        │  returnedAt     │         │  amount            │
        │  status         │         └────────────────────┘
        └─────────────────┘

🔑 = Shard Key Field
```

## 3.2. Chi Tiết Schema

### 3.2.1. Collection: branches

**Mục đích:** Lưu thông tin chi nhánh (reference data)

**Schema:**
```javascript
{
  _id: "HN",  // String ID
  name: "Chi nhánh Hà Nội",
  city: "Hà Nội",
  address: "123 Đường Láng, Đống Đa, Hà Nội",
  phone: "024-1234-5678",
  email: "hanoi@elibrary.vn"
}
```

**Tại sao KHÔNG shard?**
- ✅ Dữ liệu nhỏ (chỉ 3 documents)
- ✅ Reference data (ít thay đổi)
- ✅ Mọi query đều cần access

**Indexes:**
```javascript
// Primary key index (tự động)
{ _id: 1 }
```

### 3.2.2. Collection: books

**Mục đích:** Catalog sách (metadata)

**Schema:**
```javascript
{
  _id: "BK000001",
  title: "Introduction to Distributed Systems",
  authors: ["Andrew S. Tanenbaum", "Maarten van Steen"],
  publisher: "Pearson",
  publishYear: 2017,
  isbn: "978-1234567890",
  lccCode: "QA76",  // Library of Congress Classification
  lccName: "Computer Science",
  subjects: ["Distributed Systems", "Computer Science", "Technology"],
  description: "Comprehensive guide to distributed systems...",
  language: "English",
  pages: 768
}
```

**Tại sao KHÔNG shard?**
- ✅ 1000 books = dữ liệu nhỏ (~5-10MB)
- ✅ Metadata không tăng nhanh
- ✅ Full-text search cần scan toàn bộ
- ✅ Aggregations cho analytics đơn giản hơn

**Indexes:**
```javascript
// Text index cho full-text search
{
  title: "text",
  authors: "text",
  subjects: "text",
  description: "text"
}  // weights: title=10, authors=5, subjects=5, description=1

// Compound indexes
{ lccCode: 1, publishYear: -1 }  // Filter by category and year
{ isbn: 1 }  // Unique lookup
{ language: 1 }  // Language filter
```

### 3.2.3. Collection: copies (SHARDED) 🔑

**Mục đích:** Bản sao vật lý của sách

**Shard Key:** `{barcode: 1}`

**Schema:**
```javascript
{
  _id: "CP000001",
  bookId: "BK000001",
  barcode: "BC100000",  // 🔑 SHARD KEY
  branchId: "HN",
  status: "available",  // available | borrowed | maintenance | lost
  condition: "good",    // new | good | fair | poor
  acquiredDate: ISODate("2023-01-15"),
  lastMaintenanceDate: ISODate("2024-01-10")
}
```

**Shard Key Analysis:**

| Tiêu chí | Đánh giá | Giải thích |
|----------|----------|------------|
| **Cardinality** | ⭐⭐⭐⭐⭐ | Mỗi barcode là unique → high cardinality |
| **Write Distribution** | ⭐⭐⭐⭐ | New copies phân bố đều across shards |
| **Query Isolation** | ⭐⭐⭐ | Queries by barcode → targeted; by status → scatter-gather |
| **Monotonicity** | ⭐⭐⭐⭐⭐ | Barcode KHÔNG monotonic (không tăng tuần tự) |

**Chunk Distribution:**

```javascript
// Initial chunks
Chunk 1: { barcode: MinKey } → { barcode: "BC150000" }  // Shard: rsCity
Chunk 2: { barcode: "BC150000" } → { barcode: MaxKey }  // Shard: rsExtra

// Khi data tăng, MongoDB auto-split chunks
Chunk 1.1: MinKey → "BC075000"   // rsCity
Chunk 1.2: "BC075000" → "BC150000" // rsCity
Chunk 2.1: "BC150000" → "BC225000" // rsExtra
Chunk 2.2: "BC225000" → MaxKey   // rsExtra
```

**Indexes:**
```javascript
// Shard key index (required)
{ barcode: 1 }

// Supporting indexes
{ bookId: 1, status: 1 }  // Find available copies of a book
{ branchId: 1, status: 1 }  // Find available copies at branch
{ status: 1 }  // Global availability check
```

**Query Patterns:**

```javascript
// ✅ TARGETED QUERY (shard key present)
db.copies.find({ barcode: "BC100000" })
// → routes to 1 shard only

// ⚠️ SCATTER-GATHER (no shard key)
db.copies.find({ status: "available", branchId: "HN" })
// → queries ALL shards, then filters
```

### 3.2.4. Collection: members

**Mục đích:** Thông tin thành viên

**Schema:**
```javascript
{
  _id: "MB000001",
  email: "user@example.com",  // Unique
  name: "Nguyễn Văn A",
  passwordHash: "$2b$12$...",  // bcrypt hash
  branchId: "HN",
  role: "MEMBER",  // MEMBER | STAFF | ADMIN
  subscription: {
    type: "VIP",  // BASIC | VIP
    startDate: ISODate("2024-01-01"),
    endDate: ISODate("2024-12-31"),
    maxLoans: 10,  // BASIC: 3, VIP: 10
    loanDuration: 30  // days
  },
  createdAt: ISODate("2024-01-01"),
  lastLoginAt: ISODate("2024-01-11")
}
```

**Tại sao KHÔNG shard?**
- ✅ 1000 members = dữ liệu nhỏ
- ✅ Authentication queries cần nhanh (local index better)
- ✅ Không có hotspot (access đều)

**Indexes:**
```javascript
{ email: 1 }  // Unique - for login
{ branchId: 1 }  // Filter by branch
{ "subscription.type": 1 }  // Analytics
```

### 3.2.5. Collection: loans (SHARDED) 🔑

**Mục đích:** Giao dịch mượn sách

**Shard Key:** `{branchId: 1, borrowedAt: 1}` (Compound key)

**Schema:**
```javascript
{
  _id: "LN000001",
  branchId: "HN",  // 🔑 SHARD KEY (prefix)
  memberId: "MB000001",
  copyId: "CP000001",
  bookId: "BK000001",
  borrowedAt: ISODate("2024-01-05T10:30:00Z"),  // 🔑 SHARD KEY (suffix)
  dueAt: ISODate("2024-02-04T10:30:00Z"),
  returnedAt: null,  // null if not returned
  status: "active",  // active | returned | overdue
  renewCount: 0,
  overdueDays: 0,
  fineAmount: 0
}
```

**Shard Key Analysis:**

| Tiêu chí | Đánh giá | Giải thích |
|----------|----------|------------|
| **Cardinality** | ⭐⭐⭐⭐ | branchId: 3 values + timestamp → good cardinality |
| **Write Distribution** | ⭐⭐⭐⭐⭐ | Writes phân bố đều theo branch + time |
| **Query Isolation** | ⭐⭐⭐⭐⭐ | Queries thường filter by branchId → targeted |
| **Monotonicity** | ⭐⭐⭐ | borrowedAt tăng dần → có thể hotspot, nhưng prefix branchId giảm thiểu |

**Chunk Distribution Strategy:**

```javascript
// Chunks được split theo branchId TRƯỚC
Chunk 1: {branchId: MinKey, borrowedAt: MinKey} → {branchId: "HN", borrowedAt: MinKey}
Chunk 2: {branchId: "HN", borrowedAt: MinKey} → {branchId: "HP", borrowedAt: MinKey}
Chunk 3: {branchId: "HP", borrowedAt: MinKey} → {branchId: "DN", borrowedAt: MinKey}
Chunk 4: {branchId: "DN", borrowedAt: MinKey} → {branchId: MaxKey, borrowedAt: MaxKey}

// Khi chunk lớn, split theo borrowedAt
Chunk 2.1: {HN, MinKey} → {HN, "2024-01-01"}
Chunk 2.2: {HN, "2024-01-01"} → {HN, "2024-06-01"}
Chunk 2.3: {HN, "2024-06-01"} → {HN, MaxKey}
```

**Indexes:**
```javascript
// Shard key index (required)
{ branchId: 1, borrowedAt: 1 }

// Supporting indexes
{ memberId: 1, status: 1 }  // User's active loans
{ copyId: 1 }  // Check if copy is borrowed
{ status: 1, dueAt: 1 }  // Find overdue loans
{ branchId: 1, status: 1, returnedAt: 1 }  // Branch stats
```

**Query Patterns:**
```javascript
// ✅ TARGETED (có branchId)
db.loans.find({ branchId: "HN", status: "active" })
// → routes to chunks của HN only

// ✅ SEMI-TARGETED (có branchId + range)
db.loans.find({
  branchId: "HN",
  borrowedAt: { $gte: ISODate("2024-01-01"), $lt: ISODate("2024-02-01") }
})
// → routes to specific chunks

// ⚠️ SCATTER-GATHER (no branchId)
db.loans.find({ memberId: "MB000001" })
// → queries all shards
```

### 3.2.6. Collection: transactions (SHARDED) 🔑

**Mục đích:** Audit trail của mọi giao dịch

**Shard Key:** `{branchId: 1, createdAt: 1}` (tương tự loans)

**Schema:**
```javascript
{
  _id: "TX00000001",
  branchId: "HN",  // 🔑 SHARD KEY
  type: "borrow",  // borrow | return | fine | renew
  memberId: "MB000001",
  copyId: "CP000001",
  loanId: "LN000001",
  createdAt: ISODate("2024-01-05T10:30:00Z"),  // 🔑 SHARD KEY
  
  // Optional fields (for fine transactions)
  amount: 0,
  description: "",
  status: "completed"  // pending | completed | cancelled
}
```

**Lý do chọn shard key giống loans:**
- ✅ Access pattern tương tự (theo branch + time range)
- ✅ Co-location: Loans và Transactions liên quan nằm cùng shard
- ✅ Analytics queries hiệu quả hơn

**Indexes:**
```javascript
{ branchId: 1, createdAt: 1 }  // Shard key
{ loanId: 1 }  // Find transactions for a loan
{ memberId: 1, createdAt: -1 }  // User history
{ type: 1, createdAt: -1 }  // Transaction type analytics
```

### 3.2.7. Collection: digital_licenses

**Mục đích:** Licenses cho sách điện tử

**Schema:**
```javascript
{
  _id: "DL000001",
  bookId: "BK000001",
  licenseType: "unlimited",  // unlimited | concurrent | subscription
  concurrentUsers: null,  // null for unlimited, number for concurrent
  startDate: ISODate("2024-01-01"),
  expiryDate: null,  // null for permanent
  provider: "Publisher Direct",
  accessURL: "https://ebooks.elibrary.vn/book/BK000001"
}
```

**Tại sao KHÔNG shard?**
- ✅ Dữ liệu rất nhỏ (400 licenses)
- ✅ Read-heavy workload
- ✅ Không có growth nhanh

## 3.3. Index Strategy

### 3.3.1. Index Types Summary

| Collection | Index Type | Fields | Purpose |
|------------|------------|--------|---------|
| **books** | Text | title, authors, subjects, description | Full-text search |
| | Compound | lccCode, publishYear | Category filtering |
| | Single | isbn | Unique lookup |
| **copies** | Single | barcode | Shard key + unique |
| | Compound | bookId, status | Available copies |
| | Compound | branchId, status | Branch inventory |
| **members** | Unique | email | Authentication |
| | Single | branchId | Branch members |
| **loans** | Compound | branchId, borrowedAt | Shard key |
| | Compound | memberId, status | User loans |
| | Compound | status, dueAt | Overdue detection |
| **transactions** | Compound | branchId, createdAt | Shard key |
| | Single | loanId | Loan history |

### 3.3.2. Text Index Details

**books collection:**
```javascript
db.books.createIndex(
  {
    title: "text",
    authors: "text",
    subjects: "text",
    description: "text"
  },
  {
    weights: {
      title: 10,        // Highest relevance
      authors: 5,
      subjects: 5,
      description: 1    // Lowest relevance
    },
    name: "books_text_index"
  }
)
```

**Query với text index:**
```javascript
db.books.find(
  { $text: { $search: "distributed systems" } },
  { score: { $meta: "textScore" } }
).sort({ score: { $meta: "textScore" } })

// Result example:
[
  { title: "Introduction to Distributed Systems", score: 8.5 },
  { title: "Distributed Database Systems", score: 7.2 },
  { title: "Computer Systems Engineering", score: 2.1 }
]
```

### 3.3.3. Compound Index Strategy

**Principle:** Đặt **equality filters** trước, **range filters** sau

**Example: loans collection**
```javascript
// Query pattern:
db.loans.find({
  branchId: "HN",  // Equality
  status: "active",  // Equality
  borrowedAt: { $gte: date1, $lt: date2 }  // Range
})

// Optimal index:
{ branchId: 1, status: 1, borrowedAt: 1 }
```

## 3.4. Data Distribution Analysis

### 3.4.1. Copies Distribution

```
Total Copies: 5000

Shard 1 (rsCity):  ~2500 copies
├─ HN branch:      ~850 copies
├─ HP branch:      ~850 copies
└─ DN branch:      ~800 copies

Shard 2 (rsExtra): ~2500 copies
└─ Mixed/Overflow

Distribution by barcode shard key (automatic)
```

### 3.4.2. Loans Distribution

```
Total Loans: 3000

By branchId (shard key prefix):
├─ HN: 1200 loans → rsCity
├─ HP: 1000 loans → rsCity  
└─ DN: 800 loans → rsCity

Temporal distribution (by borrowedAt):
├─ Q1 2024: 800 loans
├─ Q2 2024: 750 loans
├─ Q3 2024: 700 loans
└─ Q4 2024: 750 loans

MongoDB auto-splits by time when chunks > 64MB
```

### 3.4.3. Chunk Range Visualization

```
Collection: copies (shard key: {barcode: 1})

Chunk Map:
┌──────────────────────────────────────┐
│ MinKey ──────────── "BC150000"      │ → rsCity (Chunk 1)
│                                      │
│ 2500 documents                       │
│ Size: ~15MB                          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ "BC150000" ───────── MaxKey          │ → rsExtra (Chunk 2)
│                                      │
│ 2500 documents                       │
│ Size: ~15MB                          │
└──────────────────────────────────────┘

Total: 2 chunks, balanced distribution
```

## 3.5. Shard Key Best Practices Applied

### 3.5.1. Checklist

| Practice | copies | loans | transactions |
|----------|--------|-------|--------------|
| High cardinality | ✅ barcode unique | ✅ branch+time | ✅ branch+time |
| Write distribution | ✅ Random barcode | ✅ Multi-branch | ✅ Multi-branch |
| Query isolation | ⚠️ Some scatter | ✅ Branch-based | ✅ Branch-based |
| No hot shards | ✅ Balanced | ✅ Balanced | ✅ Balanced |
| Immutable key | ✅ Barcode fixed | ✅ Fields fixed | ✅ Fields fixed |

### 3.5.2. Anti-patterns Avoided

❌ **Monotonically increasing ID** (`_id: ObjectId()`)
- Tất cả writes đi vào 1 shard (hotspot)

❌ **Low cardinality field** (`status: "available"`)
- Chỉ vài giá trị → poor distribution

❌ **Mutable field** (`currentBranchId`)
- Shard key PHẢI immutable

✅ **Our choices:**
- `barcode`: Random, immutable, high cardinality
- `branchId + timestamp`: Good distribution, query-friendly

---

**Tiếp theo:** [Thiết Kế API & Luồng Nghiệp Vụ](#4-thiết-kế-api--luồng-nghiệp-vụ)
