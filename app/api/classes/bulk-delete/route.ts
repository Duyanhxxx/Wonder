import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getClasses, deleteClass, deleteStudentsByClassId } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { classIds } = await request.json();
    
    if (!Array.isArray(classIds) || classIds.length === 0) {
      return NextResponse.json({ error: 'Danh sách ID lớp không hợp lệ' }, { status: 400 });
    }

    // Xóa tất cả học sinh trong các lớp trước
    for (const classId of classIds) {
      await deleteStudentsByClassId(classId);
    }

    // Xóa các lớp
    for (const classId of classIds) {
      await deleteClass(classId);
    }
    
    return NextResponse.json({ 
      message: `Đã xóa ${classIds.length} lớp thành công`,
      deletedCount: classIds.length
    });
  } catch (error: any) {
    console.error('Bulk delete classes error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Lỗi server khi xóa lớp' 
    }, { status: 500 });
  }
}

