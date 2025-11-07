# Hướng dẫn nhanh

## Chạy ứng dụng local

```bash
# 1. Cài đặt dependencies
npm install

# 2. Chạy development server
npm run dev

# 3. Mở trình duyệt tại http://localhost:3000
```

## Sử dụng lần đầu

1. Truy cập http://localhost:3000
2. Bạn sẽ được chuyển đến trang đăng ký
3. Tạo tài khoản mới với:
   - Họ và tên
   - Email
   - Mật khẩu (tối thiểu 6 ký tự)
4. Sau khi đăng ký, bạn sẽ được chuyển đến dashboard
5. Bắt đầu thêm học sinh mới!

## Deploy lên Vercel

Xem file `DEPLOY.md` để biết hướng dẫn chi tiết.

### Tóm tắt:
1. Push code lên GitHub
2. Import project vào Vercel
3. Thêm biến môi trường `JWT_SECRET`
4. Deploy!

## Tính năng

- ✅ Đăng ký/Đăng nhập
- ✅ Thêm học sinh mới
- ✅ Sửa thông tin học sinh
- ✅ Xóa học sinh
- ✅ Tìm kiếm học sinh
- ✅ Quản lý điểm danh (8 buổi)
- ✅ Ghi chú và thông tin chi tiết

## Lưu ý

- Dữ liệu được lưu trong thư mục `data/` (local development)
- Để deploy production, cần chuyển sang database thực sự (xem DEPLOY.md)

