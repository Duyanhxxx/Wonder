# 🔐 Hướng dẫn Setup Environment Variables trên Vercel

## Bước 1: Generate JWT Secret Key

### Cách 1: Sử dụng script (Khuyến nghị)

```bash
node generate-jwt-secret.js
```

Script sẽ tạo một JWT secret key an toàn và hiển thị cho bạn.

### Cách 2: Sử dụng OpenSSL

```bash
openssl rand -base64 32
```

### Cách 3: Sử dụng Node.js

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Lưu ý:** Copy JWT secret key này lại, bạn sẽ cần nó ở bước tiếp theo.

## Bước 2: Setup Environment Variables trên Vercel

### 2.1. Vào Vercel Dashboard

1. Truy cập [https://vercel.com/dashboard](https://vercel.com/dashboard)
2. Chọn project **Wonder** của bạn
3. Vào tab **Settings**
4. Click **Environment Variables** ở menu bên trái

### 2.2. Thêm JWT_SECRET

1. Click **Add New**
2. **Key:** `JWT_SECRET`
3. **Value:** Paste JWT secret key bạn đã generate ở Bước 1
4. **Environment:** Chọn tất cả (Production, Preview, Development)
5. Click **Save**

### 2.3. Vercel Postgres sẽ tự động thêm

Khi bạn tạo Vercel Postgres Database, các biến môi trường sau sẽ **TỰ ĐỘNG** được thêm:

- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL`
- ✅ `POSTGRES_URL_NON_POOLING`

**Bạn KHÔNG CẦN thêm thủ công** các biến này!

## Bước 3: Verify Environment Variables

Sau khi thêm xong, bạn sẽ thấy trong danh sách:

| Key | Value | Environment |
|-----|-------|-------------|
| `JWT_SECRET` | `[your-secret-key]` | All |
| `POSTGRES_URL` | `postgres://...` | All (tự động) |
| `POSTGRES_PRISMA_URL` | `postgres://...` | All (tự động) |
| `POSTGRES_URL_NON_POOLING` | `postgres://...` | All (tự động) |

## Bước 4: Redeploy Application

Sau khi thêm environment variables:

1. Vào tab **Deployments**
2. Click **...** (3 dots) ở deployment mới nhất
3. Chọn **Redeploy**
4. Đợi deploy xong

Hoặc đơn giản hơn, push một commit mới lên GitHub:

```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

## Bước 5: Test

Sau khi redeploy, test ứng dụng:

1. Truy cập URL của bạn: `https://your-app.vercel.app`
2. Đăng ký tài khoản mới
3. Đăng nhập
4. Kiểm tra mọi thứ hoạt động bình thường

## Troubleshooting

### Lỗi: "JWT_SECRET is not set"

**Giải pháp:**
1. Kiểm tra trong Vercel Dashboard → Settings → Environment Variables
2. Đảm bảo `JWT_SECRET` đã được thêm
3. Đảm bảo đã chọn tất cả environments (Production, Preview, Development)
4. Redeploy application

### Lỗi: "POSTGRES_URL is not set"

**Giải pháp:**
1. Tạo Vercel Postgres Database (xem `VERCEL_POSTGRES_SETUP.md`)
2. Vercel sẽ tự động thêm các biến môi trường Postgres
3. Nếu chưa có, vào Storage → Database → Copy .env.local

### Environment Variables không áp dụng

**Giải pháp:**
1. Redeploy application sau khi thêm environment variables
2. Đảm bảo đã chọn đúng environment (Production, Preview, Development)
3. Clear cache và thử lại

## Security Best Practices

### ✅ DO (Nên làm):

- ✅ Sử dụng JWT secret key dài và phức tạp (ít nhất 32 ký tự)
- ✅ Generate secret key bằng công cụ cryptographically secure
- ✅ Không commit `.env` file lên GitHub
- ✅ Sử dụng environment variables khác nhau cho Production và Development
- ✅ Rotate JWT secret key định kỳ (mỗi 6-12 tháng)

### ❌ DON'T (Không nên):

- ❌ Không sử dụng JWT secret key mặc định
- ❌ Không share JWT secret key công khai
- ❌ Không commit JWT secret key vào code
- ❌ Không sử dụng secret key ngắn hoặc dễ đoán

## Tóm tắt

1. ✅ Generate JWT secret key: `node generate-jwt-secret.js`
2. ✅ Vào Vercel Dashboard → Settings → Environment Variables
3. ✅ Thêm `JWT_SECRET` với value đã generate
4. ✅ Tạo Vercel Postgres Database (tự động thêm Postgres env vars)
5. ✅ Redeploy application
6. ✅ Test ứng dụng

---

**Lưu ý:** File `.env.example` chỉ là template, không chứa giá trị thực. Đừng commit file `.env` thực tế lên GitHub!

