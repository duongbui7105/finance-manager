# Finance Manager — Personal Finance Management Platform

Ứng dụng web quản lý tài chính cá nhân với AI-powered analytics, theo dõi ngân sách, mục tiêu tiết kiệm, và thông tin thị trường theo thời gian thực.

## Tính năng

### Bắt buộc
- **Quản lý giao dịch** — Ghi lại thu/chi với danh mục, ghi chú, ngày tháng
- **Dashboard tổng quan** — Hiển thị tổng thu, chi, số dư, biểu đồ xu hướng theo thời gian thực
- **Mục tiêu tiết kiệm** — Đặt mục tiêu tài chính, theo dõi tiến độ với thanh progress bar
- **Quản lý tài khoản** — Hỗ trợ nhiều loại tài khoản (tiền mặt, tiết kiệm, đầu tư, thẻ tín dụng, v.v.)
- **Ngân sách** — Tạo ngân sách theo danh mục với cảnh báo chi tiêu quá mức
- **Báo cáo tài chính** — Biểu đồ, xu hướng, phân tích theo khoảng thời gian tùy chỉnh
- **Xác thực bảo mật** — JWT-based authentication với Spring Security

### Nâng cao
- **AI Chat (FinBot)** — Trợ lý tài chính thông minh với Google Gemini AI
  - Phân tích dữ liệu tài chính cá nhân
  - Đưa ra lời khuyên tiết kiệm, cảnh báo chi tiêu
  - Hỏi đáp về tình hình tài chính bằng tiếng Việt
- **Smart Input** — Nhập giao dịch bằng ngôn ngữ tự nhiên
  - Ví dụ: "Ăn phở 40k sáng nay" → tự động parse thành giao dịch
  - Hỗ trợ nhiều giao dịch trong 1 câu
- **Auto-categorize** — AI tự động phân loại giao dịch dựa trên mô tả
- **Scan Receipt** — Quét hóa đơn/biên lai từ ảnh, trích xuất tất cả mặt hàng
- **AI Insights** — Phân tích chi tiêu, nhận xét tổng quan, gợi ý cải thiện
- **Thông tin thị trường** — Theo dõi giá tiền điện tử, kim loại quý, ngoại hối theo thời gian thực
- **Đa ngôn ngữ** — Tiếng Việt & English (i18next)
- **Dark/Light mode** — Chủ đề tùy chỉnh với transition mượt
- **Responsive design** — Hoạt động tốt trên mobile & desktop

### Yêu cầu phi chức năng
- **Kiến trúc tách lớp**:
  - Backend: `controller/` (REST) ↔ `service/` (business logic) ↔ `repository/` (data)
  - Frontend: `api/` (data) ↔ `pages/` (UI) ↔ `components/` (reusable)
- **Lưu trữ**: H2 file-based database (persistent storage), dễ dàng migrate sang MySQL/PostgreSQL
- **Demo**: Dữ liệu mẫu sẵn với 2 user test

---

## Cài đặt & chạy

### Yêu cầu
- **Java 21+** — [Tải Microsoft JDK](https://www.microsoft.com/openjdk)
- **Node.js 18+** — [Tải Node.js](https://nodejs.org/)
- Khoảng 200 MB dung lượng

### Backend (Spring Boot)

```bash
cd backend
.\gradlew.bat bootRun
```

> **Lần đầu chạy** mất ~30 giây để Gradle tải dependencies và khởi động Spring Boot.
> Sau khi backend sẵn sàng sẽ in:
> ```
> Started FinanceManagerApplication in 9.142 seconds
> ✅ Initialized 2 test users:
>    - test@gmail.com / 123456 (USER)
>    - admin@gmail.com / admin123 (ADMIN)
> ```

**Backend sẵn sàng tại:** http://localhost:8081

### Frontend (React + Vite)

Mở terminal mới:

```bash
cd frontend
npm install
npm run dev
```
> ```
> VITE v8.0.8  ready in 1331 ms
> ➜  Local:   http://localhost:5173/
> ```

**Mở trình duyệt:** http://localhost:5173

---

## Cấu trúc thư mục

```
Project-2-main/
├── backend/                     # Spring Boot REST API
│   ├── src/main/java/com/hduong/finance_manager/
│   │   ├── controller/          # REST endpoints (tách khỏi business logic)
│   │   │   ├── AuthController.java
│   │   │   ├── TransactionController.java
│   │   │   ├── BudgetController.java
│   │   │   ├── AiController.java
│   │   │   └── MarketController.java
│   │   ├── service/             # Business logic layer
│   │   │   ├── TransactionService.java
│   │   │   ├── BudgetService.java
│   │   │   └── ...
│   │   ├── repository/          # Data access layer (JPA)
│   │   │   ├── TransactionRepository.java
│   │   │   ├── UserRepository.java
│   │   │   └── ...
│   │   ├── entity/              # JPA entities
│   │   │   ├── User.java
│   │   │   ├── Transaction.java
│   │   │   ├── Category.java
│   │   │   └── ...
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── security/            # JWT + Spring Security config
│   │   ├── ai/                  # Gemini AI integration
│   │   │   ├── AiService.java   #   Chat, insights, smart input, receipt scan
│   │   │   └── dto/             #   AI request/response DTOs
│   │   ├── config/              # Spring configs (CORS, WebClient, Scheduler)
│   │   └── exception/           # Custom exceptions
│   ├── src/main/resources/
│   │   └── application.properties  # Config (DB, JWT, Gemini API key)
│   ├── build.gradle             # Gradle dependencies
│   └── gradlew.bat              # Gradle wrapper
│
└── frontend/                    # React + Vite application
    ├── src/
    │   ├── api/                 # Data layer (tách khỏi UI)
    │   │   ├── axios.js         #   Axios instance với auth interceptor
    │   │   ├── authApi.js       #   Auth endpoints
    │   │   ├── transactionApi.js
    │   │   ├── aiApi.js         #   AI endpoints
    │   │   └── marketApi.js
    │   ├── pages/               # UI layer (page components)
    │   │   ├── auth/            #   Login, Register
    │   │   ├── dashboard/       #   Dashboard with charts
    │   │   ├── transactions/    #   Transaction list & form
    │   │   ├── ai/              #   AI Chat page
    │   │   ├── reports/         #   Financial reports
    │   │   └── ...
    │   ├── components/          # Reusable UI components
    │   │   ├── Navbar.jsx
    │   │   ├── Chart.jsx
    │   │   └── ...
    │   ├── context/             # React Context (Auth, Theme)
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── hooks/               # Custom hooks
    │   ├── i18n/                # Internationalization
    │   │   ├── en.json
    │   │   └── vi.json
    │   ├── finmanager/          # Main app screens & data
    │   ├── App.jsx              # Root component with routing
    │   └── main.jsx             # Entry point
    ├── index.html
    ├── vite.config.js           # Vite config (proxy /api → :8081)
    ├── tailwind.config.js       # Tailwind CSS config
    └── package.json
```

## Chi tiết tính năng AI

### Gemini AI Integration (`backend/ai/AiService.java`)
- **Model**: `gemini-3.6-flash` (nhanh, hiệu quả, multimodal hỗ trợ vision)
- **API**: Google Generative AI REST API
- **Auth**: Header `x-goog-api-key` (API keys với prefix `AQ.` từ AI Studio)
- **Max tokens**: 1000 (chat/insights), 2000 (smart input/receipt scan)

### 1. AI Chat (`/ai/chat`)
- Nhận câu hỏi từ user
- Build context với dữ liệu tài chính thực (20 giao dịch gần nhất, tổng thu/chi, số dư)
- Gọi Gemini với system prompt = "FinBot trợ lý tài chính"
- Trả về lời khuyên bằng tiếng Việt (3-5 câu)

### 2. AI Insights (`/ai/insights`)
- Tự động phân tích không cần prompt từ user
- Prompt cố định: "Nhận xét tổng quan + điểm cần cải thiện + 1 lời khuyên tiết kiệm"
- Dựa vào dữ liệu tháng hiện tại + lịch sử

### 3. Smart Input (`/ai/smart-input`)
- Parse ngôn ngữ tự nhiên → JSON transactions
- Hỗ trợ: "40k", "1.5tr" → convert sang số
- Tự động gán category dựa trên từ khóa (Food, Transport, v.v.)
- Trích xuất nhiều giao dịch từ 1 câu

### 4. Scan Receipt (`/ai/scan-receipt`)
- Upload ảnh base64 → Gemini Vision API
- OCR + parse thành structured data
- Mỗi mặt hàng = 1 transaction riêng
- Auto-categorize based on item name

### 5. Auto-Categorize (`/ai/categorize`)
- Input: note + amount (optional)
- Output: 1 trong 9 categories (Food, Transport, Education, Healthcare, Salary, Shopping, Utilities, Entertainment, Other)
- Không giải thích, chỉ trả tên category

---

## 🔌 API endpoints

**Base URL**: http://localhost:8081

| Endpoint | Method | Mô tả | Auth |
|---|---|---|---|
| **Authentication** |
| `/api/auth/register` | POST | Đăng ký user mới | ❌ |
| `/api/auth/login` | POST | Đăng nhập (trả về JWT) | ❌ |
| **Transactions** |
| `/api/transactions` | GET | Danh sách giao dịch | ✅ |
| `/api/transactions` | POST | Tạo giao dịch mới | ✅ |
| `/api/transactions/{id}` | PUT | Cập nhật giao dịch | ✅ |
| `/api/transactions/{id}` | DELETE | Xóa giao dịch | ✅ |
| **Categories** |
| `/api/categories` | GET | Danh sách danh mục | ✅ |
| `/api/categories` | POST | Tạo danh mục mới | ✅ |
| **Budgets** |
| `/api/budgets` | GET | Ngân sách của user | ✅ |
| `/api/budgets` | POST | Tạo ngân sách | ✅ |
| `/api/budgets/{id}` | PUT | Cập nhật ngân sách | ✅ |
| **Savings Goals** |
| `/api/savings-goals` | GET | Danh sách mục tiêu | ✅ |
| `/api/savings-goals` | POST | Tạo mục tiêu mới | ✅ |
| **Reports** |
| `/api/reports/summary` | GET | Tóm tắt tài chính | ✅ |
| `/api/reports/trends` | GET | Xu hướng theo thời gian | ✅ |
| **AI** |
| `/api/ai/chat` | POST | Chat với FinBot | ✅ |
| `/api/ai/insights` | GET | Phân tích tự động | ✅ |
| `/api/ai/categorize` | POST | Tự động phân loại | ✅ |
| `/api/ai/smart-input` | POST | Parse text → transactions | ✅ |
| `/api/ai/scan-receipt` | POST | OCR hóa đơn | ✅ |
| **Market Data** |
| `/api/market/crypto` | GET | Giá tiền điện tử | ✅ |
| `/api/market/precious-metals` | GET | Giá vàng, bạc | ✅ |
| `/api/market/forex` | GET | Tỷ giá ngoại tệ | ✅ |

**Docs đầy đủ**: http://localhost:8081/swagger-ui.html (nếu đã bật Swagger)

---

## ⚙️ Cấu hình

### Backend (`backend/src/main/resources/application.properties`)

```properties
# Database (H2 file-based persistent storage)
spring.datasource.url=jdbc:h2:file:./data/finance_manager_db;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE
spring.datasource.username=sa
spring.datasource.password=
spring.datasource.driver-class-name=org.h2.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true

# App port
server.port=8081

# JWT
jwt.secret=<your-secret-key>
jwt.expiration=86400000  # 24 hours

# CORS
cors.allowed-origins=http://localhost:5173,http://localhost:5174,http://localhost:4173,http://127.0.0.1:5173

# Gemini AI (New format with AQ. prefix)
gemini.api.key=${GEMINI_API_KEY:AQ.YourKeyFromAIStudio}
gemini.api.url=https://generativelanguage.googleapis.com/v1beta/models
gemini.api.model=gemini-3.6-flash
gemini.api.max-tokens=1000
```

> **⚠️ QUAN TRỌNG — Gemini API Key mới:**
> - Google AI Studio hiện sử dụng API keys prefix `AQ.` (VD: `AQ.Ab8RN6K...`)
> - **PHẢI gửi qua header `x-goog-api-key`**, KHÔNG được dùng query param `?key=`
> - Lấy key mới tại: https://aistudio.google.com/app/apikey
> - Backend đã tự động xử lý header cho tất cả AI endpoints
> - Đặt biến môi trường: `$env:GEMINI_API_KEY="AQ.your-key"` (Windows PowerShell)

### Frontend (`frontend/vite.config.js`)

```javascript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  }
})
```

---

## ⚠ Lưu ý

### 1. Gemini API Key
- **Bắt buộc** để chạy tính năng AI
- **Format mới**: Google AI Studio hiện sử dụng keys với prefix `AQ.` (VD: `AQ.Ab8RN6K...`)
- **Authentication**: Keys phải gửi qua header `x-goog-api-key`, KHÔNG dùng query param `?key=`
- Lấy key miễn phí tại: https://aistudio.google.com/app/apikey
- Đừng commit key thật vào git — dùng environment variable
- Backend vẫn chạy được nếu không có key, nhưng AI endpoints sẫ trả lỗi

### 2. Database H2 file-based
- **Dữ liệu được LƯU VỮU VIỄN** vào thư mục `./data/finance_manager_db.mv.db`
- Restart backend → dữ liệu vẫn còn (khác với in-memory cũ)
- File database tự động tạo lần đầu chạy
- Để xóa dữ liệu: xóa folder `./data/` và restart
- Migrate sang MySQL/PostgreSQL: chỉ cần đổi `spring.datasource.url` trong `application.properties`

### 3. CORS
- Backend đã cấu hình CORS cho `localhost:5173`, `5174`, `4173`, `127.0.0.1:5173`
- Nếu đổi port frontend → thêm vào `cors.allowed-origins`

### 4. JWT Token
- Token expire sau 24 giờ
- Frontend tự động refresh khi gọi API
- 401/403 → auto logout

### 5. Performance
- **Smart Input** và **Scan Receipt** mất 2-5 giây (gọi Gemini API)
- **Market Data** cache 30 giây để tránh spam external APIs
- Dashboard load nhanh (<500ms) nhờ query tối ưu

### 6. Test Users
- `test@gmail.com` / `123456` — USER role (đầy đủ dữ liệu mẫu)
- `admin@gmail.com` / `admin123` — ADMIN role

---

## Build cho Production

### Backend (JAR file)

```bash
cd backend
.\gradlew.bat clean build
```

Kết quả: `backend/build/libs/finance-manager-0.0.1-SNAPSHOT.jar`

Chạy:
```bash
java -jar build/libs/finance-manager-0.0.1-SNAPSHOT.jar
```

### Frontend (Static files)

```bash
cd frontend
npm run build
```

Kết quả: `frontend/dist/` (deploy lên Nginx, Vercel, Netlify, v.v.)

---

## Tech Stack

### Backend
- **Runtime**: Java 21 (LTS)
- **Framework**: Spring Boot 3.5.14
- **Security**: Spring Security + JWT
- **Database**: H2 (dev), JPA/Hibernate
- **AI**: Google Gemini 2.5 Flash
- **Build**: Gradle 8.x
- **API Style**: RESTful

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS 3
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **State**: React Context API
- **i18n**: i18next
- **Charts**: Custom Canvas-based charts

### External APIs
- **Google Gemini API** — AI chat, insights, smart input, OCR (model: `gemini-3.6-flash`)
- **CryptoCompare API** — Cryptocurrency prices
- **metals.live API** — Precious metals (gold, silver)

---