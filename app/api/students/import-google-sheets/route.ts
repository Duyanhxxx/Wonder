import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getStudents, saveStudents, Student } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { url, gid, importAll } = await request.json();

    if (!url) {
      return NextResponse.json({ error: 'Vui lòng cung cấp URL Google Sheets' }, { status: 400 });
    }

    // Extract sheet ID from URL
    let sheetId: string | null = null;
    if (url.includes('/spreadsheets/d/')) {
      const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (sheetIdMatch) {
        sheetId = sheetIdMatch[1];
      }
    }

    if (!sheetId) {
      return NextResponse.json({ error: 'URL Google Sheets không hợp lệ' }, { status: 400 });
    }

    const existingStudents = await getStudents();

    // Nếu importAll = true, import từ tất cả sheets (thử từ gid 0 đến 200)
    if (importAll) {
      return await importAllSheets(sheetId, existingStudents);
    }

    // Import từ sheet cụ thể (theo gid hoặc từ URL)
    let targetGid = gid;
    if (!targetGid) {
      // Extract gid from URL if present
      const gidMatch = url.match(/[#&]gid=(\d+)/);
      if (gidMatch) {
        targetGid = gidMatch[1];
      } else {
        targetGid = '0'; // Default: sheet đầu tiên
      }
    }

    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${targetGid}`;
    return await importSingleSheet(csvUrl, existingStudents);
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: `Lỗi khi import từ Google Sheets: ${error.message}` },
      { status: 500 }
    );
  }
}

// Import từ tất cả sheets (thử từ gid 0 đến 200)
async function importAllSheets(sheetId: string, existingStudents: Student[]) {
  const allNewStudents: Student[] = [];
  const results: { gid: string; count: number; success: boolean; error?: string }[] = [];
  let totalImported = 0;
  let sheetsFound = 0;
  let sheetsWithData = 0;

  console.log(`Bắt đầu import từ tất cả sheets, sheetId: ${sheetId}`);

  // Thử import từ gid 0 đến 200 (đủ cho 100+ sheets)
  for (let gid = 0; gid <= 200; gid++) {
    try {
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
      
      // Thêm timeout cho mỗi request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per sheet
      
      const response = await fetch(csvUrl, {
        signal: controller,
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        // Sheet không tồn tại hoặc không thể truy cập, bỏ qua
        if (response.status === 403 || response.status === 404) {
          // Sheet không tồn tại hoặc không có quyền
          continue;
        }
        // Lỗi khác, log để debug
        console.log(`Sheet gid=${gid}: HTTP ${response.status}`);
        continue;
      }

      const text = await response.text();
      if (!text || text.trim().length < 10) {
        // Sheet rỗng, bỏ qua
        continue;
      }

      sheetsFound++;
      const result = await parseCSVData(text, existingStudents, allNewStudents);
      
      if (result.count > 0) {
        sheetsWithData++;
        results.push({ gid: gid.toString(), count: result.count, success: true });
        totalImported += result.count;
        // Cập nhật existingStudents để tránh trùng STT
        existingStudents.push(...result.students);
        console.log(`Sheet gid=${gid}: Import ${result.count} học sinh thành công`);
      }
    } catch (error: any) {
      // Lỗi khi import sheet này, tiếp tục với sheet khác
      if (error.name === 'AbortError') {
        console.log(`Sheet gid=${gid}: Timeout`);
      } else {
        console.log(`Sheet gid=${gid}: Lỗi - ${error.message}`);
      }
      // Không thêm vào results để tránh spam
    }
  }

  console.log(`Kết thúc import: Tìm thấy ${sheetsFound} sheets, ${sheetsWithData} sheets có dữ liệu, tổng ${totalImported} học sinh`);

  if (allNewStudents.length === 0) {
    let errorMsg = 'Không tìm thấy dữ liệu học sinh hợp lệ trong bất kỳ sheet nào.';
    if (sheetsFound === 0) {
      errorMsg += ' Có thể sheet chưa được Publish to web.';
      errorMsg += ' Vui lòng: File → Publish to web → Chọn "Entire document" và format "CSV" → Publish.';
      errorMsg += ' (Lưu ý: Chỉ share "Anyone with the link can view" là CHƯA ĐỦ!)';
    } else if (sheetsWithData === 0) {
      errorMsg += ` Đã tìm thấy ${sheetsFound} sheet(s) nhưng không có dữ liệu học sinh hợp lệ.`;
    }
    
    return NextResponse.json({
      error: errorMsg,
      sheetsFound,
      sheetsWithData,
      results: results.slice(0, 10), // Chỉ trả về 10 kết quả đầu để tránh response quá lớn
    }, { status: 400 });
  }

  // Lưu tất cả học sinh đã import
  const allStudents = await getStudents();
  const finalStudents = [...allStudents, ...allNewStudents];
  await saveStudents(finalStudents);

  const successfulResults = results.filter(r => r.success);
  
  return NextResponse.json({
    message: `Đã import ${totalImported} học sinh từ ${successfulResults.length} sheet(s) thành công`,
    count: totalImported,
    sheetsImported: successfulResults.length,
    sheetsFound,
    results: successfulResults.slice(0, 20), // Chỉ trả về 20 kết quả đầu
  });
}

// Import từ một sheet cụ thể
async function importSingleSheet(csvUrl: string, existingStudents: Student[]) {
  try {
    console.log(`Import từ sheet: ${csvUrl}`);
    
    // Fetch CSV data với timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch(csvUrl, {
      signal: controller,
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMsg = 'Không thể truy cập Google Sheets.';
      if (response.status === 403) {
        errorMsg += ' Sheet chưa được Publish to web. Vui lòng: File → Publish to web → Chọn "Entire document" và format "CSV" → Publish.';
        errorMsg += ' (Lưu ý: Chỉ share "Anyone with the link can view" là CHƯA ĐỦ, cần Publish to web!)';
      } else if (response.status === 404) {
        errorMsg += ' Sheet không tồn tại hoặc URL không đúng.';
      } else {
        errorMsg += ` Lỗi HTTP ${response.status}.`;
      }
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 400 }
      );
    }

    const text = await response.text();
    const newStudents: Student[] = [];
    
    const result = await parseCSVData(text, existingStudents, newStudents);

    if (result.count === 0) {
      return NextResponse.json({ error: 'Không tìm thấy dữ liệu học sinh hợp lệ trong Google Sheets' }, { status: 400 });
    }

    // Thêm vào database
    const allStudents = [...existingStudents, ...newStudents];
    await saveStudents(allStudents);

    return NextResponse.json({
      message: `Đã import ${result.count} học sinh từ Google Sheets thành công`,
      count: result.count,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: `Lỗi khi import từ Google Sheets: ${error.message}` },
      { status: 500 }
    );
  }
}

// Parse CSV data và trả về danh sách học sinh
async function parseCSVData(
  text: string,
  existingStudents: Student[],
  newStudents: Student[]
): Promise<{ count: number; students: Student[] }> {
  const lines = text.split('\n').filter(line => line.trim());

  if (lines.length < 2) {
    return { count: 0, students: [] };
  }

  let headerRowIndex = -1;
  let dataStartIndex = -1;

  // Tìm dòng header (có "Họ và tên" hoặc "TT")
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('họ và tên') || (line.includes('tt') && line.includes('tên'))) {
      headerRowIndex = i;
      // Dòng tiếp theo là sub-header (B1-B8), dòng sau đó mới là dữ liệu
      dataStartIndex = i + 2;
      break;
    }
  }

  // Nếu không tìm thấy header, thử tìm dòng có "TT" ở đầu
  if (headerRowIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);
      if (columns.length > 0 && columns[0].trim().toLowerCase() === 'tt') {
        headerRowIndex = i;
        dataStartIndex = i + 2; // Bỏ qua sub-header
        break;
      }
    }
  }

  // Nếu vẫn không tìm thấy, bắt đầu từ dòng 7 (theo format chuẩn)
  if (dataStartIndex === -1) {
    dataStartIndex = 6; // Dòng 7 (index 6) là dòng đầu tiên có dữ liệu
  }

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith('Tổng') || line.includes('#REF!')) continue;

    const columns = parseCSVLine(line);

    if (columns.length < 2) continue;

    // Parse theo cấu trúc: TT, Họ và tên, Ngày vào, SĐT, Ngày đóng, Ký tên, (Điểm danh header), B1-B8, Ghi chú, CK, 12, %
    const stt = parseInt(columns[0]) || existingStudents.length + newStudents.length + 1;
    const hoVaTen = columns[1]?.trim() || '';
    const ngayVao = columns[2]?.trim() || '';
    const soDienThoai = columns[3]?.trim() || '';
    const ngayDong = columns[4]?.trim() || '';
    const kyTen = columns[5]?.trim() || '';

    if (!hoVaTen) continue;

    // Điểm danh B1-B8 bắt đầu từ cột 6 (sau "Ký tên")
    let attendanceStartCol = 6;
    if (columns[6]?.trim().toLowerCase() === 'b1' || columns[6]?.trim().toLowerCase() === 'điểm danh') {
      attendanceStartCol = 7;
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
      if (columns[j]?.trim() && columns[j].trim().length > 0) {
        if (isNaN(parseFloat(columns[j].trim()))) {
          ghiChuCol = j;
          break;
        }
      }
    }

    const ghiChu = columns[ghiChuCol]?.trim() || '';
    
    // Tìm CK và %
    let chietKhau = 0;
    let phanTram = 0;
    for (let j = ghiChuCol + 1; j < columns.length; j++) {
      const val = parseFloat(columns[j]?.trim() || '0');
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
      stt: existingStudents.length + newStudents.length + 1,
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

  return { count: newStudents.length, students: newStudents };
}

// Helper function để parse CSV line
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

// Helper function để check attendance
function checkAttendance(value: string | undefined): boolean {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  return v === 'x' || v === '1' || v === 'true' || v === 'có' || v === 'yes';
}
