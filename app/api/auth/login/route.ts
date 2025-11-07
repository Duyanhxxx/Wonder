import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/db';
import { verifyPassword, generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    const token = generateToken({ id: user.id, email: user.email });
    const response = NextResponse.json(
      { message: 'Đăng nhập thành công', user: { id: user.id, email: user.email, name: user.name } },
      { status: 200 }
    );
    
    setAuthCookie(response, token);
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Lỗi server' },
      { status: 500 }
    );
  }
}

