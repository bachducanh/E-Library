# E-Library - Distributed Library System

A distributed library management system spanning 3 cities (Hà Nội, Hải Phòng, Đà Nẵng) built with MongoDB Sharded Cluster, Python FastAPI, and Next.js.

## 🏗️ Architecture

- **MongoDB Sharded Cluster**: 2 shards with replica sets + 3 config servers
- **Backend**: Python FastAPI with async MongoDB driver (motor)
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Authentication**: JWT tokens with bcrypt password hashing
- **Visualization**: Chart.js for dashboard analytics

## 📋 Prerequisites

- Docker & Docker Compose
- Python 3.9+
- Node.js 18+
- MongoDB Compass (optional, for database visualization)

## 🚀 Quick Start

### 1. Start MongoDB Cluster

```bash
# Navigate to project directory
cd E:\E-Library

# Start all MongoDB containers
docker-compose up -d

# Wait for containers to be healthy (about 30 seconds)
docker-compose ps

# Initialize sharding configuration
docker exec -i mongos1 mongosh --port 27020 < scripts/init-sharding.js

# Create indexes
docker exec -i mongos1 mongosh --port 27020 elibrary < scripts/create-indexes.js
```

### 2. Seed Data

```bash
# Install Python dependencies
cd backend
pip install -r requirements.txt

# Run seed script (generates 10,000+ records)
cd ..
python scripts/seed-data.py
```

### 3. Start Backend API

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000
API docs: http://localhost:8000/docs

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:3000

## 🔑 Default Credentials

- **Admin**: admin@elibrary.vn / admin123
- **Member**: member1@example.com / password123

## 📊 MongoDB Compass Connection

```
mongodb://localhost:27020/
```

## 🧪 Testing Features

### 1. Full-text Search
- Navigate to http://localhost:3000/books
- Search for: "Technology", "Computer Science", "Vietnam History"
- Results are ranked by relevance score

### 2. Dashboard Analytics
- Navigate to http://localhost:3000/dashboard
- View charts:
  - Books by Category (Pie Chart)
  - Loans by Branch (Bar Chart)
  - Transaction Trends (Line Chart)

### 3. Failover Test

```bash
# Check current primary
docker exec hn1 mongosh --port 27017 --eval "rs.isMaster().primary"

# Stop primary container
docker stop hn1

# Wait 15 seconds for election
# Web app should still work!

# Restart container
docker start hn1
```

### 4. Performance Benchmark

```bash
# Run benchmark script (compares WITH/WITHOUT index)
python scripts/benchmark.py
```

## 📁 Project Structure

```
E:\E-Library\
├── docker-compose.yml          # MongoDB cluster configuration
├── backend/                    # Python FastAPI application
│   ├── main.py                # Application entry point
│   ├── config.py              # Configuration
│   ├── database.py            # MongoDB connection
│   ├── models/                # Pydantic models
│   ├── routers/               # API endpoints
│   │   ├── auth.py           # Authentication
│   │   ├── books.py          # Book catalog & search
│   │   ├── loans.py          # Borrow/return operations
│   │   └── stats.py          # Dashboard statistics
│   ├── middleware/            # JWT authentication
│   └── utils/                 # Security utilities
├── frontend/                  # Next.js application
│   ├── app/                   # App router pages
│   │   ├── page.tsx          # Home page
│   │   ├── dashboard/        # Dashboard with charts
│   │   ├── books/            # Book search
│   │   └── layout.tsx        # Root layout
│   ├── components/            # React components
│   └── lib/                   # API client
├── scripts/                   # Utility scripts
│   ├── init-sharding.js      # MongoDB initialization
│   ├── create-indexes.js     # Index creation
│   └── seed-data.py          # Data generation
└── docs/                      # Documentation
```

## 🔧 Shard Key Design

| Collection | Shard Key | Reason |
|------------|-----------|--------|
| `copies` | `{barcode: 1}` | Even distribution of book copies |
| `loans` | `{branchId: 1, borrowedAt: 1}` | Partition by branch and time |
| `transactions` | `{branchId: 1, createdAt: 1}` | Partition by branch and time |

## 📈 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

### Books
- `GET /books/search?q={query}` - Full-text search
- `GET /books/` - List books with pagination
- `GET /books/{id}` - Get book details
- `GET /books/{id}/copies` - Get physical copies
- `GET /books/categories/list` - Get categories

### Loans
- `POST /loans/borrow` - Borrow a book
- `POST /loans/return/{id}` - Return a book
- `GET /loans/my-loans` - Get user's loans

### Statistics
- `GET /stats/dashboard` - Dashboard overview
- `GET /stats/books-by-category` - Category distribution
- `GET /stats/loans-by-branch` - Branch statistics
- `GET /stats/transaction-trends` - Transaction trends

## 🛡️ Security Features

- ✅ Password hashing with bcrypt (cost factor 12)
- ✅ JWT authentication with 24-hour expiration
- ✅ Role-based access control (MEMBER, STAFF, ADMIN)
- ✅ Subscription validation for loan operations
- ✅ CORS protection

## 📊 Performance Optimizations

- ✅ Text indexes for full-text search
- ✅ Compound indexes for common queries
- ✅ MongoDB sharding for horizontal scaling
- ✅ Replica sets for high availability
- ✅ Async/await for non-blocking I/O

## 🎯 Key Features

1. **Distributed Architecture**: 3-city deployment with automatic data distribution
2. **High Availability**: Replica sets with automatic failover
3. **Full-text Search**: MongoDB text indexes with relevance scoring
4. **Real-time Analytics**: Aggregation pipelines for dashboard charts
5. **Subscription Management**: BASIC/VIP tiers with different loan limits
6. **Transaction Logging**: Complete audit trail of all operations

## 📝 Development Notes

- MongoDB uses port 27020 (mongos router)
- Backend API uses port 8000
- Frontend uses port 3000
- All passwords are hashed with bcrypt
- JWT tokens stored in localStorage
- Charts update in real-time

## 🐛 Troubleshooting

### MongoDB containers not starting
```bash
docker-compose down -v
docker-compose up -d
```

### Cannot connect to MongoDB
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs mongos1
```

### Frontend API calls failing
- Ensure backend is running on port 8000
- Check CORS settings in backend/config.py
- Verify JWT token in browser localStorage

## 📚 References

- [MongoDB Sharding Documentation](https://docs.mongodb.com/manual/sharding/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Chart.js Documentation](https://www.chartjs.org/docs/)

## 👥 Contributors

Project developed for Database Systems course - Distributed e-Library System

## 📄 License

Educational project - All rights reserved
