# 📋 Ứng Dụng Quản Lý Công Việc (Task Management App)

Đây là dự án ứng dụng quản lý công việc toàn diện được xây dựng với kiến trúc Client-Server tách biệt, tích hợp nhiều công nghệ hiện đại bao gồm Trí tuệ nhân tạo (Google Gemini AI), Quản lý kéo thả (Kanban Board) và hệ thống phân quyền chi tiết.

---

## 📂 Cấu Trúc Dự Án

Thư mục gốc chứa hai phần chính:
* **`task-management-backend/`**: RESTful API server xây dựng bằng Node.js & Express.
* **`task-management-frontend/`**: Ứng dụng giao diện người dùng xây dựng bằng React.js và Vite.

---

## ⚡ Các Tính Năng Chính

* **Đăng ký / Đăng nhập**: Xác thực người dùng an toàn bằng JWT (JSON Web Token), hỗ trợ đặt lại mật khẩu và phân quyền (Admin, Manager, Member).
* **Bảng Kanban kéo thả**: Giao diện trực quan cho phép thay đổi trạng thái công việc nhanh chóng bằng cách kéo thả.
* **Tích hợp Trí tuệ Nhân tạo (AI Chatbox)**: Sử dụng Google Gemini AI để hỗ trợ gợi ý chuyển trạng thái công việc, phân tích tiến độ, và chat tương tác trực tiếp.
* **Theo dõi tiến độ & Báo cáo**: Thống kê số lượng công việc hoàn thành bằng các biểu đồ trực quan (Recharts).
* **Quản lý Thành viên & Dự án**: Phân công công việc, thiết lập quyền hạn thành viên trong dự án một cách chặt chẽ.
* **Thông báo tự động**: Thông báo thời hạn hoàn thành công việc (Deadline Alert), đồng thời gửi email nhắc nhở tự động qua Cron Job.

---

## 🛠️ Công Nghệ Sử Dụng

### Backend
* **Runtime**: Node.js & Express.js
* **Database**: MongoDB (Mongoose) & MySQL (Sequelize)
* **Xác thực**: JWT, Bcryptjs
* **AI Integration**: `@google/generative-ai` (Gemini API)
* **API Documentation**: Swagger UI (`swagger-ui-express`)
* **Task Scheduling & Mail**: `node-cron`, `nodemailer`

### Frontend
* **Framework**: React.js 19 (Vite)
* **Styling**: Tailwind CSS
* **Drag-and-Drop**: `@dnd-kit/core` & `@dnd-kit/sortable`
* **Charts**: Recharts
* **Icons**: Lucide React, React Icons
* **API Client**: Axios

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### 1. Yêu Cầu Hệ Thống
* Đã cài đặt **Node.js** (Khuyên dùng v18+)
* Đã cài đặt **MongoDB** và **MySQL**

---

### 2. Thiết Lập Backend

1. Di chuyển vào thư mục backend:
   ```bash
   cd task-management-backend
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường:
   * Copy file cấu hình mẫu: `cp .env.example .env` (hoặc nhân bản file `.env.example` thành `.env`).
   * Điền đầy đủ thông tin kết nối Database, JWT Secret Key, Google Gemini API Key và các thông tin cấu hình Mail server trong file `.env`.

4. Khởi tạo dữ liệu mẫu (Seed Data):
   ```bash
   npm run seed
   ```

5. Khởi chạy server ở chế độ phát triển (Development):
   ```bash
   npm run dev
   ```
   * *API Server sẽ chạy tại cổng mặc định cấu hình ở `.env` (thường là `http://localhost:5000`).*
   * *Tài liệu API Swagger có thể truy cập tại `http://localhost:5000/api-docs`.*

---

### 3. Thiết Lập Frontend

1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../task-management-frontend
   ```

2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường:
   * Tạo file `.env` từ `.env.example` hoặc tạo mới file `.env` tại thư mục này.
   * Cấu hình URL gọi API: `VITE_API_URL=http://localhost:5000` (hoặc port tương ứng với Backend).

4. Khởi chạy ứng dụng:
   ```bash
   npm run dev
   ```
   * *Ứng dụng Frontend sẽ chạy tại `http://localhost:5173` (hoặc cổng trống tiếp theo).*

---

## 🧪 Các Script Hữu Ích Khác

Trong thư mục **`task-management-backend/`**:
* `npm run reset:passwords`: Reset mật khẩu cho tất cả người dùng hiện có.
* `npm run mongodb`: Lệnh tiện ích để chạy service MongoDB local trên Windows (nếu cài đặt ở đường dẫn mặc định).
