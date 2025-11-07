import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getStudents, saveStudents, getClasses, saveClasses, Student, ClassInfo } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Không có file được upload' }, { status: 400 });
    }

    // Chấp nhận file Excel (.xlsm, .xlsx, .xls), HTML (.html, .htm) hoặc CSV (.csv)
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsm') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm');
    const isCsv = fileName.endsWith('.csv');
    
    if (!isExcel && !isHtml && !isCsv) {
      return NextResponse.json({ 
        error: 'Chỉ chấp nhận file Excel (.xlsm, .xlsx, .xls), HTML (.html, .htm) hoặc CSV (.csv)' 
      }, { status: 400 });
    }

    // Đọc file Excel, HTML hoặc CSV
    let workbook: XLSX.WorkBook;
    
    if (isCsv) {
      // CSV là format đơn giản nhất và dễ parse nhất
      const text = await file.text();
      try {
        // XLSX có thể đọc CSV trực tiếp
        workbook = XLSX.read(text, { 
          type: 'string',
          FS: ',', // Field separator (dấu phẩy)
        });
        
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return NextResponse.json({ 
            error: 'Không tìm thấy dữ liệu trong file CSV.' 
          }, { status: 400 });
        }
      } catch (error: any) {
        return NextResponse.json({ 
          error: `Lỗi khi đọc file CSV: ${error.message}` 
        }, { status: 400 });
      }
    } else if (isHtml) {
      // Đọc file HTML
      const text = await file.text();
      // XLSX có thể đọc HTML nếu có cấu trúc table
      // XLSX tự động parse các thẻ <table> trong HTML
      try {
        workbook = XLSX.read(text, { 
          type: 'string',
          // HTML thường có nhiều table, xlsx sẽ tạo sheet cho mỗi table
          sheetStubs: true,
        });
        
        // Kiểm tra xem có sheet nào không
        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          return NextResponse.json({ 
            error: 'Không tìm thấy bảng trong file HTML. Đảm bảo file HTML có cấu trúc bảng (<table>).' 
          }, { status: 400 });
        }
      } catch (error: any) {
        return NextResponse.json({ 
          error: `Lỗi khi đọc file HTML: ${error.message}. Đảm bảo file HTML có cấu trúc bảng (<table>).` 
        }, { status: 400 });
      }
    } else {
      // Đọc file Excel
      const arrayBuffer = await file.arrayBuffer();
      workbook = XLSX.read(arrayBuffer, { type: 'array' });
    }
    
      const existingStudents = await getStudents();
      const existingClasses = await getClasses();
      const allNewStudents: Student[] = [];
      const newClasses: ClassInfo[] = [];

      // Xử lý từng sheet trong workbook
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1, 
          defval: '',
          raw: false 
        }) as any[][];

        if (jsonData.length < 2) continue;

        // Parse thông tin lớp từ các dòng đầu (1-4)
        const classInfo = parseClassInfo(jsonData, sheetName);
        
        // Tìm hoặc tạo class
        let classId: string;
        const existingClass = existingClasses.find(
          c => c.tenLop === classInfo.tenLop && c.thangNam === classInfo.thangNam
        );
        
        if (existingClass) {
          classId = existingClass.id;
          // Cập nhật thông tin lớp
          existingClass.giaoVien = classInfo.giaoVien;
          existingClass.siSo = classInfo.siSo;
          existingClass.thoiGianHoc = classInfo.thoiGianHoc;
          existingClass.trungTam = classInfo.trungTam;
          existingClass.updatedAt = new Date().toISOString();
        } else {
          classId = uuidv4();
          const newClass: ClassInfo = {
            id: classId,
            ...classInfo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newClasses.push(newClass);
          existingClasses.push(newClass);
        }

        // Đếm số học sinh hiện có trong lớp này để tính STT
        const studentsInClass = existingStudents.filter(s => s.classId === classId);
        let classStudentCount = studentsInClass.length;

      // Tìm dòng header (có "Họ và tên" hoặc "TT")
      let headerRowIndex = -1;
      let dataStartIndex = -1;

      for (let i = 0; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length === 0) continue;
        
        const firstCell = String(row[0] || '').trim().toLowerCase();
        const secondCell = String(row[1] || '').trim().toLowerCase();
        
        if (firstCell === 'tt' || secondCell.includes('họ và tên') || secondCell.includes('tên')) {
          headerRowIndex = i;
          // Dòng tiếp theo là sub-header (B1-B8), dòng sau đó mới là dữ liệu
          dataStartIndex = i + 2;
          break;
        }
      }

      // Nếu không tìm thấy header, thử tìm dòng có "TT" ở cột đầu
      if (headerRowIndex === -1) {
        for (let i = 0; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (row && row.length > 0) {
            const firstCell = String(row[0] || '').trim().toLowerCase();
            if (firstCell === 'tt') {
              headerRowIndex = i;
              dataStartIndex = i + 2;
              break;
            }
          }
        }
      }

      // Nếu vẫn không tìm thấy, bắt đầu từ dòng 7 (theo format chuẩn)
      if (dataStartIndex === -1) {
        dataStartIndex = 6;
      }

      // Parse dữ liệu từ sheet
      // Tìm cột index thực tế của các trường từ dòng header
      // Lưu ý: HTML có thể có cột trống (như cột C) làm lệch index
      let sttColIndex = -1;
      let hoVaTenColIndex = -1;
      let ngayVaoColIndex = -1;
      let soDienThoaiColIndex = -1;
      let ngayDongColIndex = -1;
      let kyTenColIndex = -1;

      // Tìm index của các cột từ dòng header
      // Tìm tất cả các cột có dữ liệu (bỏ qua cột trống)
      if (headerRowIndex >= 0 && headerRowIndex < jsonData.length) {
        const headerRow = jsonData[headerRowIndex];
        for (let col = 0; col < headerRow.length; col++) {
          const cell = String(headerRow[col] || '').trim().toLowerCase();
          
          // Tìm STT (thường là cột đầu tiên có "tt" hoặc "stt")
          if ((cell === 'tt' || cell === 'stt') && sttColIndex === -1) {
            sttColIndex = col;
          }
          // Tìm Họ và tên (thường là cột thứ 2, sau STT)
          else if ((cell.includes('họ và tên') || (cell.includes('tên') && !cell.includes('ký'))) && hoVaTenColIndex === -1) {
            hoVaTenColIndex = col;
          }
          // Tìm Ngày vào
          else if (cell.includes('ngày vào') && ngayVaoColIndex === -1) {
            ngayVaoColIndex = col;
          }
          // Tìm SĐT
          else if ((cell.includes('sđt') || cell.includes('số điện thoại') || cell.includes('phone')) && soDienThoaiColIndex === -1) {
            soDienThoaiColIndex = col;
          }
          // Tìm Ngày đóng
          else if (cell.includes('ngày đóng') && ngayDongColIndex === -1) {
            ngayDongColIndex = col;
          }
          // Tìm Ký tên
          else if (cell.includes('ký tên') || cell.includes('ký') && kyTenColIndex === -1) {
            kyTenColIndex = col;
          }
        }
      }

      // Nếu không tìm thấy từ header, thử tìm theo thứ tự logic
      // Dựa vào cấu trúc: TT, Họ và tên, (có thể có cột trống), Ngày vào, SĐT, Ngày đóng, Ký tên
      if (sttColIndex === -1) {
        // Tìm cột đầu tiên có số hoặc "tt"
        for (let col = 0; col < (jsonData[headerRowIndex]?.length || 0); col++) {
          const cell = String(jsonData[headerRowIndex]?.[col] || '').trim().toLowerCase();
          if (cell === 'tt' || cell === 'stt' || (!isNaN(parseInt(cell)) && parseInt(cell) > 0)) {
            sttColIndex = col;
            break;
          }
        }
        if (sttColIndex === -1) sttColIndex = 0;
      }

      if (hoVaTenColIndex === -1) {
        // Tìm cột sau STT có chứa "tên" hoặc có dữ liệu text
        for (let col = sttColIndex + 1; col < (jsonData[headerRowIndex]?.length || 0); col++) {
          const cell = String(jsonData[headerRowIndex]?.[col] || '').trim().toLowerCase();
          if (cell.includes('tên') || cell.includes('họ') || (cell.length > 0 && !cell.match(/^\d+$/))) {
            hoVaTenColIndex = col;
            break;
          }
        }
        if (hoVaTenColIndex === -1) hoVaTenColIndex = sttColIndex + 1;
      }

      // Tìm các cột còn lại theo thứ tự
      if (ngayVaoColIndex === -1) {
        for (let col = hoVaTenColIndex + 1; col < (jsonData[headerRowIndex]?.length || 0); col++) {
          const cell = String(jsonData[headerRowIndex]?.[col] || '').trim().toLowerCase();
          if (cell.includes('ngày') || cell.includes('vào')) {
            ngayVaoColIndex = col;
            break;
          }
        }
        if (ngayVaoColIndex === -1) ngayVaoColIndex = hoVaTenColIndex + 2; // Bỏ qua 1 cột trống
      }

      if (soDienThoaiColIndex === -1) {
        for (let col = ngayVaoColIndex + 1; col < (jsonData[headerRowIndex]?.length || 0); col++) {
          const cell = String(jsonData[headerRowIndex]?.[col] || '').trim().toLowerCase();
          if (cell.includes('sđt') || cell.includes('điện thoại') || cell.includes('phone')) {
            soDienThoaiColIndex = col;
            break;
          }
        }
        if (soDienThoaiColIndex === -1) soDienThoaiColIndex = ngayVaoColIndex + 1;
      }

      if (ngayDongColIndex === -1) {
        for (let col = soDienThoaiColIndex + 1; col < (jsonData[headerRowIndex]?.length || 0); col++) {
          const cell = String(jsonData[headerRowIndex]?.[col] || '').trim().toLowerCase();
          if (cell.includes('đóng') || (cell.includes('ngày') && !cell.includes('vào'))) {
            ngayDongColIndex = col;
            break;
          }
        }
        if (ngayDongColIndex === -1) ngayDongColIndex = soDienThoaiColIndex + 1;
      }

      if (kyTenColIndex === -1) {
        for (let col = ngayDongColIndex + 1; col < (jsonData[headerRowIndex]?.length || 0); col++) {
          const cell = String(jsonData[headerRowIndex]?.[col] || '').trim().toLowerCase();
          if (cell.includes('ký') || cell.includes('tên')) {
            kyTenColIndex = col;
            break;
          }
        }
        if (kyTenColIndex === -1) kyTenColIndex = ngayDongColIndex + 1;
      }

      // Debug: Log các cột index đã tìm được (có thể xóa sau)
      console.log('Column indices found:', {
        stt: sttColIndex,
        hoVaTen: hoVaTenColIndex,
        ngayVao: ngayVaoColIndex,
        soDienThoai: soDienThoaiColIndex,
        ngayDong: ngayDongColIndex,
        kyTen: kyTenColIndex,
      });

      for (let i = dataStartIndex; i < jsonData.length; i++) {
        const row = jsonData[i];
        if (!row || row.length < 2) continue;

        // Convert row thành array of strings
        const columns = row.map((cell: any) => {
          if (cell === null || cell === undefined) return '';
          return String(cell).trim();
        });

        // Lấy dữ liệu từ đúng cột index
        const sttValue = columns[sttColIndex] || '';
        const hoVaTen = columns[hoVaTenColIndex] || '';
        const ngayVao = columns[ngayVaoColIndex] || '';
        const soDienThoai = columns[soDienThoaiColIndex] || '';
        const ngayDong = columns[ngayDongColIndex] || '';
        const kyTen = columns[kyTenColIndex] || '';

        // Debug: Log dữ liệu đã parse (chỉ log 3 dòng đầu để tránh spam)
        if (i === dataStartIndex || i === dataStartIndex + 1 || i === dataStartIndex + 2) {
          console.log(`Row ${i} parsed:`, {
            stt: sttValue,
            hoVaTen,
            ngayVao,
            soDienThoai,
            ngayDong,
            kyTen,
            rawColumns: columns.slice(0, 10), // Chỉ lấy 10 cột đầu để xem
          });
        }

        // Ưu tiên lấy STT từ file Excel (cột đầu tiên)
        // Nếu không có hoặc không hợp lệ, tính STT theo lớp (bắt đầu từ 1 cho mỗi lớp)
        let stt = parseInt(sttValue);
        if (isNaN(stt) || stt <= 0) {
          // Tính STT tiếp theo trong lớp (bao gồm cả học sinh mới đã thêm)
          classStudentCount++;
          stt = classStudentCount;
        } else {
          // Nếu có STT từ file, đảm bảo nó không trùng với STT hiện có
          // Nếu STT đã tồn tại trong lớp, dùng STT tiếp theo
          const existingSttInClass = [...studentsInClass, ...allNewStudents.filter(s => s.classId === classId)]
            .map(s => s.stt);
          if (existingSttInClass.includes(stt)) {
            classStudentCount++;
            stt = classStudentCount;
          } else {
            // Cập nhật classStudentCount để đảm bảo không bị trùng
            if (stt > classStudentCount) {
              classStudentCount = stt;
            }
          }
        }

        // Bỏ qua nếu không có tên
        if (!hoVaTen) continue;

        // Bỏ qua các dòng tổng kết
        if (hoVaTen.toLowerCase().includes('tổng') || hoVaTen.includes('#REF!')) continue;

        // Điểm danh B1-B8 bắt đầu sau cột "Ký tên"
        // Tìm cột điểm danh từ dòng sub-header (headerRowIndex + 1)
        let attendanceStartCol = kyTenColIndex + 1;
        if (headerRowIndex >= 0 && headerRowIndex + 1 < jsonData.length) {
          const subHeaderRow = jsonData[headerRowIndex + 1];
          for (let col = kyTenColIndex + 1; col < subHeaderRow.length; col++) {
            const cell = String(subHeaderRow[col] || '').trim().toLowerCase();
            if (cell === 'b1' || cell.includes('điểm danh')) {
              attendanceStartCol = col;
              break;
            }
          }
        }

        // Parse điểm danh B1-B8
        const diemDanh = {
          B1: checkAttendance(columns[attendanceStartCol]),
          B2: checkAttendance(columns[attendanceStartCol + 1]),
          B3: checkAttendance(columns[attendanceStartCol + 2]),
          B4: checkAttendance(columns[attendanceStartCol + 3]),
          B5: checkAttendance(columns[attendanceStartCol + 4]),
          B6: checkAttendance(columns[attendanceStartCol + 5]),
          B7: checkAttendance(columns[attendanceStartCol + 6]),
          B8: checkAttendance(columns[attendanceStartCol + 7]),
        };

        // Tìm cột "Ghi chú"
        let ghiChuCol = attendanceStartCol + 8;
        for (let j = attendanceStartCol + 8; j < columns.length; j++) {
          if (columns[j] && columns[j].length > 0) {
            if (isNaN(parseFloat(columns[j]))) {
              ghiChuCol = j;
              break;
            }
          }
        }

        const ghiChu = columns[ghiChuCol] || '';
        
        // Tìm CK và %
        let chietKhau = 0;
        let phanTram = 0;
        for (let j = ghiChuCol + 1; j < columns.length; j++) {
          const val = parseFloat(columns[j] || '0');
          if (val > 0) {
            if (chietKhau === 0) {
              chietKhau = val;
            } else if (phanTram === 0) {
              phanTram = val;
              break;
            }
          }
        }

        const newStudent: Student = {
          id: uuidv4(),
          classId, // Gán classId cho học sinh
          stt, // Sử dụng STT đã tính toán ở trên
          hoVaTen,
          ngayVao,
          soDienThoai,
          ngayDong,
          kyTen,
          diemDanh,
          ghiChu,
          chietKhau,
          phanTram,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        allNewStudents.push(newStudent);
      }
    }

    if (allNewStudents.length === 0) {
      return NextResponse.json({ 
        error: 'Không tìm thấy dữ liệu học sinh hợp lệ trong file Excel' 
      }, { status: 400 });
    }

    // Lưu classes mới
    if (newClasses.length > 0) {
      await saveClasses(existingClasses);
    }

    // Thêm vào database
    const allStudents = [...existingStudents, ...allNewStudents];
    await saveStudents(allStudents);

    return NextResponse.json({
      message: `Đã thêm ${allNewStudents.length} học sinh từ ${workbook.SheetNames.length} sheet(s) thành công`,
      count: allNewStudents.length,
      sheetsProcessed: workbook.SheetNames.length,
      classesCreated: newClasses.length,
      classes: newClasses.map(c => ({ id: c.id, tenLop: c.tenLop, giaoVien: c.giaoVien, thangNam: c.thangNam })),
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: `Lỗi khi xử lý file Excel: ${error.message}` 
    }, { status: 500 });
  }
}

// Parse thông tin lớp từ các dòng đầu của Excel
function parseClassInfo(jsonData: any[][], sheetName: string): Omit<ClassInfo, 'id' | 'createdAt' | 'updatedAt'> {
  let tenLop = sheetName; // Mặc định dùng tên sheet
  let giaoVien = '';
  let siSo = 0;
  let thangNam = '';
  let thoiGianHoc = '';
  let trungTam = '';

  // Parse từ các dòng đầu (0-3)
  for (let i = 0; i < Math.min(4, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rowText = row.map((cell: any) => String(cell || '').trim()).join(' ').toLowerCase();

    // Tìm tháng/năm (ví dụ: "Tháng 09/2025")
    const thangMatch = rowText.match(/tháng\s*(\d{2}\/\d{4})/i);
    if (thangMatch) {
      thangNam = thangMatch[1];
    }

    // Tìm tên trung tâm
    if (rowText.includes('trung tâm') || rowText.includes('wonder')) {
      const trungTamMatch = row.find((cell: any) => {
        const text = String(cell || '').trim();
        return text.includes('TRUNG TÂM') || text.includes('WONDER');
      });
      if (trungTamMatch) {
        trungTam = String(trungTamMatch).trim();
      }
    }

    // Tìm lớp (ví dụ: "Lớp: 6A10", "Lớp:8A4", "Lớp 6A10")
    // Tìm trong toàn bộ row để lấy giá trị sau "Lớp:"
    for (let col = 0; col < row.length; col++) {
      const cell = String(row[col] || '').trim();
      const cellLower = cell.toLowerCase();
      
      // Tìm cell có chứa "Lớp:" hoặc "Lớp"
      if (cellLower.includes('lớp')) {
        // Tìm pattern "Lớp: 6A10" hoặc "Lớp:6A10"
        const lopMatch = cell.match(/lớp\s*:?\s*([a-z0-9A-Z\-_]+)/i);
        if (lopMatch && lopMatch[1]) {
          tenLop = lopMatch[1].trim().toUpperCase();
          break;
        }
        
        // Nếu không match trong cùng cell, lấy cell tiếp theo
        if (col < row.length - 1) {
          const nextCell = String(row[col + 1] || '').trim();
          if (nextCell && nextCell.length > 0 && !nextCell.toLowerCase().includes('lớp')) {
            // Lấy giá trị từ cell tiếp theo (ví dụ: "Lớp:" ở cột F, "6A10" ở cột G)
            tenLop = nextCell.trim().toUpperCase();
            break;
          }
        }
      }
    }
    
    // Fallback: Tìm bằng regex trong rowText
    if (tenLop === sheetName) {
      const lopMatch = rowText.match(/lớp\s*:?\s*([a-z0-9A-Z\-_]+)/i);
      if (lopMatch && lopMatch[1]) {
        tenLop = lopMatch[1].trim().toUpperCase();
      }
    }

    // Tìm giáo viên (ví dụ: "GIÁO VIÊN: Cô Tiên - Lý")
    if (rowText.includes('giáo viên') || rowText.includes('gv')) {
      const gvIndex = row.findIndex((cell: any) => {
        const text = String(cell || '').trim().toLowerCase();
        return text.includes('giáo viên') || text.includes('gv');
      });
      if (gvIndex >= 0 && gvIndex < row.length - 1) {
        giaoVien = String(row[gvIndex + 1] || '').trim();
      } else {
        // Tìm sau dấu ":"
        const gvMatch = rowText.match(/giáo viên\s*:?\s*([^,]+)/i);
        if (gvMatch) {
          giaoVien = gvMatch[1].trim();
        }
      }
    }

    // Tìm sĩ số (ví dụ: "Sĩ số : 35")
    const siSoMatch = rowText.match(/sĩ số\s*:?\s*(\d+)/i);
    if (siSoMatch) {
      siSo = parseInt(siSoMatch[1]) || 0;
    }

    // Tìm thời gian học
    if (rowText.includes('thời gian học')) {
      const tgIndex = row.findIndex((cell: any) => {
        const text = String(cell || '').trim().toLowerCase();
        return text.includes('thời gian học');
      });
      if (tgIndex >= 0 && tgIndex < row.length - 1) {
        thoiGianHoc = String(row[tgIndex + 1] || '').trim();
      }
    }
  }

  return {
    tenLop: tenLop || sheetName,
    giaoVien: giaoVien || '',
    siSo: siSo || 0,
    thangNam: thangNam || '',
    thoiGianHoc: thoiGianHoc || '',
    trungTam: trungTam || 'TRUNG TÂM BDVH & NGOẠI NGỮ WONDER',
  };
}

// Helper function để check attendance
function checkAttendance(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === 'x' || v === '1' || v === 'true' || v === 'có' || v === 'yes' || v === 'v';
}
