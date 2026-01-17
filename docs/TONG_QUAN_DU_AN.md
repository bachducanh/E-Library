# TỔNG QUAN DỰ ÁN E-LIBRARY
## Hệ Thống Thư Viện Điện Tử Phân Tán

**Ngày tạo:** 2026-01-11  
**Phiên bản:** 1.0  
**Tác giả:** E-Library Development Team

---

## MỤC LỤC

1. [Giới Thiệu & Mục Tiêu Hệ Thống](#1-giới-thiệu--mục-tiêu-hệ-thống)
2. [Kiến Trúc Phân Tán](#2-kiến-trúc-phân-tán)
3. [Thiết Kế Dữ Liệu](#3-thiết-kế-dữ-liệu)
4. [Thiết Kế API & Luồng Nghiệp Vụ](#4-thiết-kế-api--luồng-nghiệp-vụ)
5. [Bảo Mật](#5-bảo-mật)
6. [Thực Nghiệm & Đánh Giá](#6-thực-nghiệm--đánh-giá)
7. [Kết Luận & Hướng Phát Triển](#7-kết-luận--hướng-phát-triển)

---

## 1. GIỚI THIỆU & MỤC TIÊU HỆ THỐNG

### 1.1. Tổng Quan

**E-Library** là hệ thống quản lý thư viện điện tử phân tán được thiết kế để phục vụ **3 chi nhánh** tại các thành phố lớn của Việt Nam: **Hà Nội**, **Hải Phòng**, và **Đà Nẵng**. Hệ thống được xây dựng dựa trên kiến trúc **MongoDB Sharded Cluster** với khả năng mở rộng cao (horizontal scaling) và đảm bảo tính sẵn sàng (high availability).

### 1.2. Mục Tiêu Dự Án

| Mục tiêu | Mô tả | Trạng thái |
|----------|-------|------------|
| **Phân tán dữ liệu** | Xây dựng hệ thống phân tán dữ liệu theo địa lý (3 thành phố) | ✅ Hoàn thành |
| **High Availability** | Đảm bảo hệ thống hoạt động liên tục với automatic failover | ✅ Hoàn thành |
| **Horizontal Scaling** | Khả năng mở rộng theo chiều ngang khi tăng tải | ✅ Hoàn thành |
| **Tìm kiếm nâng cao** | Full-text search với ranking và relevance scoring | ✅ Hoàn thành |
| **Bảo mật** | Authentication, Authorization, và mã hóa mật khẩu | ✅ Hoàn thành |
| **Real-time Analytics** | Dashboard với biểu đồ thống kê real-time | ✅ Hoàn thành |
| **Transaction Safety** | Đảm bảo tính toàn vẹn dữ liệu khi mượn/trả sách | ✅ Hoàn thành |

### 1.3. Phạm Vi Hệ Thống

#### Chức năng chính:

1. **Quản lý sách**
   - Catalog hơn 1000+ đầu sách
   - 5000+ bản sao vật lý
   - Full-text search với relevance scoring
   - Phân loại theo LCC (Library of Congress Classification)

2. **Quản lý mượn/trả**
   - Mượn sách vật lý
   - Tự động tính phí phạt quá hạn
   - Kiểm tra subscription và giới hạn mượn
   - Transaction logging đầy đủ

3. **Quản lý thành viên**
   - 1000+ thành viên
   - 2 gói subscription: BASIC và VIP
   - Role-based access control (MEMBER, STAFF, ADMIN)
   - Profile management

4. **Thống kê & báo cáo**
   - Dashboard analytics
   - Biểu đồ phân bố sách theo category
   - Thống kê mượn/trả theo chi nhánh
   - Xu hướng giao dịch theo thời gian

### 1.4. Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│  Next.js 14 + TypeScript + Tailwind CSS + Chart.js │
└────────────────────┬────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────┐
│                    BACKEND                          │
│  Python 3.9+ + FastAPI + Motor (Async MongoDB)     │
└────────────────────┬────────────────────────────────┘
                     │ MongoDB Wire Protocol
┌────────────────────┴────────────────────────────────┐
│              DATABASE LAYER                         │
│         MongoDB 7.0 Sharded Cluster                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Shard 1  │  │ Shard 2  │  │ Config   │          │
│  │ (rsCity) │  │(rsExtra) │  │  (cfgRS) │          │
│  │ 3 nodes  │  │ 2 nodes  │  │ 3 nodes  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────┘
```

#### Chi tiết công nghệ:

| Layer | Technology | Version | Vai trò |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 14.0.4 | React framework với App Router |
| | TypeScript | 5.x | Type safety |
| | Tailwind CSS | 3.x | Utility-first CSS framework |
| | Chart.js | 4.x | Data visualization |
| **Backend** | Python | 3.9+ | Programming language |
| | FastAPI | 0.104+ | Modern async API framework |
| | Motor | 3.3+ | Async MongoDB driver |
| | Pydantic | 2.x | Data validation |
| | bcrypt | 4.x | Password hashing |
| | python-jose | 3.3+ | JWT token handling |
| **Database** | MongoDB | 7.0 | NoSQL database |
| | Docker | 24.x+ | Container orchestration |

### 1.5. Đặc Điểm Nổi Bật

#### 1.5.1. Kiến Trúc Phân Tán

- **2 Shards** với replica sets
- **9 MongoDB containers** chạy đồng thời
- **Automatic data distribution** theo shard key
- **Zone-based sharding** (có thể mở rộng theo địa lý)

#### 1.5.2. High Availability

- **Replica Sets**: Mỗi shard có 2-3 replica
- **Automatic Failover**: Thời gian chuyển đổi < 15 giây
- **Priority-based Election**: HN node ưu tiên cao hơn
- **Zero downtime**: Hệ thống hoạt động liên tục

#### 1.5.3. Performance Optimization

- **Text Indexes**: Tìm kiếm nhanh hơn **5-10x**
- **Compound Indexes**: Tối ưu cho queries phức tạp
- **Aggregation Pipelines**: Real-time analytics
- **Connection Pooling**: Tái sử dụng kết nối database

#### 1.5.4. Security

- **bcrypt hashing**: Cost factor 12
- **JWT authentication**: 24-hour expiration
- **RBAC**: 3 roles (MEMBER, STAFF, ADMIN)
- **CORS protection**: Whitelist origins

### 1.6. Số Liệu Hệ Thống

```
┌─────────────────────────────────────────────────────┐
│              DỮ LIỆU HỆ THỐNG                       │
├─────────────────────────────────────────────────────┤
│  📚 Books:              1,000 đầu sách              │
│  📖 Copies:             5,000 bản sao vật lý        │
│  👥 Members:            1,000 thành viên            │
│  🏢 Branches:           3 chi nhánh                 │
│  📊 Loans:              3,000 giao dịch mượn        │
│  💳 Transactions:       6,000+ records              │
│  🔐 Digital Licenses:   400 licenses                │
└─────────────────────────────────────────────────────┘
```

### 1.7. Use Cases Chính

#### Use Case 1: Tìm kiếm và mượn sách

```
Actor: Member (Thành viên)
Precondition: Đã đăng nhập, subscription còn hiệu lực

1. Member tìm kiếm sách theo từ khóa
2. Hệ thống trả về kết quả với relevance score
3. Member xem chi tiết sách
4. Member kiểm tra bản sao available tại chi nhánh của mình
5. Member gửi yêu cầu mượn sách
6. Hệ thống kiểm tra:
   - Subscription status
   - Số sách đang mượn < max loans
   - Copy availability
   - Branch matching
7. Hệ thống tạo loan record và transaction
8. Cập nhật trạng thái copy thành "borrowed"

Postcondition: Sách được mượn, ghi nhận transaction
```

#### Use Case 2: Failover tự động

```
Scenario: Node PRIMARY bị lỗi

1. HN node (PRIMARY) bị crash
2. HP và DN nodes phát hiện sau 10 giây
3. Bắt đầu election process
4. HP hoặc DN được bầu làm PRIMARY mới
5. mongos tự động phát hiện PRIMARY mới
6. Application tiếp tục hoạt động bình thường
7. Khi HN node khôi phục, nó sync data
8. HN node lấy lại PRIMARY (do priority cao hơn)

Downtime: < 15 giây
```

### 1.8. Yêu Cầu Hệ Thống

#### Môi trường Development:

| Component | Requirement |
|-----------|-------------|
| **OS** | Windows 10/11, Linux, macOS |
| **RAM** | Minimum 4GB, Recommended 8GB |
| **Storage** | 10GB free space |
| **CPU** | 2+ cores |
| **Docker Desktop** | 4.0+ |
| **Python** | 3.9+ |
| **Node.js** | 18+ |

#### Ports sử dụng:

| Service | Port | Mô tả |
|---------|------|-------|
| mongos1 | 27020 | MongoDB Router |
| cfg1/2/3 | 27117-27119 | Config Servers |
| hn1/hp1/dn1 | 27017-27019 | Shard 1 (rsCity) |
| ex1/ex2 | 27217-27218 | Shard 2 (rsExtra) |
| Backend API | 8000 | FastAPI Server |
| Frontend | 3000 | Next.js Dev Server |

---

**Tiếp theo:** [Kiến Trúc Phân Tán](#2-kiến-trúc-phân-tán)
