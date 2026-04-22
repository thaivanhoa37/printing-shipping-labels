# Hóa Đơn Pro - Ứng dụng Tạo & In Hóa Đơn Chuyên Nghiệp

**Hóa Đơn Pro** là một ứng dụng web frontend hoạt động hoàn toàn offline, giúp người dùng dễ dàng thiết kế, tạo và in hóa đơn, tem nhãn, vận đơn một cách chuyên nghiệp. Ứng dụng cung cấp các công cụ mạnh mẽ từ việc chọn khổ giấy đa dạng, tùy chỉnh giao diện, thiết kế nội dung tự do cho đến xuất file PDF mà không cần kết nối tới máy chủ (backend) nào.

## 🚀 Tính năng nổi bật

### 1. Đa dạng chế độ in ấn
- **In Tem / Nhãn / Vận đơn:** Nội dung được ép vừa khít với kích thước trang in. Hỗ trợ các khổ giấy chuyên dụng như: `100x150mm`, `A6`, `A7` (chuẩn Viettel Post), `A8`, và các loại tem nhiệt mini (`K80`, `K72`, `K57`).
- **In Hóa Đơn / Bill:** Nội dung có thể kéo dài tự do theo số lượng sản phẩm. Hỗ trợ khổ giấy: `A4`, `A5`, `80mm` (giấy cuộn).
- **Khổ giấy tùy chỉnh:** Cho phép người dùng tự nhập kích thước theo đơn vị `mm` hoặc `cm`.

### 2. Thiết kế linh hoạt & Trực quan
- **Hóa đơn chuẩn:** Nhập thông tin khách hàng, ngày tháng, danh sách sản phẩm, ghi chú. Tự động tính toán tổng tiền.
- **Tự thiết kế (WYSIWYG Editor):** Cung cấp trình soạn thảo văn bản (Word-like) cho phép đổi font, cỡ chữ, màu sắc, căn lề, chèn bảng,... để tạo hóa đơn theo phong cách riêng.
- **Khối văn bản tự do:** Thêm các khối thông tin độc lập (ví dụ: lời cảm ơn, chính sách bảo hành, hướng dẫn nhận hàng) có thể dễ dàng bật/tắt hiển thị.
- **Live Preview:** Giao diện chia đôi màn hình với khung xem trước (Preview) theo thời gian thực, hỗ trợ zoom (phóng to/thu nhỏ) để kiểm tra chính xác bản in.

### 3. Tùy biến thương hiệu (Branding)
- Cập nhật đầy đủ thông tin doanh nghiệp, tải lên Logo công ty.
- Tùy chỉnh màu sắc chủ đạo của hóa đơn và font chữ (Inter, Roboto, Arial, Times New Roman, Roboto Mono).
- Tùy biến tỷ lệ hiển thị cỡ chữ (scale) cho phù hợp với từng kích thước giấy.
- Ẩn/hiện linh hoạt các thành phần: Logo, thông tin công ty, thông tin khách hàng, danh sách sản phẩm, QR Code,...

### 4. Tiện ích in nâng cao
- **Hướng in:** Hỗ trợ in Dọc (Portrait) và in Ngang (Landscape).
- **Chiều chữ:** Hỗ trợ chữ viết ngang (mặc định) hoặc viết dọc (đáp ứng các loại tem nhãn đặc thù).
- **Số liên:** Hỗ trợ in 1 liên hoặc 2 liên trên cùng một bản in.

### 5. Lưu trữ & Xuất dữ liệu
- Lưu trữ các hóa đơn đã tạo trực tiếp vào bộ nhớ trình duyệt (LocalStorage).
- Lưu lại các mẫu in/thiết kế cấu hình sẵn để tải lại nhanh chóng cho lần sau.
- In hóa đơn trực tiếp ra máy in kết nối.
- Xuất hóa đơn ra định dạng file **PDF**.

## 🛠 Công nghệ sử dụng
- **Cốt lõi:** HTML5, CSS3 (Vanilla CSS), JavaScript (ES6+).
- **Lưu trữ:** Trình duyệt (LocalStorage).
- **Thư viện bên thứ ba:**
  - `qrcode.min.js`: Dùng để tạo nhanh mã QR (chứa link URL, mã thanh toán...).
  - `html2pdf.bundle.min.js`: Dùng để xuất khối HTML trên màn hình ra định dạng file PDF chất lượng cao.

## 💻 Hướng dẫn cài đặt & Sử dụng
Vì đây là một ứng dụng tĩnh (Static Web App) chạy offline 100%, bạn không cần cài đặt Node.js, PHP, hay bất kỳ cơ sở dữ liệu nào.

1. Tải mã nguồn dự án về máy.
2. Click đúp mở file `index.html` bằng bất kỳ trình duyệt web hiện đại nào (Google Chrome, Firefox, Microsoft Edge, Safari...).
3. Bắt đầu trải nghiệm tạo hóa đơn và in ngay!

## 📁 Cấu trúc thư mục
```text
printing-shipping-labels/
├── index.html     # Cấu trúc HTML chính và giao diện ứng dụng
├── style.css      # CSS styling, layout linh hoạt và tối ưu in ấn (@media print)
├── app.js         # Logic ứng dụng: tính toán, preview, local storage, xử lý in
└── README.md      # Tài liệu giới thiệu dự án
```