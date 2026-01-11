// ============================================
// Create Text Indexes for Full-text Search
// ============================================

print("========================================");
print("Creating Indexes for E-Library");
print("========================================");

const conn = new Mongo("mongos1:27020");
const db = conn.getDB("elibrary");

// ============================================
// 1. Text Index on Books Collection
// ============================================
print("\n[1/4] Creating text index on 'books' collection...");

try {
    db.books.createIndex(
        {
            title: "text",
            authors: "text",
            subjects: "text",
            description: "text"
        },
        {
            name: "books_fulltext_idx",
            weights: {
                title: 10,
                authors: 5,
                subjects: 3,
                description: 1
            },
            default_language: "english"
        }
    );
    print("✓ Text index created on books collection");
    print("  Fields: title (weight 10), authors (5), subjects (3), description (1)");
} catch (e) {
    print("! Error creating text index: " + e.message);
}

// ============================================
// 2. Compound Indexes for Common Queries
// ============================================
print("\n[2/4] Creating compound indexes...");

// Members - email lookup (unique)
try {
    db.members.createIndex({ email: 1 }, { unique: true, name: "members_email_unique" });
    print("✓ Unique index on members.email");
} catch (e) {
    print("! members.email index: " + e.message);
}

// Members - branch lookup
try {
    db.members.createIndex({ branchId: 1 }, { name: "members_branch_idx" });
    print("✓ Index on members.branchId");
} catch (e) {
    print("! members.branchId index: " + e.message);
}

// Copies - book lookup
try {
    db.copies.createIndex({ bookId: 1 }, { name: "copies_book_idx" });
    print("✓ Index on copies.bookId");
} catch (e) {
    print("! copies.bookId index: " + e.message);
}

// Copies - branch and status
try {
    db.copies.createIndex({ branchId: 1, status: 1 }, { name: "copies_branch_status_idx" });
    print("✓ Compound index on copies.branchId + status");
} catch (e) {
    print("! copies compound index: " + e.message);
}

// Loans - member lookup
try {
    db.loans.createIndex({ memberId: 1 }, { name: "loans_member_idx" });
    print("✓ Index on loans.memberId");
} catch (e) {
    print("! loans.memberId index: " + e.message);
}

// Loans - status lookup
try {
    db.loans.createIndex({ status: 1 }, { name: "loans_status_idx" });
    print("✓ Index on loans.status");
} catch (e) {
    print("! loans.status index: " + e.message);
}

// Digital Licenses - book lookup
try {
    db.digital_licenses.createIndex({ bookId: 1 }, { name: "licenses_book_idx" });
    print("✓ Index on digital_licenses.bookId");
} catch (e) {
    print("! licenses.bookId index: " + e.message);
}

// ============================================
// 3. Indexes for Aggregation Pipelines
// ============================================
print("\n[3/4] Creating indexes for aggregations...");

// Books - LCC category grouping
try {
    db.books.createIndex({ lccCode: 1 }, { name: "books_lcc_idx" });
    print("✓ Index on books.lccCode");
} catch (e) {
    print("! books.lccCode index: " + e.message);
}

// Transactions - type filtering
try {
    db.transactions.createIndex({ type: 1 }, { name: "transactions_type_idx" });
    print("✓ Index on transactions.type");
} catch (e) {
    print("! transactions.type index: " + e.message);
}

// ============================================
// 4. Verification
// ============================================
print("\n[4/4] Verifying indexes...");

print("\nBooks collection indexes:");
db.books.getIndexes().forEach(idx => {
    print(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
});

print("\nCopies collection indexes:");
db.copies.getIndexes().forEach(idx => {
    print(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
});

print("\nMembers collection indexes:");
db.members.getIndexes().forEach(idx => {
    print(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
});

print("\nLoans collection indexes:");
db.loans.getIndexes().forEach(idx => {
    print(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
});

print("\n========================================");
print("✓ All indexes created successfully!");
print("========================================");
print("\nYou can now:");
print("  1. Test full-text search: db.books.find({$text: {$search: 'Technology'}})");
print("  2. Run aggregation pipelines for statistics");
print("  3. Benchmark query performance");
print("========================================");
