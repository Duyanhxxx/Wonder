import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getClasses, saveClasses, ClassInfo } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classes = await getClasses();
    const classInfo = classes.find(c => c.id === params.id);

    if (!classInfo) {
      return NextResponse.json({ error: 'Không tìm thấy lớp' }, { status: 404 });
    }

    return NextResponse.json({ class: classInfo });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const classes = await getClasses();
    const index = classes.findIndex(c => c.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Không tìm thấy lớp' }, { status: 404 });
    }

    classes[index] = {
      ...classes[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await saveClasses(classes);
    return NextResponse.json({ class: classes[index] });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classes = await getClasses();
    const filtered = classes.filter(c => c.id !== params.id);

    if (filtered.length === classes.length) {
      return NextResponse.json({ error: 'Không tìm thấy lớp' }, { status: 404 });
    }

    // Xóa tất cả học sinh trong lớp
    const { getStudents, saveStudents } = await import('@/lib/db');
    const students = await getStudents();
    const filteredStudents = students.filter(s => s.classId !== params.id);
    await saveStudents(filteredStudents);

    await saveClasses(filtered);
    return NextResponse.json({ message: 'Đã xóa lớp thành công' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

