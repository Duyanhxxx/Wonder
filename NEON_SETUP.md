# 🚀 Hướng dẫn Setup Neon Database

## Bước 1: Cài đặt Package

Package đã được thêm vào `package.json`:
```json
"@neondatabase/serverless": "^0.9.0"
```

Nếu chưa cài, chạy:
```bash
npm install
```

## Bước 2: Tạo Neon Database trên Vercel

### 2.1. Vào Vercel Dashboard

1. Truy cập [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Chọn project **Wonder** của bạn
3. Vào tab **Storage**

### 2.2. Thêm Neon từ Marketplace

1. Click **Marketplace** (hoặc tìm trong danh sách)
2. Tìm và chọn **Neon**
3. Click **Add Integration** hoặc **Create**
4. Đăng ký/đăng nhập Neon (nếu chưa có account)
   - Có thể dùng GitHub để đăng nhập nhanh

### 2.3. Tạo Database

1. Chọn plan: **Free** (512 MB storage - đủ cho development)
2. Đặt tên database: `wonder-db` (hoặc tên bạn muốn)
3. Chọn region: **Singapore** hoặc **Tokyo** (gần Việt Nam)
4. Click **Create**

### 2.4. Vercel tự động setup

Sau khi tạo database, Vercel sẽ **TỰ ĐỘNG**:
- ✅ Tạo environment variable `POSTGRES_URL`
- ✅ Kết nối database với project
- ✅ Không cần làm gì thêm!

## Bước 3: Verify Environment Variable

1. Vào Vercel Dashboard → Project → **Settings** → **Environment Variables**
2. Kiểm tra có `POSTGRES_URL` với giá trị bắt đầu bằng:
   ```
   postgres://...@neon.tech/...
   ```
3. Nếu chưa có, vào **Storage** → **Neon** → Copy connection string

## Bước 4: Deploy hoặc Redeploy

Sau khi thêm Neon:

1. Vào tab **Deployments**
2. Click **...** (3 dots) ở deployment mới nhất
3. Chọn **Redeploy**
4. Hoặc push một commit mới:
   ```bash
   git commit --allow-empty -m "Trigger redeploy with Neon"
   git push origin main
   ```

## Bước 5: Khởi tạo Database Tables

Sau khi deploy xong, truy cập URL này **MỘT LẦN**:

```
https://your-app.vercel.app/api/init-db
```

Hoặc từ Vercel Dashboard:
1. Vào tab **Functions**
2. Tìm function `/api/init-db`
3. Click để chạy

## Bước 6: Test

1. Truy cập ứng dụng: `https://your-app.vercel.app`
2. Đăng ký tài khoản mới
3. Tạo lớp học hoặc upload file CSV
4. Kiểm tra dữ liệu có được lưu không

## Code đã được cập nhật

Code hiện tại đã tự động:
- ✅ Detect Neon connection string (có `@neon.tech`)
- ✅ Sử dụng `@neondatabase/serverless` cho Neon
- ✅ Sử dụng `@vercel/postgres` cho Vercel Postgres
- ✅ Tương thích với cả hai

## Troubleshooting

### Lỗi: "Failed to initialize Neon database"

**Giải pháp:**
1. Đảm bảo đã cài package: `npm install @neondatabase/serverless`
2. Kiểm tra `POSTGRES_URL` có chứa `@neon.tech` không
3. Redeploy application

### Lỗi: "POSTGRES_URL environment variable is not set"

**Giải pháp:**
1. Vào Vercel Dashboard → Settings → Environment Variables
2. Kiểm tra có `POSTGRES_URL` chưa
3. Nếu chưa có, vào Storage → Neon → Copy connection string
4. Thêm thủ công vào Environment Variables

### Database không kết nối được

**Giải pháp:**
1. Kiểm tra Neon Dashboard → Database status
2. Đảm bảo database đã được tạo và active
3. Kiểm tra connection string đúng chưa
4. Thử reset password trong Neon Dashboard nếu cần

### Lỗi khi chạy `/api/init-db`

**Giải pháp:**
1. Kiểm tra logs trong Vercel Dashboard → Functions
2. Đảm bảo `POSTGRES_URL` đã được set
3. Kiểm tra Neon database có đang hoạt động không

## Neon Free Tier

- ✅ **512 MB storage** - đủ cho development và small projects
- ✅ **Unlimited requests** (với rate limits)
- ✅ **Auto-scaling** - tự động scale theo nhu cầu
- ✅ **Backup tự động**

## Upgrade (khi cần)

Khi project phát triển, có thể upgrade:
- **Pro**: $19/month - 10 GB storage
- **Scale**: Custom pricing - cho production lớn

## Tóm tắt

1. ✅ Cài package: `npm install` (đã có trong package.json)
2. ✅ Vào Vercel → Storage → Marketplace → Neon
3. ✅ Tạo database (Free plan)
4. ✅ Vercel tự động thêm `POSTGRES_URL`
5. ✅ Redeploy application
6. ✅ Chạy `/api/init-db` để tạo tables
7. ✅ Test ứng dụng

---

**Lưu ý:** Code đã tự động detect và sử dụng Neon khi thấy connection string có `@neon.tech`. Không cần thay đổi code gì cả!

