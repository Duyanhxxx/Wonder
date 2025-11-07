// API endpoint để khởi tạo database (chạy một lần sau khi setup Vercel Postgres)
import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db-postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await initDatabase();
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Database initialization failed: ${error.message}` },
      { status: 500 }
    );
  }
}

