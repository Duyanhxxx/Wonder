# Hướng dẫn Deploy lên Vercel

## Bước 1: Chuẩn bị code

1. Đảm bảo code đã được commit và push lên GitHub repository

## Bước 2: Kết nối với Vercel

1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập bằng GitHub account
3. Click "Add New..." > "Project"
4. Import repository từ GitHub
5. Vercel sẽ tự động detect Next.js

## Bước 3: Cấu hình Environment Variables

1. Trong project settings, vào "Environment Variables"
2. Thêm biến môi trường:
   - **Name**: `JWT_SECRET`
   - **Value**: Một chuỗi ngẫu nhiên (ví dụ: `openssl rand -base64 32`)

## Bước 4: Deploy

1. Click "Deploy"
2. Chờ quá trình build hoàn tất
3. Truy cập URL được cung cấp

## Lưu ý quan trọng về Database

⚠️ **Ứng dụng hiện tại sử dụng file system để lưu trữ dữ liệu, điều này KHÔNG hoạt động trên Vercel production.**

### Giải pháp đề xuất:

1. **Vercel Postgres** (Khuyến nghị)
   - Tích hợp sẵn với Vercel
   - Miễn phí cho tier đầu tiên
   - Cài đặt: Vercel Dashboard > Storage > Create Database

2. **Supabase** (Miễn phí)
   - PostgreSQL database
   - Dễ sử dụng
   - Có dashboard quản lý

3. **MongoDB Atlas** (Miễn phí)
   - NoSQL database
   - Dễ tích hợp

### Để chuyển sang database thực sự:

1. Cài đặt database service
2. Cập nhật file `lib/db.ts` để sử dụng database thay vì file system
3. Deploy lại

### Tạm thời cho demo:

Ứng dụng sẽ hoạt động nhưng dữ liệu sẽ bị mất sau mỗi lần deploy vì Vercel sử dụng ephemeral file system.

## Troubleshooting

- **Build failed**: Kiểm tra logs trong Vercel dashboard
- **Authentication không hoạt động**: Đảm bảo JWT_SECRET đã được set
- **Dữ liệu bị mất**: Cần chuyển sang database thực sự

