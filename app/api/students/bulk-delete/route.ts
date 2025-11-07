import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getStudents, saveStudents, deleteStudentsByClassId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { studentIds } = await request.json();
    
    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json({ error: 'Danh sách ID học sinh không hợp lệ' }, { status: 400 });
    }

    const students = await getStudents();
    const filtered = students.filter(s => !studentIds.includes(s.id));
    
    await saveStudents(filtered);
    
    return NextResponse.json({ 
      message: `Đã xóa ${studentIds.length} học sinh thành công`,
      deletedCount: studentIds.length
    });
  } catch (error: any) {
    console.error('Bulk delete students error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Lỗi server khi xóa học sinh' 
    }, { status: 500 });
  }
}

