// Test route để kiểm tra database connection
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const postgresUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
    
    if (!postgresUrl) {
      return NextResponse.json({
        error: 'No POSTGRES_URL found',
        hasPostgresUrl: false,
        hasNonPooling: !!process.env.POSTGRES_URL_NON_POOLING,
        hasPooling: !!process.env.POSTGRES_URL,
      });
    }

    const isNeon = postgresUrl.includes('neon.tech');
    
    // Test connection
    try {
      if (isNeon) {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(postgresUrl);
        
        // Test với query đơn giản
        const result = await sql`SELECT 1 as test`;
        
        return NextResponse.json({
          success: true,
          message: 'Database connection successful',
          isNeon: true,
          testResult: result,
          connectionStringPreview: postgresUrl.substring(0, 50) + '...',
        });
      } else {
        const { sql } = await import('@vercel/postgres');
        const result = await sql`SELECT 1 as test`;
        
        return NextResponse.json({
          success: true,
          message: 'Database connection successful',
          isNeon: false,
          testResult: result,
        });
      }
    } catch (connError: any) {
      return NextResponse.json({
        error: 'Connection failed',
        message: connError?.message,
        stack: process.env.NODE_ENV === 'development' ? connError?.stack : undefined,
        isNeon,
        connectionStringPreview: postgresUrl.substring(0, 50) + '...',
      }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({
      error: 'Test failed',
      message: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    }, { status: 500 });
  }
}

