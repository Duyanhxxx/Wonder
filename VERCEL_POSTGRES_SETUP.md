# Hướng dẫn Setup Vercel Postgres Database

## Bước 1: Tạo Vercel Postgres Database

1. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào tab **Storage**
4. Click **Create Database**
5. Chọn **Postgres**
6. Chọn plan (Hobby plan miễn phí cho development)
7. Đặt tên database (ví dụ: `student-db`)
8. Chọn region gần bạn nhất (ví dụ: `Singapore` hoặc `Tokyo`)
9. Click **Create**

## Bước 2: Kết nối Database với Project

Sau khi tạo database, Vercel sẽ tự động:
- Tạo các biến môi trường cần thiết
- Kết nối database với project

Các biến môi trường được tạo tự động:
- `POSTGRES_URL`
- `POSTGRES_PRISMA_URL`
- `POSTGRES_URL_NON_POOLING`

## Bước 3: Cài đặt Package

Thêm package `@vercel/postgres` vào project:

```bash
npm install @vercel/postgres
```

## Bước 4: Cập nhật Code

### 4.1. Cập nhật `lib/db.ts` để sử dụng Postgres

Thay thế nội dung file `lib/db.ts`:

```typescript
// lib/db.ts - Sử dụng Postgres khi có POSTGRES_URL, ngược lại dùng file system
import { User, Student } from './db-types';

// Kiểm tra xem có sử dụng Postgres không
const usePostgres = !!process.env.POSTGRES_URL;

if (usePostgres) {
  // Dynamic import để tránh lỗi khi không có @vercel/postgres
  const { 
    getUsersPostgres, 
    saveUsersPostgres,
    getStudentsPostgres,
    saveStudentsPostgres,
    deleteStudentPostgres
  } = require('./db-postgres');

  export async function getUsers(): Promise<User[]> {
    return getUsersPostgres();
  }

  export async function saveUsers(users: User[]): Promise<void> {
    return saveUsersPostgres(users);
  }

  export async function getStudents(): Promise<Student[]> {
    return getStudentsPostgres();
  }

  export async function saveStudents(students: Student[]): Promise<void> {
    return saveStudentsPostgres(students);
  }
} else {
  // Sử dụng file system cho local development
  // ... code hiện tại ...
}
```

### 4.2. Hoặc tạo file mới `lib/db-adapter.ts`:

```typescript
// lib/db-adapter.ts
import { User, Student } from './db';

const usePostgres = !!process.env.POSTGRES_URL;

export async function getUsers(): Promise<User[]> {
  if (usePostgres) {
    const { getUsersPostgres } = await import('./db-postgres');
    return getUsersPostgres();
  } else {
    const { getUsers } = await import('./db-fs');
    return getUsers();
  }
}

// Tương tự cho các functions khác...
```

## Bước 5: Khởi tạo Database Tables

Sau khi deploy, truy cập URL sau để khởi tạo tables:

```
https://your-app.vercel.app/api/init-db
```

Hoặc chạy local với biến môi trường:

```bash
# Tạo file .env.local
POSTGRES_URL=your-postgres-url-here

# Chạy init
curl http://localhost:3000/api/init-db
```

## Bước 6: Deploy và Test

1. Commit và push code lên GitHub
2. Vercel sẽ tự động deploy
3. Sau khi deploy xong, truy cập `/api/init-db` để tạo tables
4. Test ứng dụng

## Troubleshooting

### Lỗi: "Cannot find module '@vercel/postgres'"

**Giải pháp:** Đảm bảo đã cài đặt package:
```bash
npm install @vercel/postgres
```

### Lỗi: "Environment variable POSTGRES_URL is not set"

**Giải pháp:** 
- Kiểm tra trong Vercel Dashboard > Settings > Environment Variables
- Đảm bảo các biến môi trường Postgres đã được thêm tự động
- Nếu chưa có, thêm thủ công từ Storage > Database > .env.local

### Lỗi: "relation does not exist"

**Giải pháp:** Chạy endpoint `/api/init-db` để tạo tables

### Database không kết nối được

**Giải pháp:**
1. Kiểm tra database status trong Vercel Dashboard
2. Đảm bảo database đã được tạo và active
3. Kiểm tra region của database phù hợp với project

## Migration từ File System sang Postgres

Nếu bạn đã có dữ liệu trong file system và muốn migrate:

1. Export dữ liệu từ file system (tạo API endpoint tạm thời)
2. Import vào Postgres (sử dụng `saveUsersPostgres` và `saveStudentsPostgres`)

## Lưu ý

- **Hobby Plan (Free)**: 
  - 256 MB storage
  - 60 hours compute time/month
  - Phù hợp cho development và small projects

- **Production**: 
  - Nên upgrade lên Pro plan cho production
  - Có backup tự động
  - Better performance

## Tài liệu tham khảo

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [@vercel/postgres Package](https://www.npmjs.com/package/@vercel/postgres)

