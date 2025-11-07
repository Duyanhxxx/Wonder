import { NextRequest, NextResponse } from 'next/server';
import { getStudents, saveStudents, Student } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    const students = await getStudents();
    let filtered = students;
    
    if (classId) {
      filtered = filtered.filter(s => s.classId === classId);
    }
    
    return NextResponse.json({ students: filtered });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const students = await getStudents();
    
    // Lấy classId đầu tiên nếu không có classId được cung cấp
    let classId = data.classId;
    if (!classId) {
      const { getClasses } = await import('@/lib/db');
      const classes = await getClasses();
      if (classes.length > 0) {
        classId = classes[0].id; // Mặc định dùng lớp đầu tiên
      } else {
        classId = ''; // Tạo học sinh không có lớp
      }
    }

    // Tính STT theo lớp (bắt đầu từ 1 cho mỗi lớp)
    const studentsInClass = students.filter(s => s.classId === classId);
    const maxSttInClass = studentsInClass.length > 0 
      ? Math.max(...studentsInClass.map(s => s.stt))
      : 0;
    const newStt = maxSttInClass + 1;

    const newStudent: Student = {
      id: uuidv4(),
      classId: classId || '',
      stt: newStt,
      hoVaTen: data.hoVaTen || '',
      ngayVao: data.ngayVao || '',
      soDienThoai: data.soDienThoai || '',
      ngayDong: data.ngayDong || '',
      kyTen: data.kyTen || '',
      diemDanh: {
        B1: data.diemDanh?.B1 || false,
        B2: data.diemDanh?.B2 || false,
        B3: data.diemDanh?.B3 || false,
        B4: data.diemDanh?.B4 || false,
        B5: data.diemDanh?.B5 || false,
        B6: data.diemDanh?.B6 || false,
        B7: data.diemDanh?.B7 || false,
        B8: data.diemDanh?.B8 || false,
      },
      ghiChu: data.ghiChu || '',
      chietKhau: data.chietKhau || 0,
      phanTram: data.phanTram || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    students.push(newStudent);
    await saveStudents(students);

    return NextResponse.json({ student: newStudent }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

