# Hướng dẫn thêm Environment Variables cho Neon vào Vercel

## Bước 1: Vào Vercel Dashboard

1. Truy cập: https://vercel.com/dashboard
2. Chọn project **Wonder** (hoặc tên project của bạn)
3. Vào **Settings** → **Environment Variables**

## Bước 2: Thêm Environment Variables

Thêm các biến sau từ Neon connection strings:

### ✅ QUAN TRỌNG: Thêm POSTGRES_URL_NON_POOLING (Ưu tiên)

**Key:** `POSTGRES_URL_NON_POOLING`
**Value:** 
```
postgresql://neondb_owner:npg_h4Q9jluIYOFA@ep-holy-surf-a11ax8hv.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Environment:** Chọn tất cả (Production, Preview, Development)

### Thêm POSTGRES_URL (Backup)

**Key:** `POSTGRES_URL`
**Value:**
```
postgresql://neondb_owner:npg_h4Q9jluIYOFA@ep-holy-surf-a11ax8hv-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

**Environment:** Chọn tất cả (Production, Preview, Development)

### Thêm JWT_SECRET (Nếu chưa có)

1. Chạy trên máy local:
   ```bash
   npm run generate:jwt
   ```

2. Copy JWT secret key

3. Thêm vào Vercel:
   **Key:** `JWT_SECRET`
   **Value:** (paste JWT secret)
   **Environment:** Tất cả

## Bước 3: Redeploy

Sau khi thêm environment variables:

1. Vào tab **Deployments**
2. Click **...** (3 dots) ở deployment mới nhất
3. Chọn **Redeploy**
4. Hoặc push commit mới:
   ```bash
   git commit --allow-empty -m "Trigger redeploy with Neon env vars"
   git push origin main
   ```

## Bước 4: Khởi tạo Database

Sau khi deploy xong:

1. Truy cập: `https://your-app.vercel.app/api/init-db`
2. Đợi response:
   ```json
   {
     "message": "Database initialized successfully",
     "tables": ["users", "classes", "students"]
   }
   ```

## Bước 5: Test ứng dụng

1. Truy cập: `https://your-app.vercel.app`
2. Đăng ký tài khoản mới
3. Đăng nhập
4. Tạo lớp học hoặc upload file CSV

## Troubleshooting

### Lỗi: "POSTGRES_URL environment variable is not set"

**Giải pháp:**
- Kiểm tra Vercel Dashboard → Settings → Environment Variables
- Đảm bảo `POSTGRES_URL_NON_POOLING` hoặc `POSTGRES_URL` đã được thêm
- Redeploy application

### Lỗi: "Database connection timeout"

**Giải pháp:**
1. Kiểm tra connection string đúng chưa
2. Thử dùng `POSTGRES_URL_NON_POOLING` thay vì `POSTGRES_URL`
3. Kiểm tra Neon database có đang active không
4. Kiểm tra logs trong Vercel Dashboard → Functions

### Lỗi: "Failed to initialize Neon database"

**Giải pháp:**
1. Kiểm tra `@neondatabase/serverless` đã được cài đặt chưa:
   ```bash
   npm list @neondatabase/serverless
   ```
2. Nếu chưa có, cài đặt:
   ```bash
   npm install @neondatabase/serverless
   ```
3. Commit và push lại:
   ```bash
   git add package.json package-lock.json
   git commit -m "Add @neondatabase/serverless"
   git push origin main
   ```

## Lưu ý

- ✅ **POSTGRES_URL_NON_POOLING** được ưu tiên vì tốt hơn cho Neon serverless
- ✅ Connection string **KHÔNG** nên có `channel_binding=require` (code sẽ tự động loại bỏ)
- ✅ Đảm bảo có `sslmode=require` trong connection string
- ✅ Sau khi thêm environment variables, **PHẢI redeploy** để áp dụng thay đổi

## Kiểm tra Environment Variables

Sau khi thêm, bạn có thể kiểm tra trong Vercel Dashboard:
- Settings → Environment Variables
- Xem danh sách các biến đã thêm
- Đảm bảo chúng được set cho đúng environment (Production, Preview, Development)

---

**Kết luận:** Sau khi thêm `POSTGRES_URL_NON_POOLING` và redeploy, truy cập `/api/init-db` để khởi tạo database! 🎉

