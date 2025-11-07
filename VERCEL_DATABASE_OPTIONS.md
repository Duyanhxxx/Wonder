# 🗄️ Các Lựa Chọn Database trên Vercel

## Tình hình hiện tại

Vercel đã thay đổi cách cung cấp database. **Vercel Postgres** có thể không còn trong Core Services và chỉ có qua Marketplace.

## Các lựa chọn Database phù hợp

### 1. **Neon** (Khuyến nghị nhất) ⭐

**Tại sao chọn Neon:**
- ✅ **Serverless Postgres** - tương thích 100% với code hiện tại
- ✅ **Miễn phí** cho development (512 MB storage)
- ✅ **Dễ setup** - chỉ cần click và connect
- ✅ **Tương thích với `@vercel/postgres`** hoặc có thể dùng connection string trực tiếp
- ✅ **Auto-scaling** - tự động scale theo nhu cầu

**Cách setup:**
1. Vào Vercel Dashboard → Storage → Marketplace
2. Chọn **Neon**
3. Click **Create**
4. Neon sẽ tự động tạo database và thêm environment variables

**Connection:**
- Code hiện tại của bạn đã sẵn sàng với `@vercel/postgres`
- Hoặc có thể dùng connection string từ Neon

### 2. **Supabase** (Tốt thứ 2)

**Tại sao chọn Supabase:**
- ✅ **Postgres backend** - tương thích với code
- ✅ **Miễn phí** cho development
- ✅ **Nhiều tính năng** (Auth, Storage, Realtime)
- ✅ **Dễ dùng**

**Cách setup:**
1. Vào Vercel Dashboard → Storage → Marketplace
2. Chọn **Supabase**
3. Click **Create**
4. Setup Supabase project

### 3. **Prisma Postgres** (Tốt nếu dùng Prisma)

**Tại sao chọn:**
- ✅ **Instant Serverless Postgres**
- ✅ **Tích hợp tốt với Prisma ORM**
- ⚠️ Cần migrate code sang Prisma (nếu chưa dùng)

### 4. **Turso** (Nếu muốn SQLite)

**Tại sao chọn:**
- ✅ **Serverless SQLite**
- ✅ **Rất nhanh**
- ⚠️ Cần thay đổi code (không dùng Postgres)

## Khuyến nghị cho project của bạn

### ✅ Chọn **Neon** vì:

1. **Code hiện tại đã sẵn sàng:**
   - Bạn đang dùng `@vercel/postgres`
   - Neon tương thích với Postgres
   - Có thể dùng connection string từ Neon

2. **Dễ migrate:**
   - Chỉ cần thay `POSTGRES_URL` environment variable
   - Code không cần thay đổi nhiều

3. **Miễn phí cho development:**
   - 512 MB storage
   - Đủ cho project nhỏ và vừa

## Cách setup với Neon

### Bước 1: Tạo Neon Database

1. Vào Vercel Dashboard → Project → **Storage** tab
2. Click **Marketplace**
3. Tìm và chọn **Neon**
4. Click **Create** hoặc **Add Integration**
5. Đăng ký/đăng nhập Neon (nếu chưa có)
6. Chọn plan: **Free** (cho development)
7. Đặt tên database: `wonder-db`
8. Click **Create**

### Bước 2: Vercel tự động setup

Sau khi tạo, Vercel sẽ **TỰ ĐỘNG**:
- ✅ Tạo environment variables
- ✅ Kết nối database với project
- ✅ Thêm `POSTGRES_URL` (hoặc tên tương tự)

### Bước 3: Cập nhật code (nếu cần)

Nếu Neon dùng connection string khác, bạn có thể:

**Option 1: Dùng connection string trực tiếp**
```typescript
// lib/db-postgres.ts
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.POSTGRES_URL);
```

**Option 2: Giữ nguyên code hiện tại**
- Nếu Neon cung cấp `POSTGRES_URL` tương thích với `@vercel/postgres`
- Code hiện tại sẽ hoạt động ngay

### Bước 4: Khởi tạo Database

Sau khi deploy, truy cập:
```
https://your-app.vercel.app/api/init-db
```

## So sánh nhanh

| Database | Type | Free Tier | Setup | Tương thích code |
|----------|------|-----------|-------|------------------|
| **Neon** | Postgres | 512 MB | ⭐⭐⭐ Rất dễ | ✅ 100% |
| **Supabase** | Postgres | 500 MB | ⭐⭐⭐ Rất dễ | ✅ 100% |
| **Prisma Postgres** | Postgres | Limited | ⭐⭐ Dễ | ⚠️ Cần Prisma |
| **Turso** | SQLite | 1 GB | ⭐⭐ Dễ | ❌ Cần thay code |

## Lưu ý

- **Vercel Postgres** có thể vẫn còn nhưng không hiển thị trong Core Services
- Thử tìm trong **Storage** → **All** hoặc search "Postgres"
- Nếu không tìm thấy, dùng **Neon** là lựa chọn tốt nhất

## Tóm tắt

1. ✅ **Chọn Neon** (khuyến nghị nhất)
2. ✅ Setup qua Vercel Marketplace
3. ✅ Vercel tự động thêm environment variables
4. ✅ Code hiện tại sẽ hoạt động (hoặc chỉ cần chỉnh nhỏ)
5. ✅ Chạy `/api/init-db` để tạo tables

---

**Kết luận:** Neon là lựa chọn tốt nhất cho project của bạn vì tương thích 100% với code hiện tại và dễ setup!

