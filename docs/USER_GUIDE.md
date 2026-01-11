# Hướng Dẫn Sử Dụng E-Library

Chào mừng bạn đến với hệ thống thư viện điện tử phân tán E-Library. Tài liệu này được thiết kế để giúp bạn hiểu rõ các chức năng dành cho từng vai trò trong hệ thống.

---

## 🅰️ DÀNH CHO NGƯỜI DÙNG (MEMBERS)

Là thành viên của thư viện, bạn có thể thực hiện các tác vụ sau để khai thác kho tri thức khổng lồ của chúng tôi.

### 1. Tài Khoản & Gói Cước
*   **Đăng ký/Đăng nhập**: Tạo tài khoản mới hoặc đăng nhập vào hệ thống.
*   **Quản lý hồ sơ**: Xem thông tin cá nhân và lịch sử mượn sách.
*   **Gói cước (Subscriptions)**:
    *   **BASIC (Miễn phí)**: Mượn tối đa **3 sách**. Hạn trả **14 ngày**.
    *   **VIP**: Mượn tối đa **10 sách**. Hạn trả **30 ngày**. Được đọc E-book không giới hạn.

### 2. Tìm Kiếm & Tra Cứu (Explore Books)
*   **Tìm kiếm thông minh**: Nhập tên sách, tác giả hoặc ISBN vào ô tìm kiếm.
*   **Bộ lọc (Filters)**: Sử dụng thanh bên trái để lọc sách theo:
    *   **Categories**: Lọc theo phân loại sách (VD: Science, History...).
    *   **Language**: Lọc sách tiếng Anh hoặc tiếng Việt.
*   **Xem chi tiết**: Nhấn vào sách để xem tóm tắt, số lượng bản copy hiện có, và chi nhánh đang lưu trữ.

### 3. Quy Trình Mượn Sách (Chi Tiết)

Hiện tại, hệ thống hỗ trợ quy trình mượn sách giấy trực tiếp tại thư viện. Bạn không thể bấm nút "Mượn" trực tuyến để ship sách về nhà.

**Bước 1: Kiểm tra sách có sẵn không**
1.  Tại trang **Explore Books**, tìm cuốn sách bạn muốn.
2.  Bấm vào nút **View** (hoặc **Details**) màu đỏ trên thẻ sách.
3.  Tại trang chi tiết, cuộn xuống phần **Available Copies**.
4.  Nhìn vào trạng thái (Badge màu xanh lá `available` hoặc xám `borrowed`):
    *   ✅ **Available**: Sách đang có trên kệ.
    *   ❌ **Borrowed**: Sách đã có người mượn.

**Bước 2: Xác định vị trí sách**
1.  Nếu sách có trạng thái `available`, hãy ghi lại thông tin:
    *   **Branch**: Chi nhánh đang giữ sách (VD: Ha Noi, HCM).
    *   **Call Number/Barcode**: Mã số định danh của cuốn sách (để thủ thư dễ tìm).
2.  Ví dụ: Bạn thấy sách "Clean Code" có dòng: *Branch: Ha Noi - Barcode: 100000003*.

**Bước 3: Đến quầy thủ thư để mượn**
1.  Mang thẻ thành viên (hoặc mã số sinh viên) đến quầy thủ thư tại chi nhánh đó.
2.  Đọc tên sách hoặc mã Barcode cho thủ thư.
3.  Thủ thư sẽ quét mã và tạo phiếu mượn cho bạn trên hệ thống.

### 4. Quy Trình Trả Sách & Phạt
1.  Mang sách đến quầy thủ thư đúng hạn (14 ngày với BASIC, 30 ngày với VIP).
2.  Thủ thư sẽ quét mã để trả sách.
3.  ⚠️ **Nếu quá hạn**: Hệ thống sẽ tự động tính phí **5.000 VNĐ x Số ngày trễ**.
    *   Bạn cần thanh toán tiền phạt tại quầy trước khi có thể mượn cuốn sách tiếp theo.

---

## 🅱️ DÀNH CHO THỦ THƯ (STAFF) VÀ QUẢN TRỊ VIÊN (ADMIN)

Là người vận hành hệ thống, bạn có các quyền hạn đặc biệt để quản lý tài nguyên và người dùng.

### 1. Quản Trị Viên (ADMIN)
*   **Truy cập Admin Portal**: Nhấn vào nút "Admin Portal" trên thanh điều hướng sau khi đăng nhập.
*   **Quản lý Sách (Book Management)**:
    *   **Thêm sách mới**: Nhập thông tin sách, ISBN, và mã phân loại LCC.
    *   **Chỉnh sửa/Xóa sách**: Cập nhật thông tin hoặc xóa sách khỏi hệ thống.
*   **Quản lý Bản sao (Copies)**: Nhập kho các bản copy sách giấy cho từng chi nhánh (Hà Nội, Đà Nẵng, HCM).
*   **Quản lý E-book**: Đăng ký license kỹ thuật số cho các đầu sách.

### 2. Nghiệp Vụ Tại Quầy (Dành cho Staff/Admin)
*   **Xử lý Mượn/Trả**: Kiểm tra thông tin hội viên và thực hiện lệnh mượn/trả sách trên hệ thống.
*   **Thu phí phạt**: Kiểm tra xem thành viên có khoản phạt nào chưa đóng không và tiến hành thu phí.
*   **Kiểm tra Gói cước**: Hệ thống sẽ tự động cảnh báo nếu thành viên hết hạn gói cước hoặc vượt quá hạn mức mượn.
