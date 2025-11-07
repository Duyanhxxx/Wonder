# Hướng Dẫn Chi Tiết: Cài Đặt Database cho Vercel

## 📋 Tổng Quan

Ứng dụng này hỗ trợ 2 chế độ lưu trữ:
1. **File System** (mặc định) - Cho local development
2. **Vercel Postgres** - Cho production trên Vercel

## 🚀 Cách 1: Sử dụng Vercel Postgres (Khuyến nghị)

### Bước 1: Tạo Database trên Vercel

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn (hoặc tạo project mới)
3. Vào tab **Storage** (hoặc **Databases**)
4. Click **Create Database**
5. Chọn **Postgres**
6. Chọn plan:
   - **Hobby** (Free) - Đủ cho development và small projects
   - **Pro** - Cho production với nhiều tính năng hơn
7. Đặt tên database (ví dụ: `student-management-db`)
8. Chọn region gần bạn (ví dụ: `Singapore` hoặc `Tokyo` cho Việt Nam)
9. Click **Create**

### Bước 2: Kết nối Database

Sau khi tạo database, Vercel sẽ **tự động**:
- ✅ Tạo các biến môi trường cần thiết
- ✅ Kết nối database với project
- ✅ Thêm vào `.env.local` (nếu có)

**Các biến môi trường được tạo tự động:**
- `POSTGRES_URL` - Connection string chính
- `POSTGRES_PRISMA_URL` - Cho Prisma (nếu dùng)
- `POSTGRES_URL_NON_POOLING` - Non-pooling connection

### Bước 3: Cài đặt Package

```bash
npm install @vercel/postgres
```

### Bước 4: Khởi tạo Database Tables

Sau khi deploy, truy cập URL sau để tạo tables:

```
https://your-app.vercel.app/api/init-db
```

Hoặc chạy local với biến môi trường:

```bash
# Tạo file .env.local (nếu chưa có)
POSTGRES_URL=your-postgres-url-from-vercel

# Chạy init
npm run dev
# Sau đó truy cập: http://localhost:3000/api/init-db
```

### Bước 5: Deploy và Test

1. Commit và push code:
```bash
git add .
git commit -m "Add Vercel Postgres support"
git push
```

2. Vercel sẽ tự động deploy
3. Sau khi deploy xong, truy cập `/api/init-db` để tạo tables
4. Test ứng dụng!

## 🔧 Cách 2: Sử dụng File System (Local Development)

Mặc định, ứng dụng sử dụng file system cho local development:

```bash
npm install
npm run dev
```

Dữ liệu sẽ được lưu trong thư mục `data/`:
- `data/users.json` - Danh sách users
- `data/students.json` - Danh sách học sinh

**Lưu ý:** File system **KHÔNG hoạt động** trên Vercel production vì file system là read-only.

## 📝 Kiểm Tra Database

### Kiểm tra xem đang dùng Postgres hay File System

Ứng dụng tự động phát hiện:
- Nếu có biến môi trường `POSTGRES_URL` → Dùng Postgres
- Nếu không có → Dùng File System

### Xem dữ liệu trong Vercel Postgres

1. Vào Vercel Dashboard
2. Chọn project > Storage
3. Click vào database của bạn
4. Vào tab **Data** để xem tables và dữ liệu

## 🐛 Troubleshooting

### Lỗi: "Cannot find module '@vercel/postgres'"

**Giải pháp:**
```bash
npm install @vercel/postgres
```

### Lỗi: "Environment variable POSTGRES_URL is not set"

**Giải pháp:**
1. Kiểm tra trong Vercel Dashboard > Settings > Environment Variables
2. Đảm bảo database đã được tạo và kết nối với project
3. Nếu chưa có, vào Storage > Database > .env.local để copy connection string

### Lỗi: "relation does not exist"

**Giải pháp:** Chạy endpoint `/api/init-db` để tạo tables:
```
https://your-app.vercel.app/api/init-db
```

### Database không kết nối được

**Giải pháp:**
1. Kiểm tra database status trong Vercel Dashboard
2. Đảm bảo database đã được tạo và active
3. Kiểm tra region của database phù hợp với project
4. Kiểm tra biến môi trường đã được set đúng

### Dữ liệu bị mất sau mỗi lần deploy

**Nguyên nhân:** Đang dùng file system thay vì database

**Giải pháp:** Setup Vercel Postgres như hướng dẫn trên

## 💡 Tips

1. **Local Development:**
   - Dùng file system (không cần setup gì)
   - Nhanh và đơn giản

2. **Production:**
   - Bắt buộc dùng database (Vercel Postgres, Supabase, MongoDB, etc.)
   - File system không hoạt động trên Vercel

3. **Migration:**
   - Export dữ liệu từ file system
   - Import vào Postgres qua API hoặc script

## 📚 Tài liệu tham khảo

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [@vercel/postgres Package](https://www.npmjs.com/package/@vercel/postgres)
- [Vercel Storage Overview](https://vercel.com/docs/storage)

## ✅ Checklist Setup

- [ ] Tạo Vercel Postgres database
- [ ] Cài đặt `@vercel/postgres` package
- [ ] Kiểm tra biến môi trường `POSTGRES_URL`
- [ ] Chạy `/api/init-db` để tạo tables
- [ ] Test ứng dụng
- [ ] Deploy và verify

