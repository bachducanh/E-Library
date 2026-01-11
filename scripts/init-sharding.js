// ============================================
// MongoDB Sharded Cluster Initialization Script
// ============================================

print("========================================");
print("Starting MongoDB Sharded Cluster Setup");
print("========================================");

// ============================================
// STEP 1: Initialize Config Server Replica Set
// ============================================
print("\n[1/6] Initializing Config Server Replica Set (cfgRS)...");

try {
  const cfgConn = new Mongo("cfg1:27117");
  const cfgDB = cfgConn.getDB("admin");
  
  const cfgConfig = {
    _id: "cfgRS",
    configsvr: true,
    members: [
      { _id: 0, host: "cfg1:27117" },
      { _id: 1, host: "cfg2:27118" },
      { _id: 2, host: "cfg3:27119" }
    ]
  };
  
  cfgDB.runCommand({ replSetInitiate: cfgConfig });
  print("✓ Config Server RS initiated");
  
  // Wait for primary election
  print("  Waiting for primary election...");
  sleep(10000);
} catch (e) {
  print("! Config RS might already be initialized: " + e.message);
}

// ============================================
// STEP 2: Initialize Shard 1 Replica Set (rsCity)
// ============================================
print("\n[2/6] Initializing Shard 1 Replica Set (rsCity - HN/HP/DN)...");

try {
  const cityConn = new Mongo("hn1:27017");
  const cityDB = cityConn.getDB("admin");
  
  const cityConfig = {
    _id: "rsCity",
    members: [
      { _id: 0, host: "hn1:27017", priority: 2 },  // Hà Nội - Higher priority
      { _id: 1, host: "hp1:27018", priority: 1 },  // Hải Phòng
      { _id: 2, host: "dn1:27019", priority: 1 }   // Đà Nẵng
    ]
  };
  
  cityDB.runCommand({ replSetInitiate: cityConfig });
  print("✓ rsCity initiated with priority: HN(2) > HP(1) = DN(1)");
  
  print("  Waiting for primary election...");
  sleep(10000);
} catch (e) {
  print("! rsCity might already be initialized: " + e.message);
}

// ============================================
// STEP 3: Initialize Shard 2 Replica Set (rsExtra)
// ============================================
print("\n[3/6] Initializing Shard 2 Replica Set (rsExtra)...");

try {
  const extraConn = new Mongo("ex1:27217");
  const extraDB = extraConn.getDB("admin");
  
  const extraConfig = {
    _id: "rsExtra",
    members: [
      { _id: 0, host: "ex1:27217", priority: 2 },
      { _id: 1, host: "ex2:27218", priority: 1 }
    ]
  };
  
  extraDB.runCommand({ replSetInitiate: extraConfig });
  print("✓ rsExtra initiated");
  
  print("  Waiting for primary election...");
  sleep(10000);
} catch (e) {
  print("! rsExtra might already be initialized: " + e.message);
}

// ============================================
// STEP 4: Add Shards to Cluster
// ============================================
print("\n[4/6] Adding Shards to Cluster via Mongos...");

// Connect to mongos
const mongosConn = new Mongo("mongos1:27020");
const adminDB = mongosConn.getDB("admin");

// Wait a bit for mongos to be ready
print("  Waiting for mongos to be ready...");
sleep(5000);

try {
  // Add rsCity
  const addCity = adminDB.runCommand({
    addShard: "rsCity/hn1:27017,hp1:27018,dn1:27019",
    name: "rsCity"
  });
  print("✓ Added rsCity: " + JSON.stringify(addCity));
} catch (e) {
  print("! rsCity might already be added: " + e.message);
}

try {
  // Add rsExtra
  const addExtra = adminDB.runCommand({
    addShard: "rsExtra/ex1:27217,ex2:27218",
    name: "rsExtra"
  });
  print("✓ Added rsExtra: " + JSON.stringify(addExtra));
} catch (e) {
  print("! rsExtra might already be added: " + e.message);
}

// ============================================
// STEP 5: Enable Sharding on Database
// ============================================
print("\n[5/6] Enabling Sharding on 'elibrary' Database...");

try {
  adminDB.runCommand({ enableSharding: "elibrary" });
  print("✓ Sharding enabled on 'elibrary' database");
} catch (e) {
  print("! Sharding might already be enabled: " + e.message);
}

// ============================================
// STEP 6: Create Collections and Shard Them
// ============================================
print("\n[6/6] Creating Collections and Configuring Shard Keys...");

const elibDB = mongosConn.getDB("elibrary");

// Create branches collection (not sharded - reference data)
print("\n  Creating 'branches' collection...");
try {
  elibDB.createCollection("branches");
  
  // Insert 3 branches
  elibDB.branches.insertMany([
    {
      _id: "HN",
      name: "Chi nhánh Hà Nội",
      city: "Hà Nội",
      address: "123 Đường Láng, Đống Đa, Hà Nội",
      phone: "024-1234-5678",
      email: "hanoi@elibrary.vn"
    },
    {
      _id: "HP",
      name: "Chi nhánh Hải Phòng",
      city: "Hải Phòng",
      address: "456 Lạch Tray, Ngô Quyền, Hải Phòng",
      phone: "0225-9876-5432",
      email: "haiphong@elibrary.vn"
    },
    {
      _id: "DN",
      name: "Chi nhánh Đà Nẵng",
      city: "Đà Nẵng",
      address: "789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng",
      phone: "0236-1111-2222",
      email: "danang@elibrary.vn"
    }
  ]);
  print("  ✓ Inserted 3 branches: HN, HP, DN");
} catch (e) {
  print("  ! Branches might already exist: " + e.message);
}

// Create books collection (not sharded initially - will add text index later)
print("\n  Creating 'books' collection...");
try {
  elibDB.createCollection("books");
  print("  ✓ Books collection created");
} catch (e) {
  print("  ! Books collection might already exist: " + e.message);
}

// Create and shard 'copies' collection
print("\n  Creating and sharding 'copies' collection...");
try {
  elibDB.createCollection("copies");
  
  // Create index on shard key
  elibDB.copies.createIndex({ barcode: 1 });
  
  // Shard the collection
  adminDB.runCommand({
    shardCollection: "elibrary.copies",
    key: { barcode: 1 }
  });
  print("  ✓ Copies collection sharded with key: {barcode: 1}");
} catch (e) {
  print("  ! Copies sharding error: " + e.message);
}

// Create and shard 'loans' collection
print("\n  Creating and sharding 'loans' collection...");
try {
  elibDB.createCollection("loans");
  
  // Create compound index on shard key
  elibDB.loans.createIndex({ branchId: 1, borrowedAt: 1 });
  
  // Shard the collection
  adminDB.runCommand({
    shardCollection: "elibrary.loans",
    key: { branchId: 1, borrowedAt: 1 }
  });
  print("  ✓ Loans collection sharded with key: {branchId: 1, borrowedAt: 1}");
} catch (e) {
  print("  ! Loans sharding error: " + e.message);
}

// Create and shard 'transactions' collection
print("\n  Creating and sharding 'transactions' collection...");
try {
  elibDB.createCollection("transactions");
  
  // Create compound index on shard key
  elibDB.transactions.createIndex({ branchId: 1, createdAt: 1 });
  
  // Shard the collection
  adminDB.runCommand({
    shardCollection: "elibrary.transactions",
    key: { branchId: 1, createdAt: 1 }
  });
  print("  ✓ Transactions collection sharded with key: {branchId: 1, createdAt: 1}");
} catch (e) {
  print("  ! Transactions sharding error: " + e.message);
}

// Create members collection (not sharded - relatively small)
print("\n  Creating 'members' collection...");
try {
  elibDB.createCollection("members");
  elibDB.members.createIndex({ email: 1 }, { unique: true });
  elibDB.members.createIndex({ branchId: 1 });
  print("  ✓ Members collection created with indexes");
} catch (e) {
  print("  ! Members collection error: " + e.message);
}

// Create digital_licenses collection
print("\n  Creating 'digital_licenses' collection...");
try {
  elibDB.createCollection("digital_licenses");
  elibDB.digital_licenses.createIndex({ bookId: 1 });
  print("  ✓ Digital licenses collection created");
} catch (e) {
  print("  ! Digital licenses error: " + e.message);
}

// ============================================
// VERIFICATION
// ============================================
print("\n========================================");
print("Verification");
print("========================================");

print("\nShards in cluster:");
adminDB.runCommand({ listShards: 1 }).shards.forEach(shard => {
  print(`  - ${shard._id}: ${shard.host}`);
});

print("\nDatabases:");
adminDB.runCommand({ listDatabases: 1 }).databases.forEach(db => {
  print(`  - ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
});

print("\nCollections in 'elibrary':");
elibDB.getCollectionNames().forEach(coll => {
  const stats = elibDB.getCollection(coll).stats();
  const sharded = stats.sharded ? "SHARDED" : "NOT SHARDED";
  print(`  - ${coll}: ${stats.count} docs [${sharded}]`);
});

print("\n========================================");
print("✓ MongoDB Sharded Cluster Setup Complete!");
print("========================================");
print("\nConnection String: mongodb://localhost:27020/elibrary");
print("MongoDB Compass: mongodb://localhost:27020/");
print("\nNext steps:");
print("  1. Run seed-data.py to generate sample data");
print("  2. Create text indexes: node scripts/create-indexes.js");
print("  3. Start backend API: cd backend && uvicorn main:app --reload");
print("  4. Start frontend: cd frontend && npm run dev");
print("========================================");
