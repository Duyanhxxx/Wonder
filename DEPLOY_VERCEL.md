# 🚀 Hướng dẫn Deploy lên Vercel

## Bước 1: Đăng nhập Vercel

1. Truy cập [https://vercel.com](https://vercel.com)
2. Click **Sign Up** hoặc **Log In**
3. Chọn **Continue with GitHub** để kết nối với GitHub account

## Bước 2: Import Project từ GitHub

1. Sau khi đăng nhập, click **Add New...** → **Project**
2. Tìm repository **Duyanhxxx/Wonder** trong danh sách
3. Click **Import** bên cạnh repository

## Bước 3: Cấu hình Project

Vercel sẽ tự động detect:
- **Framework Preset**: Next.js ✅
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅

**KHÔNG CẦN THAY ĐỔI GÌ** - giữ nguyên cấu hình mặc định!

## Bước 4: Deploy

1. Click **Deploy**
2. Đợi Vercel build và deploy (khoảng 2-3 phút)
3. Sau khi deploy xong, bạn sẽ có URL như: `https://wonder-xxx.vercel.app`

## Bước 5: Setup Database (QUAN TRỌNG!)

⚠️ **Nếu không setup database, dữ liệu sẽ BỊ MẤT sau mỗi lần deploy!**

### 5.1. Tạo Vercel Postgres Database

1. Vào Vercel Dashboard → Chọn project **Wonder**
2. Vào tab **Storage** (hoặc **Databases**)
3. Click **Create Database**
4. Chọn **Postgres**
5. Chọn **Hobby** (MIỄN PHÍ)
6. Đặt tên: `wonder-db` (hoặc tên bạn muốn)
7. Chọn region: **Singapore** hoặc **Tokyo** (gần Việt Nam)
8. Click **Create**

### 5.2. Vercel tự động setup

Sau khi tạo database, Vercel sẽ **TỰ ĐỘNG**:
- ✅ Tạo các biến môi trường (`POSTGRES_URL`, etc.)
- ✅ Kết nối database với project
- ✅ Không cần làm gì thêm!

### 5.3. Khởi tạo Database Tables

Sau khi deploy xong, truy cập URL này **MỘT LẦN** để tạo tables:

```
https://your-app.vercel.app/api/init-db
```

Hoặc từ Vercel Dashboard:
1. Vào tab **Functions**
2. Tìm function `/api/init-db`
3. Click để chạy

## Bước 6: Test ứng dụng

1. Truy cập URL của bạn: `https://your-app.vercel.app`
2. Đăng ký tài khoản mới
3. Tạo lớp học hoặc upload file Excel
4. Kiểm tra dữ liệu có được lưu không

## Lưu ý quan trọng

### ✅ Đã làm:
- ✅ Code đã được push lên GitHub
- ✅ Repository: https://github.com/Duyanhxxx/Wonder.git
- ✅ Project sẵn sàng deploy

### ⚠️ Cần làm sau khi deploy:
1. **Setup Vercel Postgres Database** (Bước 5)
2. **Chạy `/api/init-db`** để tạo tables
3. **Test ứng dụng** để đảm bảo mọi thứ hoạt động

### 🔄 Cập nhật code sau này:

Khi bạn thay đổi code và muốn deploy lại:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel sẽ **TỰ ĐỘNG** deploy lại khi có push mới lên GitHub!

## Troubleshooting

### Lỗi: "Cannot find module '@vercel/postgres'"

**Giải pháp:** Đảm bảo trong `package.json` đã có:
```json
"@vercel/postgres": "^0.5.1"
```

### Lỗi: "Environment variable POSTGRES_URL is not set"

**Giải pháp:**
1. Vào Vercel Dashboard → Settings → Environment Variables
2. Kiểm tra có `POSTGRES_URL` chưa
3. Nếu chưa có, vào Storage → Database → Copy .env.local

### Lỗi: "relation does not exist"

**Giải pháp:** Chạy endpoint `/api/init-db` để tạo tables

### Database không kết nối được

**Giải pháp:**
1. Kiểm tra database status trong Vercel Dashboard
2. Đảm bảo database đã được tạo và active
3. Kiểm tra region của database phù hợp với project

## Tài liệu tham khảo

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Chúc bạn deploy thành công! 🎉**

