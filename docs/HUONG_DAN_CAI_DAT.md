# Hướng Dẫn Cài Đặt và Chạy Dự Án E-Library

## Mục Lục
1. [Yêu Cầu Hệ Thống](#yêu-cầu-hệ-thống)
2. [Cài Đặt Môi Trường](#cài-đặt-môi-trường)
3. [Khởi Động MongoDB Cluster](#khởi-động-mongodb-cluster)
4. [Cài Đặt Backend](#cài-đặt-backend)
5. [Cài Đặt Frontend](#cài-đặt-frontend)
6. [Kiểm Tra Hệ Thống](#kiểm-tra-hệ-thống)
7. [Xử Lý Lỗi Thường Gặp](#xử-lý-lỗi-thường-gặp)

---

## Yêu Cầu Hệ Thống

### Phần Mềm Cần Thiết

| Phần mềm | Phiên bản | Link tải |
|----------|-----------|----------|
| **Docker Desktop** | 4.0+ | https://www.docker.com/products/docker-desktop |
| **Python** | 3.9+ | https://www.python.org/downloads/ |
| **Node.js** | 18+ | https://nodejs.org/ |
| **Git** (tùy chọn) | Latest | https://git-scm.com/ |

### Phần Cứng Khuyến Nghị

- **RAM**: Tối thiểu 4GB (khuyến nghị 8GB)
- **Ổ cứng**: Tối thiểu 10GB trống
- **CPU**: 2 cores trở lên

### Kiểm Tra Phiên Bản

Mở PowerShell hoặc Command Prompt và chạy:

```powershell
# Kiểm tra Docker
docker --version
# Kết quả mong đợi: Docker version 24.x.x

# Kiểm tra Python
python --version
# Kết quả mong đợi: Python 3.9.x hoặc cao hơn

# Kiểm tra Node.js
node --version
# Kết quả mong đợi: v18.x.x hoặc cao hơn

# Kiểm tra npm
npm --version
# Kết quả mong đợi: 9.x.x hoặc cao hơn
```

---

## Cài Đặt Môi Trường

### Bước 1: Tải Dự Án

Nếu bạn đã có thư mục dự án tại `E:\E-Library`, bỏ qua bước này.

```powershell
# Di chuyển đến thư mục dự án
cd E:\E-Library
```

### Bước 2: Kiểm Tra Cấu Trúc Thư Mục

Đảm bảo cấu trúc thư mục như sau:

```
E:\E-Library\
├── docker-compose.yml
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── package.json
│   └── ...
├── scripts/
│   ├── init-sharding.js
│   ├── seed-data.py
│   └── ...
└── docs/
```

---

## Khởi Động MongoDB Cluster

### Bước 1: Khởi Động Docker Desktop

1. Mở **Docker Desktop**
2. Đợi cho đến khi Docker hiển thị trạng thái "Running" (màu xanh)
3. Đảm bảo Docker Engine đang chạy

### Bước 2: Khởi Động Containers

```powershell
# Di chuyển đến thư mục dự án
cd E:\E-Library

# Khởi động tất cả containers
docker-compose up -d
```

**Giải thích:**
- `docker-compose up`: Khởi động các containers
- `-d`: Chạy ở chế độ background (detached mode)

### Bước 3: Kiểm Tra Trạng Thái Containers

```powershell
# Xem danh sách containers
docker-compose ps
```

**Kết quả mong đợi:** Bạn sẽ thấy 9 containers đang chạy:

```
NAME        STATUS
cfg1        Up
cfg2        Up
cfg3        Up
hn1         Up
hp1         Up
dn1         Up
ex1         Up
ex2         Up
mongos1     Up
```

> ⏱️ **Lưu ý:** Đợi khoảng 30-60 giây để các containers khởi động hoàn toàn.

### Bước 4: Khởi Tạo Sharding

```powershell
# Chạy script khởi tạo sharding (PowerShell)
Get-Content scripts\init-sharding.js | docker exec -i mongos1 mongosh --port 27020
```

> 💡 **Lưu ý:** PowerShell không hỗ trợ toán tử `<`. Dùng `Get-Content` để đọc file và pipe vào docker.

**Kết quả mong đợi:**

```
[1/6] Initializing Config Server Replica Set (cfgRS)...
✓ Config Server RS initiated

[2/6] Initializing Shard 1 Replica Set (rsCity - HN/HP/DN)...
✓ rsCity initiated with priority: HN(2) > HP(1) = DN(1)

[3/6] Initializing Shard 2 Replica Set (rsExtra)...
✓ rsExtra initiated

[4/6] Adding Shards to Cluster via Mongos...
✓ Added rsCity
✓ Added rsExtra

[5/6] Enabling Sharding on 'elibrary' Database...
✓ Sharding enabled on 'elibrary' database

[6/6] Creating Collections and Configuring Shard Keys...
✓ Inserted 3 branches: HN, HP, DN
✓ Copies collection sharded with key: {barcode: 1}
✓ Loans collection sharded with key: {branchId: 1, borrowedAt: 1}
✓ Transactions collection sharded with key: {branchId: 1, createdAt: 1}

✓ MongoDB Sharded Cluster Setup Complete!
```

### Bước 5: Tạo Indexes

```powershell
# Tạo text indexes cho tìm kiếm (PowerShell)
Get-Content scripts\create-indexes.js | docker exec -i mongos1 mongosh --port 27020 elibrary
```

**Kết quả mong đợi:**

```
[1/4] Creating text index on 'books' collection...
✓ Text index created on books collection

[2/4] Creating compound indexes...
✓ Unique index on members.email
✓ Index on members.branchId
✓ Index on copies.bookId
...

✓ All indexes created successfully!
```

---

## Cài Đặt Backend

### Bước 1: Cài Đặt Python Dependencies

```powershell
# Di chuyển đến thư mục backend
cd backend

# Tạo virtual environment (khuyến nghị)
python -m venv venv

# Kích hoạt virtual environment
.\venv\Scripts\activate
# Bạn sẽ thấy (venv) xuất hiện trước dòng lệnh

# Cài đặt các thư viện
pip install -r requirements.txt
```

**Thời gian:** Khoảng 2-3 phút

### Bước 2: Cấu Hình Environment Variables

```powershell
# Tạo file .env từ template
copy .env.example .env
```

Mở file `.env` và kiểm tra cấu hình (mặc định đã OK):

```env
MONGODB_URL=mongodb://localhost:27020/
DATABASE_NAME=elibrary
SECRET_KEY=your-secret-key-change-this-to-a-random-32-char-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

### Bước 3: Seed Dữ Liệu

```powershell
# Quay lại thư mục gốc
cd ..

# Chạy script seed data
python scripts/seed-data.py
```

**Kết quả mong đợi:**

```
[1/5] Generating 1000 books...
✓ Inserted 1000 books

[2/5] Generating 5000 physical copies...
✓ Inserted 5000 copies

[3/5] Generating 1000 members...
✓ Inserted 1000 members
✓ Created admin user (email: admin@elibrary.vn, password: admin123)

[4/5] Generating 3000 loans and transactions...
✓ Inserted 3000 loans
✓ Inserted 6000+ transactions

[5/5] Generating digital licenses...
✓ Inserted 400 digital licenses

========================================
DATA SEEDING SUMMARY
========================================
Books:              1000
Copies:             5000
Members:            1000
Loans:              3000
Transactions:       6000+
Digital Licenses:   400

✓ Data seeding completed successfully!
```

**Thời gian:** Khoảng 3-5 phút

### Bước 4: Khởi Động Backend Server

```powershell
# Đảm bảo đang ở thư mục backend và venv đã kích hoạt
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Kết quả mong đợi:**

```
Connecting to MongoDB at mongodb://localhost:27020/
✓ Successfully connected to MongoDB
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

> 🌐 **Backend đã sẵn sàng tại:** http://localhost:8000

> 📚 **API Documentation:** http://localhost:8000/docs

**Giữ cửa sổ này mở!** Backend cần chạy liên tục.

---

## Cài Đặt Frontend

### Bước 1: Mở Terminal Mới

Mở một cửa sổ PowerShell hoặc Command Prompt **MỚI** (giữ backend đang chạy).

### Bước 2: Cài Đặt Node Dependencies

```powershell
# Di chuyển đến thư mục frontend
cd E:\E-Library\frontend

# Cài đặt các thư viện
npm install
```

**Thời gian:** Khoảng 2-3 phút

### Bước 3: Cấu Hình Environment Variables

File `.env.local` đã được tạo sẵn với nội dung:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Bước 4: Khởi Động Frontend Server

```powershell
# Khởi động Next.js development server
npm run dev
```

**Kết quả mong đợi:**

```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Ready in 2.5s
```

> 🌐 **Frontend đã sẵn sàng tại:** http://localhost:3000

---

## Kiểm Tra Hệ Thống

### 1. Kiểm Tra Trang Chủ

1. Mở trình duyệt
2. Truy cập: http://localhost:3000
3. Bạn sẽ thấy trang chủ E-Library với:
   - Hero section
   - 3 feature cards
   - System overview statistics
   - Technology stack

### 2. Kiểm Tra Dashboard

1. Truy cập: http://localhost:3000/dashboard
2. Bạn sẽ thấy:
   - 6 thẻ thống kê (Total Books, Copies, Members, etc.)
   - 3 biểu đồ:
     - **Books by Category** (Pie Chart)
     - **Loans by Branch** (Bar Chart)
     - **Transaction Trends** (Line Chart)

### 3. Kiểm Tra Tìm Kiếm Sách

1. Truy cập: http://localhost:3000/books
2. Nhập từ khóa tìm kiếm: **"Technology"**
3. Nhấn **Search**
4. Bạn sẽ thấy danh sách sách liên quan với:
   - Tiêu đề sách
   - Tác giả
   - Nhà xuất bản
   - Chủ đề
   - Điểm relevance score

### 4. Kiểm Tra API

Mở trình duyệt và truy cập:

- **API Docs:** http://localhost:8000/docs
- **Health Check:** http://localhost:8000/health

Hoặc dùng PowerShell:

```powershell
# Test health endpoint
curl http://localhost:8000/health

# Test login
curl -X POST http://localhost:8000/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@elibrary.vn\",\"password\":\"admin123\"}'
```

### 5. Đăng Nhập Hệ Thống

1. Truy cập: http://localhost:3000/login
2. Sử dụng tài khoản:
   - **Email:** admin@elibrary.vn
   - **Password:** admin123

### 6. Kiểm Tra MongoDB Compass (Tùy chọn)

Nếu bạn đã cài MongoDB Compass:

1. Mở MongoDB Compass
2. Connection string: `mongodb://localhost:27020/`
3. Nhấn **Connect**
4. Xem database `elibrary` với các collections:
   - books
   - copies
   - members
   - loans
   - transactions
   - branches

---

## Xử Lý Lỗi Thường Gặp

### Lỗi 1: Docker không khởi động được

**Triệu chứng:**
```
ERROR: Cannot connect to the Docker daemon
```

**Giải pháp:**
1. Mở Docker Desktop
2. Đợi cho đến khi hiển thị "Docker Desktop is running"
3. Thử lại lệnh `docker-compose up -d`

### Lỗi 2: Port đã được sử dụng

**Triệu chứng:**
```
Error: bind: address already in use
```

**Giải pháp:**

```powershell
# Kiểm tra port đang sử dụng
netstat -ano | findstr :27020
netstat -ano | findstr :8000
netstat -ano | findstr :3000

# Dừng process đang dùng port (thay PID bằng số thực tế)
taskkill /PID <PID> /F
```

### Lỗi 3: Backend không kết nối được MongoDB

**Triệu chứng:**
```
Failed to connect to MongoDB
```

**Giải pháp:**

```powershell
# Kiểm tra mongos có chạy không
docker ps | findstr mongos1

# Kiểm tra logs
docker logs mongos1

# Restart mongos
docker restart mongos1

# Đợi 10 giây rồi thử lại backend
```

### Lỗi 4: Frontend không gọi được API

**Triệu chứng:**
- Dashboard không hiển thị dữ liệu
- Console browser báo lỗi CORS

**Giải pháp:**

1. Kiểm tra backend có chạy không: http://localhost:8000/health
2. Kiểm tra file `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. Restart frontend:
   ```powershell
   # Ctrl+C để dừng
   npm run dev
   ```

### Lỗi 5: Không có dữ liệu trong database

**Triệu chứng:**
- Dashboard hiển thị 0 books, 0 members
- Search không trả về kết quả

**Giải pháp:**

```powershell
# Chạy lại script seed
python scripts/seed-data.py
```

### Lỗi 6: Python module not found

**Triệu chứng:**
```
ModuleNotFoundError: No module named 'fastapi'
```

**Giải pháp:**

```powershell
# Đảm bảo virtual environment đã kích hoạt
cd backend
.\venv\Scripts\activate

# Cài lại dependencies
pip install -r requirements.txt
```

### Lỗi 7: npm install thất bại

**Triệu chứng:**
```
npm ERR! code ENOENT
```

**Giải pháp:**

```powershell
# Xóa node_modules và package-lock.json
cd frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json

# Cài lại
npm install
```

---

## Test Failover (Tùy chọn)

### Chuẩn Bị

Mở 2 cửa sổ PowerShell:

**Terminal 1 - Monitor:**
```powershell
# Theo dõi trạng thái replica set
docker exec hp1 mongosh --port 27018 --eval "rs.status().members.forEach(m => print(m.name + ' - ' + m.stateStr))"
```

**Terminal 2 - Thực hiện failover:**

```powershell
# 1. Kiểm tra PRIMARY hiện tại
docker exec hn1 mongosh --port 27017 --eval "rs.isMaster().primary"
# Kết quả: hn1:27017

# 2. Dừng container PRIMARY
docker stop hn1

# 3. Đợi 15-20 giây cho election

# 4. Kiểm tra PRIMARY mới
docker exec hp1 mongosh --port 27018 --eval "rs.isMaster().primary"
# Kết quả: hp1:27018 hoặc dn1:27019

# 5. Test web app - vẫn hoạt động!
# Mở http://localhost:3000 và thử tìm kiếm sách

# 6. Khởi động lại hn1
docker start hn1

# 7. Đợi 30 giây, hn1 sẽ lấy lại PRIMARY (do priority cao hơn)
```

---

## Benchmark Performance (Tùy chọn)

```powershell
# Chạy benchmark so sánh có/không index
python scripts/benchmark.py
```

**Kết quả mong đợi:**

```
WITH TEXT INDEX:
  Avg:  25.50 ms
  P95:  45.00 ms

WITHOUT INDEX (regex):
  Avg:  250.00 ms
  P95:  450.00 ms

Improvement factor: 9.80x faster
```

---

## Dừng Hệ Thống

### Dừng Frontend và Backend

Trong mỗi terminal đang chạy, nhấn `Ctrl + C`

### Dừng MongoDB Cluster

```powershell
# Dừng tất cả containers
cd E:\E-Library
docker-compose down
```

### Dừng và Xóa Dữ Liệu (Cẩn thận!)

```powershell
# Dừng và xóa volumes (mất hết dữ liệu)
docker-compose down -v
```

---

## Khởi Động Lại Hệ Thống

Nếu bạn đã dừng hệ thống và muốn khởi động lại:

```powershell
# 1. Khởi động MongoDB
cd E:\E-Library
docker-compose up -d

# 2. Đợi 30 giây

# 3. Khởi động Backend (terminal 1)
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 4. Khởi động Frontend (terminal 2)
cd frontend
npm run dev
```

**Lưu ý:** Không cần chạy lại init-sharding.js và seed-data.py nếu dữ liệu vẫn còn.

---

## Tài Khoản Mặc Định

### Admin
- **Email:** admin@elibrary.vn
- **Password:** admin123
- **Quyền:** Toàn quyền quản trị

### Member
- **Email:** member1@example.com
- **Password:** password123
- **Quyền:** Thành viên thường

### Thăng Cấp Tài Khoản Lên Admin

Nếu bạn đăng ký tài khoản mới và muốn cấp quyền Admin, hãy chạy script sau:

```powershell
# Di chuyển đến thư mục gốc
cd E:\E-Library

# Chạy script (thay email của bạn vào)
python scripts/promote_user.py email_cua_ban@example.com
```

---

## Các URL Quan Trọng

| Service | URL | Mô tả |
|---------|-----|-------|
| **Frontend** | http://localhost:3000 | Giao diện web chính |
| **Dashboard** | http://localhost:3000/dashboard | Trang thống kê |
| **Books** | http://localhost:3000/books | Tìm kiếm sách |
| **Backend API** | http://localhost:8000 | REST API |
| **Admin Portal** | http://localhost:3000/admin | Trang quản trị (Cần quyền Admin) |
| **API Docs** | http://localhost:8000/docs | Swagger UI |
| **MongoDB** | mongodb://localhost:27020/ | MongoDB Compass |

---

## Tài Liệu Tham Khảo

- **README.md** - Tổng quan dự án
- **DEPLOYMENT.md** - Hướng dẫn deployment chi tiết
- **walkthrough.md** - Chi tiết implementation
- **docs/CLUSTER_ARCHITECTURE.md** - Kiến trúc MongoDB
- **docs/COMMANDS.md** - Các lệnh MongoDB

---

## Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra logs:
   ```powershell
   # Backend logs
   # Xem trong terminal đang chạy backend
   
   # MongoDB logs
   docker logs mongos1
   docker logs hn1
   
   # Frontend logs
   # Xem trong terminal đang chạy frontend
   ```

2. Restart services:
   ```powershell
   # Restart MongoDB
   docker-compose restart
   
   # Restart backend (Ctrl+C rồi chạy lại)
   # Restart frontend (Ctrl+C rồi chạy lại)
   ```

3. Xem lại phần [Xử Lý Lỗi Thường Gặp](#xử-lý-lỗi-thường-gặp)

---

**Chúc bạn thành công với dự án E-Library! 🚀📚**
