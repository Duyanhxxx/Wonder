# Hệ Thống Quản Lý Học Sinh - Wonder Center

Ứng dụng web quản lý học sinh với đầy đủ tính năng CRUD, đăng nhập và đăng ký.

## Tính năng

- ✅ Đăng ký và đăng nhập người dùng
- ✅ Quản lý học sinh (CRUD)
- ✅ Tìm kiếm học sinh
- ✅ Điểm danh (8 buổi học)
- ✅ Ghi chú và thông tin chi tiết
- ✅ UI hiện đại và responsive

## Công nghệ sử dụng

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **JWT** - Authentication
- **bcryptjs** - Password hashing

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env.local` (tùy chọn):
```env
JWT_SECRET=your-secret-key-here
```

3. Chạy development server:
```bash
npm run dev
```

4. Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt

## Deploy lên Vercel

1. Đẩy code lên GitHub repository

2. Kết nối repository với Vercel:
   - Truy cập [vercel.com](https://vercel.com)
   - Import project từ GitHub
   - Vercel sẽ tự động detect Next.js và cấu hình

3. Thêm environment variable (nếu cần):
   - Vào Settings > Environment Variables
   - Thêm `JWT_SECRET` với giá trị bất kỳ

4. Deploy!

**Lưu ý:** Ứng dụng này sử dụng file system để lưu trữ dữ liệu. Để sử dụng trong production, bạn nên chuyển sang database như Vercel Postgres, MongoDB, hoặc Supabase.

## Cấu trúc dự án

```
├── app/
│   ├── api/          # API routes
│   ├── dashboard/    # Trang quản lý
│   ├── login/        # Trang đăng nhập
│   └── register/     # Trang đăng ký
├── components/       # React components
├── lib/              # Utilities và helpers
└── data/             # Database files (JSON)
```

## Sử dụng

1. Đăng ký tài khoản mới tại `/register`
2. Đăng nhập tại `/login`
3. Quản lý học sinh tại `/dashboard`
   - Thêm học sinh mới
   - Sửa thông tin học sinh
   - Xóa học sinh
   - Tìm kiếm học sinh

