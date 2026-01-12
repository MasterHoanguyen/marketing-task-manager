# Marketing Task Manager 📊

Ứng dụng quản lý công việc cho phòng Marketing với Kanban board, Content Calendar, Campaign Tracking và Team Management.

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-6+-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🚀 Tính Năng

- **Dashboard** - Tổng quan thống kê và biểu đồ
- **Kanban Board** - Quản lý công việc với drag & drop
- **Content Calendar** - Lịch nội dung với quick add
- **Campaign Tracking** - Theo dõi tiến độ chiến dịch
- **Team Management** - Quản lý workload nhóm

## 📦 Cài Đặt Local

```bash
# Clone repository
git clone <your-repo-url>
cd marketing-task-manager

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chỉnh sửa .env với MongoDB URI của bạn
# MONGODB_URI=mongodb://localhost:27017/marketing-tasks

# Chạy server
npm start
```

Truy cập: http://localhost:3000

## 🚂 Deploy lên Railway

### Bước 1: Tạo tài khoản Railway
1. Truy cập [railway.app](https://railway.app)
2. Đăng ký bằng GitHub

### Bước 2: Tạo MongoDB Database
1. Trong Railway Dashboard, click **"New Project"**
2. Chọn **"Provision MongoDB"**
3. Railway sẽ tự động tạo database

### Bước 3: Deploy ứng dụng
1. Click **"New"** → **"GitHub Repo"**
2. Chọn repository của bạn
3. Railway sẽ tự động detect Node.js và deploy

### Bước 4: Kết nối MongoDB
1. Click vào MongoDB service
2. Vào tab **"Connect"**
3. Copy **MONGODB_URI**
4. Click vào Web service → **"Variables"**
5. Thêm: `MONGODB_URI` = (paste URI)

### Bước 5: Lấy URL
1. Click vào Web service
2. Vào tab **"Settings"**
3. Click **"Generate Domain"**
4. URL của bạn: `https://your-app.up.railway.app`

## 🔧 Biến Môi Trường

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `PORT` | Server port (default: 3000) | ❌ |
| `NODE_ENV` | `production` hoặc `development` | ❌ |
| `CORS_ORIGIN` | Allowed CORS origin | ❌ |

## 📁 Cấu Trúc Dự Án

```
marketing-task-manager/
├── client/                 # Frontend
│   ├── index.html
│   ├── js/
│   │   ├── api.js         # API client
│   │   ├── app.js         # Main app logic
│   │   ├── board.js       # Kanban board
│   │   ├── calendar.js    # Content calendar
│   │   ├── dashboard.js   # Dashboard stats
│   │   └── ui.js          # UI utilities
│   └── styles/
│       └── main.css       # All styles
├── server/                 # Backend
│   ├── index.js           # Express server
│   ├── models/            # Mongoose models
│   │   ├── Campaign.js
│   │   ├── Task.js
│   │   └── User.js
│   └── routes/            # API routes
│       ├── campaigns.js
│       ├── stats.js
│       ├── tasks.js
│       └── users.js
├── package.json
├── railway.json           # Railway config
└── README.md
```

## 🛠️ API Endpoints

### Tasks
- `GET /api/tasks` - Lấy tất cả tasks
- `POST /api/tasks` - Tạo task mới
- `PUT /api/tasks/:id` - Cập nhật task
- `DELETE /api/tasks/:id` - Xóa task
- `PATCH /api/tasks/:id/status` - Cập nhật status (drag & drop)

### Campaigns
- `GET /api/campaigns` - Lấy tất cả campaigns
- `POST /api/campaigns` - Tạo campaign mới
- `PUT /api/campaigns/:id` - Cập nhật campaign
- `DELETE /api/campaigns/:id` - Xóa campaign

### Users
- `GET /api/users` - Lấy tất cả users
- `POST /api/users` - Tạo user mới

### Stats
- `GET /api/stats/dashboard` - Dashboard statistics
- `GET /api/stats/campaigns/:id` - Campaign analytics

### Health Check
- `GET /health` - Server health status

## 📝 License

MIT License - Tự do sử dụng và chỉnh sửa.

---

Made with ❤️ for Marketing Teams
