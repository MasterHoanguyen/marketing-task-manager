# 🚂 Hướng Dẫn Deploy lên Railway - Từng Bước

## ✅ Đã Hoàn Thành
- ✅ Code đã push lên GitHub: https://github.com/MasterHoanguyen/marketing-task-manager

---

## 📋 Các Bước Deploy (5 phút)

### Bước 1: Đăng nhập Railway
1. Mở trình duyệt, truy cập: **https://railway.app**
2. Click **"Login"** (góc phải trên)
3. Chọn **"Login with GitHub"**
4. Click **"Authorize Railway"** (nếu có popup)

---

### Bước 2: Tạo Project Mới
1. Sau khi đăng nhập, click **"New Project"** (nút tím)
2. Chọn **"Deploy from GitHub repo"**
3. Nếu chưa thấy repo, click **"Configure GitHub App"**
4. Chọn repository **`marketing-task-manager`**
5. Railway sẽ tự động bắt đầu deploy

---

### Bước 3: Thêm MongoDB Database
1. Trong project, click **"+ New"** (góc phải)
2. Chọn **"Database"**
3. Chọn **"Add MongoDB"**
4. Đợi vài giây để database được tạo

---

### Bước 4: Kết Nối Database với App
1. Click vào **MongoDB** service (icon database)
2. Chọn tab **"Connect"**
3. Copy dòng **`MONGODB_URI`** (bắt đầu bằng `mongodb://...`)
4. Click vào **Web service** (icon marketing-task-manager)
5. Chọn tab **"Variables"**
6. Click **"+ New Variable"**
7. Nhập:
   - **Name**: `MONGODB_URI`
   - **Value**: (Paste URI vừa copy)
8. Click **"Add"**
9. Railway sẽ tự động redeploy

---

### Bước 5: Tạo Domain (URL công khai)
1. Click vào **Web service**
2. Chọn tab **"Settings"**
3. Kéo xuống phần **"Networking"**
4. Click **"Generate Domain"**
5. Bạn sẽ nhận được URL như:
   ```
   https://marketing-task-manager-production.up.railway.app
   ```

---

## 🎉 Hoàn Thành!

Chia sẻ URL cho team của bạn để họ có thể truy cập ứng dụng!

---

## 🔧 Nếu Gặp Lỗi

### Lỗi "Build failed"
- Kiểm tra logs trong Railway
- Thường do thiếu MONGODB_URI

### Lỗi kết nối database
- Đảm bảo đã thêm MONGODB_URI đúng
- Kiểm tra MongoDB service đã running

### App không hiển thị
- Đợi 2-3 phút để deploy hoàn tất
- Refresh trang

---

## 💡 Tips

- **Tự động deploy**: Mỗi khi push code lên GitHub, Railway sẽ tự động deploy
- **Logs**: Click vào service → "Deployments" để xem logs
- **Biến môi trường**: Thêm trong tab "Variables"
