# Environment Variables Template

## Các biến môi trường cần thiết

Copy các biến này và thêm vào Vercel Environment Variables:

### 1. JWT_SECRET (BẮT BUỘC)

```
JWT_SECRET=your-secret-key-here
```

**Cách generate:**
```bash
node generate-jwt-secret.js
```

Hoặc:
```bash
openssl rand -base64 32
```

### 2. POSTGRES_URL (TỰ ĐỘNG - khi tạo Vercel Postgres)

```
POSTGRES_URL=postgres://...
POSTGRES_PRISMA_URL=postgres://...
POSTGRES_URL_NON_POOLING=postgres://...
```

**Lưu ý:** Các biến này sẽ được Vercel tự động thêm khi bạn tạo Postgres Database. Không cần thêm thủ công!

### 3. NODE_ENV (TỰ ĐỘNG)

```
NODE_ENV=production
```

**Lưu ý:** Vercel tự động set biến này. Không cần thêm thủ công!

---

## Hướng dẫn setup

Xem file `VERCEL_ENV_SETUP.md` để biết cách setup chi tiết.

