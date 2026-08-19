# FinManager - Nền Tảng Quản Lý Tài Chính Cá Nhân

Ứng dụng web toàn bộ (full-stack) để quản lý tài chính cá nhân với các tính năng phân tích dữ liệu bằng AI, theo dõi ngân sách, quản lý mục tiêu tài chính và thông tin thị trường.

**Truy cập**: http://localhost:5173

---

## Các Tính Năng

### Quản Lý Tài Chính Cơ Bản
- Theo dõi Giao Dịch: Ghi lại thu chi với danh mục và ghi chú
- Bảng Điều Khiển: Xem tổng quan thu chi, tài sản ròng theo thời gian thực
- Mục Tiêu Tiết Kiệm: Đặt và theo dõi mục tiêu tài chính với trực quan hóa tiến độ
- Quản Lý Tài Khoản: Quản lý nhiều tài khoản (tiền gửi, tiết kiệm, đầu tư, v.v.)
- Lập Kế Hoạch Ngân Sách: Tạo và giám sát ngân sách với cảnh báo chi quá mức

### Phân Tích & Thông Tin Chi Tiết
- Báo Cáo: Báo cáo tài chính toàn diện với biểu đồ và xu hướng
- Thông Tin Thông Minh: Phân tích chi tiêu và đề xuất được hỗ trợ bởi AI
- Xu Hướng Giao Dịch: Trực quan hóa mô hình chi tiêu theo thời gian
- Thông Tin Thị Trường: Theo dõi dữ liệu thị trường theo thời gian thực (tiền điện tử, kim loại quý, ngoại hối)

### Tính Năng AI
- Trợ Lý Chat AI: Nhận lời khuyên tài chính được cá nhân hóa thông qua Gemini AI
- Nhập Liệu Thông Minh: Nhập giao dịch bằng ngôn ngữ tự nhiên (ví dụ "chi 50k cho cà phê")
- Phân Tích Chi Tiêu: Thông tin chi tiết được tạo bởi AI từ lịch sử giao dịch của bạn

### Trải Nghiệm Người Dùng
- Chế Độ Tối/Sáng: Tùy chỉnh giao diện
- Hỗ Trợ Đa Ngôn Ngữ: Tiếng Việt và Tiếng Anh
- Thiết Kế Đáp Ứng: Hoạt động trên máy tính và thiết bị di động
- Xác Thực Bảo Mật: Xác thực dựa trên JWT

---

## Công Nghệ Sử Dụng

### Backend
- Runtime: Java 21
- Framework: Spring Boot 3.5.14
- Cơ Sở Dữ Liệu: H2 (trong bộ nhớ cho phát triển)
- Bảo Mật: JWT, Spring Security
- API: RESTful với Spring Web
- ORM: JPA/Hibernate
- Build: Gradle

### Frontend
- Framework: React 18
- Build Tool: Vite
- CSS: Tailwind CSS + Hệ Thống Thiết Kế Tùy Chỉnh
- State Management: React Context (Auth, Theme)
- HTTP Client: Axios
- Quốc Tế Hóa: i18next
- Biểu Đồ: Biểu đồ tùy chỉnh dựa trên canvas

### Dịch Vụ Bên Ngoài
- AI: Google Gemini API (chat & insights)
- Dữ Liệu Thị Trường: metals.live API (kim loại quý), cryptocompare API (tiền điện tử)

---

## Yêu Cầu Cần Thiết

- Java 21 - Tải từ [Microsoft JDK](https://www.microsoft.com/openjdk)
- Node.js 18+ - Cho phát triển frontend
- Git - Kiểm soát phiên bản

---

## Hướng Dẫn Bắt Đầu Nhanh

### 1. Clone và Cài Đặt

```bash
# Clone kho lưu trữ
git clone https://github.com/hduong/finance-manager.git
cd finance-manager

# Cài đặt phụ thuộc frontend
cd finance-manager-ui
npm install
```

### 2. Chạy Backend

```bash
# Từ thư mục dự án: finance-manager/
$env:JAVA_HOME='C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot'
./gradlew.bat bootRun
```

Backend chạy tại: http://localhost:8081/api

### 3. Chạy Frontend

```bash
# Từ thư mục finance-manager-ui/
npm run dev
```

Frontend chạy tại: http://localhost:5173

### 4. Truy Cập Ứng Dụng

Mở trình duyệt và truy cập: http://localhost:5173

---

## Cách Sử Dụng

### Tạo Tài Khoản
1. Nhấn "Create one" trên trang đăng nhập
2. Nhập: Tên Đầy Đủ, Email, Mật Khẩu (tối thiểu 6 ký tự)
3. Nhấn "Create account"

### Tổng Quan Bảng Điều Khiển
- Thẻ Tóm Tắt: Tổng thu, chi và tài sản ròng
- Giao Dịch Gần Đây: 5 giao dịch mới nhất
- Biểu Đồ: Xu hướng hàng tháng và phân chia danh mục
- Thao Tác Nhanh: Thêm giao dịch, xem báo cáo

### Thêm Giao Dịch
1. Nhấn nút "+" (Thêm Nhanh)
2. Nhập số tiền, danh mục, ngày, ghi chú
3. Chọn loại (Thu Nhập/Chi Tiêu)
4. Lưu

### Sử Dụng Tính Năng AI
- AI Chat: Nhấn biểu tượng chat để nhận lời khuyên tài chính
- Nhập Thông Minh: Nhấn biểu tượng nhập thông minh và mô tả giao dịch một cách tự nhiên
- Thông Tin Chi Tiết: Bảng điều khiển hiển thị thông tin chi tiêu được tạo bởi AI

### Quản Lý Tài Chính
- Ngân Sách: Đặt giới hạn hàng tháng cho mỗi danh mục
- Mục Tiêu: Tạo mục tiêu tiết kiệm với thời hạn
- Báo Cáo: Xem báo cáo tài chính chi tiết theo khoảng thời gian
- Tài Khoản: Tổ chức giao dịch theo loại tài khoản

---

## Cấu Trúc Dự Án

```
finance-manager/
├── src/main/java/com/hduong/finance_manager/
│   ├── controller/          # Điểm cuối REST API
│   ├── service/             # Logic kinh doanh
│   ├── repository/          # Truy vấn cơ sở dữ liệu (JPA)
│   ├── entity/              # Thực thể JPA
│   ├── dto/                 # Đối tượng chuyển dữ liệu
│   ├── security/            # JWT, cấu hình xác thực
│   ├── exception/           # Ngoại lệ tùy chỉnh
│   ├── config/              # Cấu hình Spring (CORS, Lập Lịch, WebClient)
│   └── ai/                  # Tích hợp Gemini AI
├── src/main/resources/
│   └── application.properties  # Cấu hình
├── build.gradle             # Cấu hình Gradle build
└── gradle/                  # Gradle wrapper

finance-manager-ui/
├── src/
│   ├── api/                 # Khách hàng Axios (xác thực, giao dịch, v.v.)
│   ├── pages/               # Thành phần trang (Đăng Nhập, Bảng Điều Khiển, Báo Cáo, v.v.)
│   ├── components/          # Thành phần UI tái sử dụng
│   ├── context/             # React Context (Auth, Theme)
│   ├── hooks/               # Hook tùy chỉnh (useAuth, useToast)
│   ├── finmanager/          # Màn hình ứng dụng chính & dữ liệu
│   ├── i18n/                # Bản dịch (en.json, vi.json)
│   ├── App.jsx              # Thành phần gốc với định tuyến
│   └── main.jsx             # Điểm nhập
├── index.html               # Mẫu HTML
├── vite.config.js           # Cấu hình Vite
├── tailwind.config.js       # Cấu hình Tailwind CSS
└── package.json             # Phụ thuộc Node
```

---

## Cấu Hình

### Backend (application.properties)

```properties
server.port=8081
spring.datasource.url=jdbc:h2:mem:finance_manager_db

# JWT
jwt.secret=<khóa-bí-mật-của-bạn>
jwt.expiration=86400000  # 24 giờ

# CORS
cors.allowed-origins=http://localhost:5173,http://localhost:5174,http://localhost:3000

# AI (Gemini)
gemini.api.key=<khóa-api-gemini-của-bạn>
gemini.api.model=gemini-2.5-flash
```

### Frontend (vite.config.js)

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:8081'
    }
  }
}
```

---

## Xác Thực

Sử dụng JWT (JSON Web Tokens) để xác thực không trạng thái:

1. Đăng Ký: POST `/api/auth/register` → Trả về token JWT
2. Đăng Nhập: POST `/api/auth/login` → Trả về token JWT
3. Tuyến Được Bảo Vệ: Axios tự động đính kèm token vào các yêu cầu
4. Lưu Trữ Token: Lưu trữ trong localStorage
5. Đăng Xuất Tự Động: Phản hồi 401/403 kích hoạt đăng xuất

---

## Điểm Cuối API

### Xác Thực
- POST /api/auth/register - Đăng ký người dùng mới
- POST /api/auth/login - Đăng nhập người dùng

### Giao Dịch
- GET /api/transactions - Danh sách giao dịch người dùng
- POST /api/transactions - Tạo giao dịch
- PUT /api/transactions/{id} - Cập nhật giao dịch
- DELETE /api/transactions/{id} - Xóa giao dịch

### Ngân Sách
- GET /api/budgets - Danh sách ngân sách
- POST /api/budgets - Tạo ngân sách
- PUT /api/budgets/{id} - Cập nhật ngân sách

### Báo Cáo
- GET /api/reports/summary - Tóm tắt tài chính
- GET /api/reports/trends - Xu hướng chi tiêu

### AI
- POST /api/ai/chat - Chat với trợ lý AI
- POST /api/ai/insights - Nhận thông tin chi tiết về chi tiêu

### Dữ Liệu Thị Trường
- GET /api/market/data - Tỷ giá thị trường hiện tại
- GET /api/market/crypto - Giá tiền điện tử

---
## Build cho Sản Xuất

### Backend
```bash
cd finance-manager
./gradlew.bat build
```

Kết Quả: `build/libs/finance-manager-x.x.x.jar`

### Frontend
```bash
cd finance-manager-ui
npm run build
```

Kết Quả: `dist/` (sẵn sàng triển khai)

---

## Triển Khai

### Docker (Được Khuyến Khích)
```dockerfile
# Backend Dockerfile
FROM openjdk:21-slim
COPY build/libs/finance-manager.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]

# Frontend Dockerfile
FROM node:18-alpine as build
COPY . .
RUN npm install && npm run build
FROM nginx:alpine
COPY --from=build dist/ /usr/share/nginx/html/
```

