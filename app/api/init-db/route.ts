// API endpoint để khởi tạo database (chạy một lần sau khi setup Vercel Postgres)
import { NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db-postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Kiểm tra POSTGRES_URL hoặc POSTGRES_URL_NON_POOLING
    const postgresUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    if (!postgresUrl) {
      return NextResponse.json(
        { 
          error: 'POSTGRES_URL or POSTGRES_URL_NON_POOLING environment variable is not set',
          hint: 'Vui lòng kiểm tra Environment Variables trong Vercel Dashboard. Đảm bảo đã thêm POSTGRES_URL hoặc POSTGRES_URL_NON_POOLING từ Neon.'
        },
        { status: 500 }
      );
    }

    console.log('Initializing database...');
    console.log('Using POSTGRES_URL_NON_POOLING:', !!process.env.POSTGRES_URL_NON_POOLING);
    console.log('Using POSTGRES_URL:', !!process.env.POSTGRES_URL);
    console.log('Connection string (first 50 chars):', postgresUrl.substring(0, 50) + '...');
    console.log('Is Neon:', postgresUrl.includes('neon.tech'));

    // Thêm timeout cho database initialization
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database initialization timeout after 30 seconds')), 30000);
    });

    const initPromise = initDatabase();
    await Promise.race([initPromise, timeoutPromise]);

    return NextResponse.json({ 
      message: 'Database initialized successfully',
      tables: ['users', 'classes', 'students']
    });
  } catch (error: any) {
    console.error('Database initialization error:', error);
    
    let errorMessage = error.message || 'Unknown error';
    let hint = '';

    if (error.message?.includes('timeout')) {
      hint = 'Database connection timeout. Kiểm tra connection string và đảm bảo database đang hoạt động.';
    } else if (error.message?.includes('POSTGRES_URL')) {
      hint = 'Vui lòng thêm POSTGRES_URL vào Environment Variables trong Vercel Dashboard.';
    } else if (error.message?.includes('connection')) {
      hint = 'Không thể kết nối đến database. Kiểm tra connection string và network.';
    } else {
      hint = 'Kiểm tra logs trong Vercel Dashboard để xem chi tiết lỗi.';
    }

    return NextResponse.json(
      { 
        error: `Database initialization failed: ${errorMessage}`,
        hint,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

