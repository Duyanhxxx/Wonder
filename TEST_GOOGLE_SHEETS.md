# Test Google Sheets Import

## Link Google Sheets của bạn:
```
https://docs.google.com/spreadsheets/d/1_P4wg8ZJmiHiZoOoIWrqB1wS6C8u00tV/edit?gid=60524990#gid=60524990
```

## Cách test:

### Bước 1: Publish Google Sheets
1. Mở Google Sheets
2. Click **File** → **Share** → **Publish to web**
3. Chọn:
   - **"Entire document"** hoặc chọn sheet cụ thể
   - Format: **"CSV"**
4. Click **"Publish"**
5. Copy URL được hiển thị

### Bước 2: Hoặc Share Public
1. Click nút **"Share"** (góc trên bên phải)
2. Click **"Change to anyone with the link"**
3. Chọn **"Viewer"**
4. Click **"Done"**

### Bước 3: Import vào Website
1. Vào Dashboard
2. Click nút **"📊 Google Sheets"**
3. Paste URL:
   ```
   https://docs.google.com/spreadsheets/d/1_P4wg8ZJmiHiZoOoIWrqB1wS6C8u00tV/edit?gid=60524990#gid=60524990
   ```
4. Click **"Import"**

## Cấu trúc Sheet của bạn:

- **Dòng 5**: Header: TT, Họ và tên, Ngày vào, SĐT, Ngày đóng, Ký tên, Điểm danh, ...
- **Dòng 6**: Sub-header: B1, B2, B3, B4, B5, B6, B7, B8
- **Dòng 7+**: Dữ liệu học sinh

## Dữ liệu mẫu:

| STT | Họ và tên | Ngày vào | SĐT | ... |
|-----|-----------|----------|-----|-----|
| 1 | Nguyễn Ngọc Nguyên | 26-thg 9 | 0947 563 357 | ... |
| 2 | Đỗ Ngọc Vân | 26-thg 9 | 0983 452 778 | ... |
| 3 | Lư Tố Vân | 26-thg 9 | 0832 678 696 | ... |

## Lưu ý:

- Sheet phải được **publish** hoặc **share public** để website có thể truy cập
- Hệ thống sẽ tự động bỏ qua dòng header và sub-header
- Chỉ import các dòng có "Họ và tên" (không trống)

