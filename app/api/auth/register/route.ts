import { NextRequest, NextResponse } from 'next/server';
import { getUsers, saveUsers, User } from '@/lib/db';
import { hashPassword, generateToken, setAuthCookie } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    const users = await getUsers();
    
    if (users.find(u => u.email === email)) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const newUser: User = {
      id: uuidv4(),
      email,
      password: hashedPassword,
      name,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    await saveUsers(users);

    const token = generateToken({ id: newUser.id, email: newUser.email });
    const response = NextResponse.json(
      { message: 'Đăng ký thành công', user: { id: newUser.id, email: newUser.email, name: newUser.name } },
      { status: 201 }
    );
    
    setAuthCookie(response, token);
    return response;
  } catch (error: any) {
    console.error('Register error:', error);
    
    // Nếu lỗi liên quan đến database chưa được khởi tạo
    if (error?.message?.includes('does not exist') || error?.code === '42P01') {
      return NextResponse.json(
        { 
          error: 'Database chưa được khởi tạo',
          hint: 'Vui lòng truy cập /api/init-db để khởi tạo database trước khi đăng ký',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Lỗi server',
        message: error?.message || 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

