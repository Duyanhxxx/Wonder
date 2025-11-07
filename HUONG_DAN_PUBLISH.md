# Hướng Dẫn: Publish Google Sheets để Import

## ⚠️ QUAN TRỌNG: Share ≠ Publish

Có 2 cách để cho phép người khác truy cập Google Sheets:

### 1. Share (Chia sẻ) - ❌ KHÔNG ĐỦ để import
- **File → Share** hoặc nút **"Share"** ở góc trên
- Chọn "Anyone with the link can view"
- ✅ Cho phép xem trong Google Sheets
- ❌ **KHÔNG cho phép export CSV** → Website không thể import được!

### 2. Publish to web (Xuất bản) - ✅ CẦN THIẾT để import
- **File → Publish to web**
- Cho phép export dữ liệu dưới dạng CSV
- ✅ Website có thể import được!

## 📋 Các bước Publish to web:

### Bước 1: Mở Google Sheets
1. Mở file Google Sheets của bạn
2. Đảm bảo bạn có quyền chỉnh sửa

### Bước 2: Publish to web
1. Click **File** ở menu trên cùng
2. Chọn **"Publish to web"** (hoặc **"Share" → "Publish to web"**)
3. Trong popup hiện ra:
   - **Link**: Chọn **"Entire document"** (hoặc chọn sheet cụ thể nếu muốn)
   - **Format**: Chọn **"CSV"**
   - Click nút **"Publish"**

### Bước 3: Xác nhận
1. Google sẽ hỏi xác nhận → Click **"OK"**
2. URL export sẽ được hiển thị (dạng: `https://docs.google.com/spreadsheets/d/.../export?format=csv&gid=...`)
3. Bạn có thể copy URL này hoặc copy URL từ thanh địa chỉ

### Bước 4: Import vào Website
1. Vào Dashboard → Click **"📊 Google Sheets"**
2. Paste URL vào ô
3. Tích vào **"Import từ TẤT CẢ sheets"** nếu muốn import tất cả
4. Click **"Import"**

## 🔍 Kiểm tra đã Publish chưa:

Cách 1: Thử truy cập URL export trực tiếp
```
https://docs.google.com/spreadsheets/d/YOUR_SHEET_ID/export?format=csv&gid=0
```
- Nếu thấy dữ liệu CSV → ✅ Đã publish thành công
- Nếu thấy lỗi 403 → ❌ Chưa publish

Cách 2: Kiểm tra trong Google Sheets
- Vào **File → Publish to web**
- Nếu thấy nút **"Stop publishing"** → ✅ Đã publish
- Nếu thấy nút **"Publish"** → ❌ Chưa publish

## 💡 Lưu ý:

1. **Publish to web** khác với **Share**:
   - Share: Chỉ cho phép xem trong Google Sheets
   - Publish: Cho phép export dữ liệu (CSV, HTML, etc.)

2. **Bảo mật**:
   - Khi publish, dữ liệu có thể được truy cập công khai qua URL export
   - Chỉ publish những sheet không chứa thông tin nhạy cảm
   - Có thể "Stop publishing" bất cứ lúc nào

3. **Import tất cả sheets**:
   - Cần publish **"Entire document"** để import từ tất cả sheets
   - Hoặc publish từng sheet riêng và import từng cái

## ❓ Troubleshooting:

### Lỗi: "Không thể truy cập Google Sheets"
**Nguyên nhân**: Chưa publish to web

**Giải pháp**:
1. Vào Google Sheets
2. File → Publish to web
3. Chọn "Entire document" và format "CSV"
4. Click "Publish"
5. Thử lại import

### Lỗi: "Sheet không tồn tại"
**Nguyên nhân**: URL không đúng hoặc sheet đã bị xóa

**Giải pháp**:
- Kiểm tra lại URL
- Đảm bảo sheet vẫn còn tồn tại

### Lỗi: "Không tìm thấy dữ liệu học sinh"
**Nguyên nhân**: Sheet không có dữ liệu hoặc format không đúng

**Giải pháp**:
- Kiểm tra sheet có cột "Họ và tên" hoặc "TT"
- Đảm bảo có ít nhất 1 dòng dữ liệu (không tính header)

