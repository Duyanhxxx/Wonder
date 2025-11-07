# ⚠️ QUAN TRỌNG: Setup Database trước khi Deploy

## Vấn đề

**Nếu không setup database, dữ liệu sẽ BỊ MẤT sau mỗi lần deploy trên Vercel!**

- File system trên Vercel là **read-only** (chỉ đọc)
- Dữ liệu lưu vào file sẽ **bị xóa** sau mỗi lần deploy
- Cần dùng **database** để lưu trữ dữ liệu

## Giải pháp: Setup Vercel Postgres (MIỄN PHÍ)

### Bước 1: Tạo Database trên Vercel

1. Đăng nhập [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào tab **Storage** (hoặc **Databases**)
4. Click **Create Database**
5. Chọn **Postgres**
6. Chọn **Hobby** (MIỄN PHÍ)
7. Đặt tên: `student-db` (hoặc tên bạn muốn)
8. Chọn region: **Singapore** hoặc **Tokyo** (gần Việt Nam)
9. Click **Create**

### Bước 2: Vercel tự động setup

Sau khi tạo database, Vercel sẽ **TỰ ĐỘNG**:
- ✅ Tạo các biến môi trường (`POSTGRES_URL`, etc.)
- ✅ Kết nối database với project
- ✅ Không cần làm gì thêm!

### Bước 3: Khởi tạo Database Tables

Sau khi deploy, truy cập URL này **MỘT LẦN** để tạo tables:

```
https://your-app.vercel.app/api/init-db
```

Hoặc chạy local (nếu đã có POSTGRES_URL trong .env.local):

```bash
curl http://localhost:3000/api/init-db
```

### Bước 4: Xong! 

Bây giờ dữ liệu sẽ **KHÔNG BỊ MẤT** nữa! 🎉

## Kiểm tra Database đã hoạt động chưa

1. Vào Vercel Dashboard > Storage > Database của bạn
2. Click **Data** tab
3. Xem có tables: `users`, `students`, `classes` chưa
4. Nếu chưa có, chạy `/api/init-db` như trên

## Lưu ý

- ✅ **Hobby Plan (Free)**: Đủ cho development và small projects
- ✅ Dữ liệu sẽ **PERSISTENT** (không bị mất)
- ✅ Có thể backup và restore
- ⚠️ Nếu không setup database, **DỮ LIỆU SẼ BỊ MẤT** sau mỗi deploy

## Troubleshooting

### Lỗi: "Cannot find module '@vercel/postgres'"

```bash
npm install @vercel/postgres
```

### Lỗi: "relation does not exist"

Chạy endpoint `/api/init-db` để tạo tables

### Database không kết nối

1. Kiểm tra Vercel Dashboard > Settings > Environment Variables
2. Đảm bảo có `POSTGRES_URL`
3. Nếu chưa có, vào Storage > Database > Copy .env.local

## Tóm tắt

1. ✅ Tạo Vercel Postgres Database (MIỄN PHÍ)
2. ✅ Vercel tự động setup biến môi trường
3. ✅ Deploy project
4. ✅ Truy cập `/api/init-db` để tạo tables
5. ✅ Xong! Dữ liệu sẽ không bị mất nữa

---

**Lưu ý quan trọng:** Code hiện tại đã tự động chuyển sang Postgres khi có `POSTGRES_URL`, không cần sửa code gì cả!

