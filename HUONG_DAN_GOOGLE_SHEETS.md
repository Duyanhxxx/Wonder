# Hướng Dẫn: Import từ Google Sheets

## 🎯 Tổng Quan

Bạn có thể import dữ liệu học sinh trực tiếp từ Google Sheets mà không cần download và upload file CSV!

## 📋 Cách 1: Publish Google Sheets (Khuyến nghị)

### Bước 1: Mở Google Sheets
1. Mở file Google Sheets của bạn trên Google Drive
2. Đảm bảo bạn có quyền chỉnh sửa

### Bước 2: Publish to Web
1. Click **File** → **Share** → **Publish to web**
2. Hoặc click **File** → **Publish to web** (tùy phiên bản)
3. Trong popup:
   - Chọn **"Entire document"** hoặc chọn sheet cụ thể
   - Format: Chọn **"CSV"**
   - Click **"Publish"**

### Bước 3: Copy URL
1. Copy URL được hiển thị (dạng: `https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=...`)
2. Hoặc copy URL từ thanh địa chỉ của Google Sheets

### Bước 4: Import vào Website
1. Vào Dashboard
2. Click nút **"📊 Google Sheets"**
3. Paste URL vào ô
4. Click **"Import"**

## 📋 Cách 2: Share Public (Đơn giản hơn)

### Bước 1: Share Google Sheets
1. Click nút **"Share"** (góc trên bên phải)
2. Click **"Change to anyone with the link"**
3. Chọn **"Viewer"** (chỉ xem)
4. Click **"Done"**

### Bước 2: Copy URL
1. Copy URL từ thanh địa chỉ
2. Format: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=GID`

### Bước 3: Import
1. Paste URL vào website
2. Hệ thống sẽ tự động convert sang CSV format

## ⚠️ Lưu Ý Quan Trọng

### Định dạng Google Sheets
Sheet của bạn cần có cấu trúc như sau:

| STT | Họ và tên | Ngày vào | SĐT | Ngày đóng | Ký tên | B1 | B2 | B3 | ... | Ghi chú | CK | 12% |
|-----|-----------|----------|-----|-----------|--------|----|----|----|-----|---------|----|-----|
| 1   | Nguyễn Văn A | 26-thg 9 | 0123... | ... | ... | x | x | | ... | ... | 0 | 0 |

### Yêu cầu
- ✅ Cột đầu tiên: STT
- ✅ Cột thứ 2: Họ và tên (bắt buộc)
- ✅ Các cột tiếp theo: Ngày vào, SĐT, Ngày đóng, Ký tên
- ✅ Điểm danh (B1-B8): Đánh dấu bằng "x", "X", "1", hoặc để trống
- ✅ Có thể có header row (hệ thống sẽ tự động bỏ qua)

### Quyền truy cập
- Sheet phải ở chế độ **"Anyone with the link can view"** hoặc đã được **Publish to web**
- Nếu sheet là private, hệ thống không thể truy cập được

## 🔄 Sync Real-time (Tương lai)

Hiện tại, bạn cần click "Import" mỗi khi muốn cập nhật dữ liệu. Trong tương lai có thể thêm tính năng:
- Auto-sync theo lịch
- Real-time sync
- Webhook từ Google Sheets

## 🐛 Troubleshooting

### Lỗi: "Không thể truy cập Google Sheets"

**Nguyên nhân:**
- Sheet chưa được publish hoặc share public

**Giải pháp:**
1. Vào Google Sheets
2. Click **File** → **Share** → **Publish to web**
3. Hoặc click **Share** → **Change to anyone with the link**

### Lỗi: "Không tìm thấy dữ liệu học sinh"

**Nguyên nhân:**
- Định dạng sheet không đúng
- Không có cột "Họ và tên"

**Giải pháp:**
1. Kiểm tra sheet có cột "Họ và tên" hoặc "TT"
2. Đảm bảo có ít nhất 1 dòng dữ liệu (không tính header)

### Lỗi: "URL Google Sheets không hợp lệ"

**Giải pháp:**
- Đảm bảo URL có dạng: `https://docs.google.com/spreadsheets/d/...`
- Copy đầy đủ URL từ thanh địa chỉ

## 💡 Tips

1. **Tối ưu hiệu suất:**
   - Chỉ import khi cần thiết
   - Xóa dữ liệu cũ trước khi import mới (nếu cần)

2. **Bảo mật:**
   - Không share sheet với thông tin nhạy cảm
   - Chỉ share ở chế độ "Viewer"

3. **Định dạng:**
   - Giữ nguyên định dạng như file Excel gốc
   - Hệ thống tự động parse các trường hợp đặc biệt

## ✅ Checklist

- [ ] Google Sheets đã được publish hoặc share public
- [ ] Sheet có đúng định dạng (STT, Họ và tên, ...)
- [ ] Copy đúng URL
- [ ] Import thành công
- [ ] Kiểm tra dữ liệu trên dashboard

