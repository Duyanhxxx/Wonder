import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { getClasses, saveClasses, ClassInfo } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const classes = await getClasses();
    return NextResponse.json({ classes });
  } catch (error: any) {
    console.error('Get classes error:', error);
    return NextResponse.json(
      { 
        error: 'Lỗi server',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        hint: 'Có thể database chưa được khởi tạo. Vui lòng truy cập /api/init-db'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const classes = await getClasses();
    
    const newClass: ClassInfo = {
      id: uuidv4(),
      tenLop: data.tenLop || '',
      giaoVien: data.giaoVien || '',
      siSo: data.siSo || 0,
      thangNam: data.thangNam || '',
      thoiGianHoc: data.thoiGianHoc || '',
      trungTam: data.trungTam || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    classes.push(newClass);
    await saveClasses(classes);

    return NextResponse.json({ class: newClass }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi server' }, { status: 500 });
  }
}

