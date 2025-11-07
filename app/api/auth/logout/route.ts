import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Đăng xuất thành công' });
  clearAuthCookie(response);
  return response;
}

