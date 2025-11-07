import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getStudents, saveStudents, getClasses, saveClasses, Student, ClassInfo } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

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
      // CSV có thể chứa nhiều lớp, mỗi lớp được phân cách bởi dòng "=== ... ==="
      // Cần parse thủ công để tách thành các sections
      const text = await file.text();
      const lines = text.split('\n');
      
      // Tách CSV thành các sections (mỗi section là một lớp)
      const sections: { header: string; data: string[][] }[] = [];
      let currentSection: { header: string; data: string[][] } | null = null;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Kiểm tra xem có phải dòng phân cách lớp không (format: "=== ... ===")
        const sectionMatch = line.match(/^"=== (.+?) ==="$/);
        if (sectionMatch) {
          // Lưu section cũ nếu có
          if (currentSection) {
            sections.push(currentSection);
          }
          // Bắt đầu section mới
          currentSection = {
            header: sectionMatch[1],
            data: []
          };
        } else if (currentSection) {
          // Parse dòng CSV (xử lý quotes và commas)
          const row = parseCSVLine(line);
          if (row.length > 0) {
            currentSection.data.push(row);
          }
        }
      }
      
      // Lưu section cuối cùng
      if (currentSection) {
        sections.push(currentSection);
      }
      
      // Nếu không tìm thấy sections (không có dòng "==="), xử lý như CSV thông thường
      if (sections.length === 0) {
        try {
          workbook = XLSX.read(text, { 
            type: 'string',
            FS: ',',
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
      } else {
        // Xử lý từng section như một lớp riêng biệt
        const existingStudents = await getStudents();
        const existingClasses = await getClasses();
        const allNewStudents: Student[] = [];
        const newClasses: ClassInfo[] = [];
        
        for (const section of sections) {
          // Bỏ qua section mẫu (có "MẪU" trong header)
          if (section.header.includes('MẪU') || section.header === '.' || !section.header.trim()) {
            continue;
          }
          
          if (section.data.length < 2) continue;
          
          // Parse thông tin lớp từ các dòng đầu
          const classInfo = parseClassInfo(section.data, section.header);
          
          // Lấy thangNam từ classInfo để dùng cho tất cả học sinh trong lớp này
          const classThangNam = classInfo.thangNam;
          
          // Luôn tạo lớp mới (không gộp) - mỗi sheet/section là một lớp riêng
          // Điều này cho phép có nhiều lớp cùng tên nhưng khác tháng/năm hoặc khác sheet
          const classId = uuidv4();
          const newClass: ClassInfo = {
            id: classId,
            ...classInfo,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          newClasses.push(newClass);
          existingClasses.push(newClass);
          
          // Đếm số học sinh hiện có trong lớp này
          const studentsInClass = existingStudents.filter(s => s.classId === classId);
          let classStudentCount = studentsInClass.length;
          
          // Parse students từ section này
          const sectionStudents = parseStudentsFromData(section.data, classId, studentsInClass, allNewStudents, classStudentCount, classThangNam);
          allNewStudents.push(...sectionStudents);
          
          // Cập nhật sĩ số dựa trên số học sinh thực tế được import
          const actualStudentCount = sectionStudents.length;
          if (actualStudentCount > 0) {
            // Cập nhật sĩ số cho lớp (dùng số học sinh thực tế hoặc sĩ số từ file, lấy số lớn hơn)
            const newClassIndex = newClasses.findIndex(c => c.id === classId);
            if (newClassIndex >= 0) {
              newClasses[newClassIndex].siSo = Math.max(newClasses[newClassIndex].siSo, actualStudentCount);
            }
          }
          
          // Cập nhật classStudentCount cho các section tiếp theo
          classStudentCount += sectionStudents.length;
        }
        
        if (allNewStudents.length === 0) {
          return NextResponse.json({ 
            error: 'Không tìm thấy dữ liệu học sinh hợp lệ trong file CSV' 
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
          message: `Đã thêm ${allNewStudents.length} học sinh từ ${sections.length} lớp thành công`,
          count: allNewStudents.length,
          sheetsProcessed: sections.length,
          classesCreated: newClasses.length,
          classes: newClasses.map(c => ({ id: c.id, tenLop: c.tenLop, giaoVien: c.giaoVien, thangNam: c.thangNam })),
        });
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
        
        // Lấy thangNam từ classInfo để dùng cho tất cả học sinh trong lớp này
        const classThangNam = classInfo.thangNam;
        
        // Luôn tạo lớp mới (không gộp) - mỗi sheet là một lớp riêng
        // Điều này cho phép có nhiều lớp cùng tên nhưng khác tháng/năm hoặc khác sheet
        const classId = uuidv4();
        const newClass: ClassInfo = {
          id: classId,
          ...classInfo,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        newClasses.push(newClass);
        existingClasses.push(newClass);

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

  // Nếu sheetName có format "6A9-Toán-C. Phượng" hoặc "K8A9-A.Văn-C. Lê", parse từ đó
  // Format: "Lớp-Môn-Giáo viên" hoặc "Lớp-Môn-G.Viên" hoặc "K8A9-A.Văn-C. Lê"
  // Có thể có 2 hoặc 3 phần được phân cách bởi dấu "-"
  const headerParts = sheetName.split('-').map(p => p.trim());
  if (headerParts.length >= 1) {
    // Phần đầu tiên là tên lớp (có thể là "6A9", "K8A9", "8A9", etc.)
    tenLop = headerParts[0].toUpperCase();
    // Phần cuối cùng thường là giáo viên (có thể có "C." hoặc "Cô" hoặc "Thầy")
    if (headerParts.length >= 3) {
      giaoVien = headerParts.slice(2).join('-').trim();
    } else if (headerParts.length === 2) {
      // Nếu chỉ có 2 phần, phần thứ 2 có thể là giáo viên hoặc môn
      // Ưu tiên parse từ dữ liệu thực tế trong file
    }
  }

  // Parse từ các dòng đầu (0-10 để tìm thông tin đầy đủ)
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    const row = jsonData[i];
    if (!row || row.length === 0) continue;

    const rowText = row.map((cell: any) => String(cell || '').trim()).join(' ').toLowerCase();

    // Tìm tháng/năm từ header (ví dụ: "Tháng 10/2025" hoặc "01/10/2025" trong cell B1)
    // Tìm trong từng cell để chính xác hơn
    for (let col = 0; col < row.length; col++) {
      const cell = String(row[col] || '').trim();
      
      // Tìm pattern "Tháng 10/2025" hoặc "Tháng10/2025" - parse thành "01/10/2025"
      const thangMatch = cell.match(/tháng\s*(\d{1,2})\/(\d{4})/i);
      if (thangMatch) {
        const month = thangMatch[1].padStart(2, '0');
        const year = thangMatch[2];
        thangNam = `01/${month}/${year}`; // Format: dd/mm/yyyy (ngày đầu tháng)
        break;
      }
      
      // Tìm format đầy đủ "01/10/2025" hoặc "1/10/2025" ở các dòng đầu
      if (i < 3) {
        const dateMatch = cell.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dateMatch) {
          const day = dateMatch[1].padStart(2, '0');
          const month = dateMatch[2].padStart(2, '0');
          const year = dateMatch[3];
          thangNam = `${day}/${month}/${year}`; // Format: dd/mm/yyyy
          break;
        }
      }
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

    // Tìm lớp (ví dụ: "Lớp: 6A10", "Lớp:8A4", "Lớp 6A10", "Lớp: 8A9")
    // Lưu ý: Header có thể là "K8A9" nhưng trong file lại là "Lớp: 8A9" (không có K)
    // Ưu tiên lấy từ file, nếu không có thì dùng từ header
    for (let col = 0; col < row.length; col++) {
      const cell = String(row[col] || '').trim();
      const cellLower = cell.toLowerCase();
      
      // Tìm cell có chứa "Lớp:" hoặc "Lớp"
      if (cellLower.includes('lớp')) {
        // Tìm pattern "Lớp: 6A10" hoặc "Lớp:6A10" hoặc "Lớp: 8A9"
        const lopMatch = cell.match(/lớp\s*:?\s*([a-z0-9A-Z\-_]+)/i);
        if (lopMatch && lopMatch[1]) {
          const foundLop = lopMatch[1].trim().toUpperCase();
          // Nếu header có "K" (ví dụ: "K8A9") nhưng file có "8A9", giữ nguyên "K8A9"
          // Nếu header không có "K" nhưng file có, dùng từ file
          if (tenLop.startsWith('K') && !foundLop.startsWith('K')) {
            // Giữ nguyên tenLop từ header (có K)
          } else {
            tenLop = foundLop;
          }
          break;
        }
        
        // Nếu không match trong cùng cell, lấy cell tiếp theo
        if (col < row.length - 1) {
          const nextCell = String(row[col + 1] || '').trim();
          if (nextCell && nextCell.length > 0 && !nextCell.toLowerCase().includes('lớp')) {
            const foundLop = nextCell.trim().toUpperCase();
            // Tương tự logic trên
            if (tenLop.startsWith('K') && !foundLop.startsWith('K')) {
              // Giữ nguyên tenLop từ header (có K)
            } else {
              tenLop = foundLop;
            }
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

// Helper function để parse một dòng CSV (xử lý quotes và commas)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current);
  
  return result;
}

// Helper function để parse students từ data array
function parseStudentsFromData(
  jsonData: any[][],
  classId: string,
  studentsInClass: Student[],
  allNewStudents: Student[],
  classStudentCount: number,
  classThangNam: string = ''
): Student[] {
  const newStudents: Student[] = [];
  let currentClassStudentCount = classStudentCount;
  
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
      dataStartIndex = i + 2;
      break;
    }
  }

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

  if (dataStartIndex === -1) {
    dataStartIndex = 6;
  }

  // Tìm cột index
  let sttColIndex = -1;
  let hoVaTenColIndex = -1;
  let ngayVaoColIndex = -1;
  let soDienThoaiColIndex = -1;
  let ngayDongColIndex = -1;
  let kyTenColIndex = -1;

  if (headerRowIndex >= 0 && headerRowIndex < jsonData.length) {
    const headerRow = jsonData[headerRowIndex];
    for (let col = 0; col < headerRow.length; col++) {
      const cell = String(headerRow[col] || '').trim().toLowerCase();
      
      if ((cell === 'tt' || cell === 'stt') && sttColIndex === -1) {
        sttColIndex = col;
      } else if ((cell.includes('họ và tên') || (cell.includes('tên') && !cell.includes('ký'))) && hoVaTenColIndex === -1) {
        hoVaTenColIndex = col;
      } else if (cell.includes('ngày vào') && ngayVaoColIndex === -1) {
        ngayVaoColIndex = col;
      } else if ((cell.includes('sđt') || cell.includes('số điện thoại') || cell.includes('phone')) && soDienThoaiColIndex === -1) {
        soDienThoaiColIndex = col;
      } else if (cell.includes('ngày đóng') && ngayDongColIndex === -1) {
        ngayDongColIndex = col;
      } else if (cell.includes('ký tên') || cell.includes('ký') && kyTenColIndex === -1) {
        kyTenColIndex = col;
      }
    }
  }

  // Fallback logic
  if (sttColIndex === -1) sttColIndex = 0;
  if (hoVaTenColIndex === -1) hoVaTenColIndex = sttColIndex + 1;
  if (ngayVaoColIndex === -1) ngayVaoColIndex = hoVaTenColIndex + 2;
  if (soDienThoaiColIndex === -1) soDienThoaiColIndex = ngayVaoColIndex + 1;
  if (ngayDongColIndex === -1) ngayDongColIndex = soDienThoaiColIndex + 1;
  if (kyTenColIndex === -1) kyTenColIndex = ngayDongColIndex + 1;

  // Đếm số học sinh thực tế (chỉ đếm những dòng có tên)
  // STT sẽ bắt đầu từ số học sinh hiện có trong lớp + 1
  let actualStudentIndex = classStudentCount; // Bắt đầu từ số học sinh hiện có
  
  for (let i = dataStartIndex; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || row.length < 2) continue;

    const columns = row.map((cell: any) => {
      if (cell === null || cell === undefined) return '';
      return String(cell).trim();
    });

    const sttValue = columns[sttColIndex] || '';
    const hoVaTen = columns[hoVaTenColIndex] || '';
    const ngayVao = columns[ngayVaoColIndex] || '';
    const soDienThoai = columns[soDienThoaiColIndex] || '';
    const ngayDong = columns[ngayDongColIndex] || '';
    const kyTen = columns[kyTenColIndex] || '';
    
    // Dùng thangNam từ classInfo (đã parse từ header "Tháng 10/2025")
    // Nếu không có, thử parse từ ngayDong như fallback
    let thangNam = classThangNam || '';
    if (!thangNam && ngayDong) {
      const dateMatch = ngayDong.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (dateMatch) {
        const month = dateMatch[2];
        const year = dateMatch[3];
        thangNam = `${month}/${year}`;
      }
    }

    // BỎ QUA các dòng trống (không có tên)
    // Điều này xử lý trường hợp có STT tới 44 nhưng chỉ có 27 học sinh
    if (!hoVaTen || hoVaTen.trim() === '') {
      continue; // Bỏ qua dòng trống
    }
    
    // Bỏ qua các dòng tổng kết
    if (hoVaTen.toLowerCase().includes('tổng') || hoVaTen.includes('#REF!')) {
      continue;
    }
    
    // Dừng khi gặp dòng "Tổng thu học phí" hoặc các dòng tổng kết khác
    if (hoVaTen.toLowerCase().includes('tổng thu') || hoVaTen.toLowerCase().includes('tổng tiền')) {
      break;
    }

    // Tính STT dựa trên số học sinh thực tế (bắt đầu từ 1)
    actualStudentIndex++;
    const stt = actualStudentIndex; // Dùng index thực tế làm STT

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
      classId,
      stt,
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

    newStudents.push(newStudent);
  }
  
  return newStudents;
}

// Helper function để check attendance
function checkAttendance(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === 'x' || v === '1' || v === 'true' || v === 'có' || v === 'yes' || v === 'v';
}
