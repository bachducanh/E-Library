# E-Library Deployment Guide

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Docker Desktop installed and running
- [ ] Python 3.9 or higher
- [ ] Node.js 18 or higher
- [ ] Git (optional, for version control)
- [ ] MongoDB Compass (optional, for database visualization)
- [ ] At least 4GB free RAM
- [ ] At least 10GB free disk space

## 🚀 Step-by-Step Deployment

### Step 1: Start MongoDB Cluster (5-10 minutes)

```bash
# Navigate to project directory
cd E:\E-Library

# Start all MongoDB containers
docker-compose up -d

# Wait for containers to be healthy (30-60 seconds)
# You should see 9 containers running
docker-compose ps
```

**Expected output**: All 9 containers should be "Up" (cfg1, cfg2, cfg3, hn1, hp1, dn1, ex1, ex2, mongos1)

### Step 2: Initialize MongoDB Sharding (2-3 minutes)

```bash
# Initialize replica sets and sharding
docker exec -i mongos1 mongosh --port 27020 < scripts/init-sharding.js
```

**Expected output**: 
- ✓ Config Server RS initiated
- ✓ rsCity initiated
- ✓ rsExtra initiated
- ✓ Added rsCity and rsExtra shards
- ✓ Sharding enabled on elibrary database
- ✓ Collections created and sharded

### Step 3: Create Indexes (1 minute)

```bash
# Create text indexes for full-text search
docker exec -i mongos1 mongosh --port 27020 elibrary < scripts/create-indexes.js
```

**Expected output**:
- ✓ Text index created on books collection
- ✓ Compound indexes created

### Step 4: Install Backend Dependencies (2-3 minutes)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 5: Seed Database (3-5 minutes)

```bash
# Return to project root
cd ..

# Run seed script (generates 10,000+ records)
python scripts/seed-data.py
```

**Expected output**:
- ✓ Inserted 1000 books
- ✓ Inserted 5000 copies
- ✓ Inserted 1000 members
- ✓ Inserted 3000 loans
- ✓ Inserted 6000+ transactions
- ✓ Created admin user

**Default credentials created**:
- Admin: admin@elibrary.vn / admin123
- Member: member1@example.com / password123

### Step 6: Start Backend API (1 minute)

```bash
# In backend directory
cd backend

# Copy environment file
copy .env.example .env

# Start FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Expected output**:
- ✓ Connected to MongoDB
- INFO: Uvicorn running on http://0.0.0.0:8000

**Test backend**: Open http://localhost:8000/docs in browser

### Step 7: Install Frontend Dependencies (2-3 minutes)

Open a **NEW terminal window**:

```bash
# Navigate to frontend directory
cd E:\E-Library\frontend

# Install dependencies
npm install
```

### Step 8: Start Frontend (1 minute)

```bash
# Still in frontend directory
npm run dev
```

**Expected output**:
- ✓ Ready in X ms
- ○ Local: http://localhost:3000

### Step 9: Verify Installation

1. **Open browser**: http://localhost:3000
2. **Test features**:
   - [ ] Home page loads
   - [ ] Navigate to Dashboard (should show charts)
   - [ ] Navigate to Books and search for "Technology"
   - [ ] Login with admin@elibrary.vn / admin123

## 🧪 Testing Features

### 1. Full-text Search Test

```bash
# In browser, go to: http://localhost:3000/books
# Search for: "Computer Science"
# Expected: Multiple books with relevance scores
```

### 2. Dashboard Test

```bash
# Go to: http://localhost:3000/dashboard
# Expected: 3 charts displayed:
#   - Books by Category (Pie Chart)
#   - Loans by Branch (Bar Chart)
#   - Transaction Trends (Line Chart)
```

### 3. API Test

```bash
# Test authentication
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@elibrary.vn\",\"password\":\"admin123\"}"

# Expected: JSON with access_token
```

### 4. Failover Test (IMPORTANT for demo)

**Terminal 1** - Monitor replica set:
```bash
# Watch replica set status
docker exec hp1 mongosh --port 27018 --eval "rs.status().members.forEach(m => print(m.name + ' - ' + m.stateStr))"
```

**Terminal 2** - Perform failover:
```bash
# Check current primary
docker exec hn1 mongosh --port 27017 --eval "rs.isMaster().primary"

# Stop primary container
docker stop hn1

# Wait 15-20 seconds for election

# Check new primary
docker exec hp1 mongosh --port 27018 --eval "rs.isMaster().primary"

# Test web app - should still work!
# Open http://localhost:3000 and navigate around

# Restart hn1
docker start hn1
```

**Expected**: Web application continues working during failover!

### 5. Performance Benchmark

```bash
# Run benchmark script
python scripts/benchmark.py
```

**Expected output**:
- WITH index: ~10-50ms average
- WITHOUT index: ~100-500ms average
- Improvement: 5-10x faster

## 🔍 MongoDB Compass Connection

1. Open MongoDB Compass
2. Connection string: `mongodb://localhost:27020/`
3. Connect
4. Explore databases:
   - `elibrary` - Main database
   - `config` - Sharding metadata

## 📊 Viewing Shard Distribution

```bash
# View shard distribution for copies
docker exec mongos1 mongosh --port 27020 elibrary --eval "db.copies.getShardDistribution()"

# View shard distribution for loans
docker exec mongos1 mongosh --port 27020 elibrary --eval "db.loans.getShardDistribution()"
```

## 🛠️ Troubleshooting

### Problem: Docker containers not starting

**Solution**:
```bash
# Stop all containers
docker-compose down

# Remove volumes (WARNING: deletes data)
docker-compose down -v

# Start again
docker-compose up -d
```

### Problem: Cannot connect to MongoDB

**Solution**:
```bash
# Check if mongos is running
docker ps | grep mongos1

# Check logs
docker logs mongos1

# Restart mongos
docker restart mongos1
```

### Problem: Backend cannot connect to MongoDB

**Solution**:
- Check if MongoDB is running: `docker ps`
- Verify connection string in `backend/.env`
- Ensure mongos is on port 27020

### Problem: Frontend API calls failing

**Solution**:
- Ensure backend is running on port 8000
- Check browser console for errors
- Verify CORS settings in `backend/config.py`
- Check `frontend/.env.local` has correct API URL

### Problem: No data in database

**Solution**:
```bash
# Re-run seed script
python scripts/seed-data.py
```

### Problem: Text search not working

**Solution**:
```bash
# Recreate text indexes
docker exec -i mongos1 mongosh --port 27020 elibrary < scripts/create-indexes.js
```

## 📹 Video Recording Checklist

For your project demo video, record:

1. [ ] **Architecture Overview**
   - Show docker-compose.yml
   - Explain 9 containers (3 config, 3 rsCity, 2 rsExtra, 1 mongos)

2. [ ] **Data Distribution**
   - Show shard status in MongoDB Compass
   - Show chunk distribution

3. [ ] **Failover Demo**
   - Show current primary
   - Stop primary container
   - Show web app still works
   - Show new primary elected
   - Restart original primary

4. [ ] **Web Application**
   - Dashboard with charts
   - Book search with full-text
   - Loan operations

5. [ ] **Performance**
   - Run benchmark script
   - Show results comparison

## 🎯 Key Points for Report

1. **Shard Keys**:
   - `copies`: `{barcode: 1}` - Even distribution
   - `loans`: `{branchId: 1, borrowedAt: 1}` - Partition by branch and time
   - `transactions`: `{branchId: 1, createdAt: 1}` - Partition by branch and time

2. **Security**:
   - bcrypt password hashing (NOT MD5)
   - JWT authentication with 24-hour expiration
   - Role-based access control

3. **Performance**:
   - Text indexes improve search speed 5-10x
   - Aggregation pipelines for real-time analytics
   - Sharding enables horizontal scaling

4. **High Availability**:
   - Replica sets with automatic failover
   - Priority-based primary election
   - Zero downtime during failover

## 📝 Next Steps

After deployment:

1. [ ] Test all features thoroughly
2. [ ] Record demo video
3. [ ] Take screenshots for report
4. [ ] Run performance benchmarks
5. [ ] Document any issues encountered
6. [ ] Prepare presentation

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `docker-compose logs [service-name]`
2. Verify all containers are running: `docker-compose ps`
3. Check MongoDB connection: `docker exec mongos1 mongosh --port 27020 --eval "db.adminCommand('ping')"`
4. Review README.md for additional information

Good luck with your project! 🚀
