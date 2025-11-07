import { NextRequest, NextResponse } from 'next/server';
import { getStudents, saveStudents } from '@/lib/db';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const students = await getStudents();
    const student = students.find(s => s.id === params.id);

    if (!student) {
      return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 });
    }

    return NextResponse.json({ student });
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
    const students = await getStudents();
    const index = students.findIndex(s => s.id === params.id);

    if (index === -1) {
      return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 });
    }

    students[index] = {
      ...students[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    await saveStudents(students);
    return NextResponse.json({ student: students[index] });
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

    // Use Postgres delete if available
    if (process.env.POSTGRES_URL) {
      try {
        const { deleteStudentPostgres } = await import('@/lib/db-postgres');
        await deleteStudentPostgres(params.id);
        
        // Update STT for remaining students
        const students = await getStudents();
        const updated = students.map((s, index) => ({ ...s, stt: index + 1 }));
        await saveStudents(updated);
        
        return NextResponse.json({ message: 'Xóa thành công' });
      } catch (error) {
        console.error('Postgres delete error:', error);
      }
    }

    const students = await getStudents();
    const filtered = students.filter(s => s.id !== params.id);

    if (students.length === filtered.length) {
      return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 });
    }

    // Update STT for remaining students
    filtered.forEach((student, index) => {
      student.stt = index + 1;
    });

    await saveStudents(filtered);
    return NextResponse.json({ message: 'Xóa thành công' });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

