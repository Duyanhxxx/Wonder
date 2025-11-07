// Database adapter cho Vercel Postgres / Neon
// Hỗ trợ cả @vercel/postgres và Neon (qua connection string)

import { User, Student, ClassInfo } from './db';

// Dynamic import để tránh lỗi khi package chưa được cài đặt
async function getSql() {
  // Ưu tiên dùng POSTGRES_URL_NON_POOLING cho Neon (tốt hơn cho serverless)
  // Nếu không có thì dùng POSTGRES_URL
  let postgresUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  
  if (!postgresUrl) {
    throw new Error('POSTGRES_URL or POSTGRES_URL_NON_POOLING environment variable is not set');
  }

  // Loại bỏ channel_binding=require vì Neon serverless không hỗ trợ
  // và có thể gây lỗi connection
  postgresUrl = postgresUrl.replace(/[&?]channel_binding=require/g, '');
  
  // Đảm bảo có sslmode=require cho Neon
  if (postgresUrl.includes('neon.tech') && !postgresUrl.includes('sslmode=')) {
    postgresUrl += (postgresUrl.includes('?') ? '&' : '?') + 'sslmode=require';
  }

  // Kiểm tra xem có dùng Neon không (Neon connection string thường có neon.tech hoặc aws.neon.tech)
  const isNeon = postgresUrl.includes('neon.tech') || postgresUrl.includes('@neon.tech');
  
  if (isNeon) {
    // Dùng Neon
    try {
      const { neon } = await import('@neondatabase/serverless');
      console.log('Using Neon database');
      console.log('Connection string (first 50 chars):', postgresUrl.substring(0, 50) + '...');
      const sql = neon(postgresUrl);
      
      // Neon serverless hỗ trợ template literals trực tiếp
      // Wrap để tương thích với @vercel/postgres API
      // Tạo một function wrapper đơn giản
      const wrappedSql = ((strings: TemplateStringsArray, ...values: any[]) => {
        // Kiểm tra và filter undefined values
        const cleanValues = values.map(v => {
          if (v === undefined) {
            console.warn('Undefined value detected in query, replacing with null');
            return null;
          }
          return v;
        });
        
        // Neon hỗ trợ template literals trực tiếp
        return sql(strings, ...cleanValues);
      }) as any;
      
      // Trả về object với method giống Vercel Postgres
      return wrappedSql;
    } catch (neonError: any) {
      console.error('Neon initialization error:', neonError);
      throw new Error(`Failed to initialize Neon database: ${neonError?.message || 'Unknown error'}. Make sure @neondatabase/serverless is installed.`);
    }
  } else {
    // Dùng @vercel/postgres (cho Vercel Postgres)
    try {
      const { sql } = await import('@vercel/postgres');
      return sql;
    } catch (error) {
      throw new Error('Failed to initialize Vercel Postgres. Make sure @vercel/postgres is installed.');
    }
  }
}

// Khởi tạo tables (chạy một lần)
export async function initDatabase() {
  try {
    console.log('Getting SQL connection...');
    const sql = await getSql();
    console.log('SQL connection obtained');
    
    // Kiểm tra xem có phải Neon không
    const postgresUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '';
    const isNeon = postgresUrl.includes('neon.tech');
    
    // Dùng sql từ getSql() (đã được wrap đúng cách)
    console.log('Creating users table...');
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Users table created');

    console.log('Creating classes table...');
    await sql`
      CREATE TABLE IF NOT EXISTS classes (
        id VARCHAR(255) PRIMARY KEY,
        ten_lop VARCHAR(255) NOT NULL,
        giao_vien VARCHAR(255),
        si_so INTEGER DEFAULT 0,
        thang_nam VARCHAR(20),
        thoi_gian_hoc VARCHAR(255),
        trung_tam VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Classes table created');

    console.log('Creating students table...');
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(255) PRIMARY KEY,
        class_id VARCHAR(255),
        stt INTEGER NOT NULL,
        ho_va_ten VARCHAR(255) NOT NULL,
        ngay_vao VARCHAR(255),
        so_dien_thoai VARCHAR(20),
        ngay_dong VARCHAR(255),
        ky_ten VARCHAR(255),
        diem_danh_b1 BOOLEAN DEFAULT FALSE,
        diem_danh_b2 BOOLEAN DEFAULT FALSE,
        diem_danh_b3 BOOLEAN DEFAULT FALSE,
        diem_danh_b4 BOOLEAN DEFAULT FALSE,
        diem_danh_b5 BOOLEAN DEFAULT FALSE,
        diem_danh_b6 BOOLEAN DEFAULT FALSE,
        diem_danh_b7 BOOLEAN DEFAULT FALSE,
        diem_danh_b8 BOOLEAN DEFAULT FALSE,
        ghi_chu TEXT,
        chiet_khau DECIMAL(10,2) DEFAULT 0,
        phan_tram DECIMAL(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('Students table created');
    
    console.log('Database initialization completed successfully');
  } catch (error: any) {
    console.error('Database initialization error:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    throw error;
  }
}

// Helper function để xử lý kết quả từ Neon hoặc Vercel Postgres
function getRows(result: any): any[] {
  // Neon trả về array trực tiếp, Vercel Postgres trả về object có property rows
  if (Array.isArray(result)) {
    return result;
  }
  if (result && Array.isArray(result.rows)) {
    return result.rows;
  }
  return [];
}

// User functions
export async function getUsersPostgres(): Promise<User[]> {
  try {
    const sql = await getSql();
    const result = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    const rows = getRows(result);
    return rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      createdAt: row.created_at ? (typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()) : new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error('Get users error:', error);
    // Nếu bảng chưa tồn tại, tự động khởi tạo database
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.log('Tables do not exist, initializing database...');
      try {
        await initDatabase();
        // Thử lại sau khi init
        const sql = await getSql();
        const result = await sql`SELECT * FROM users ORDER BY created_at DESC`;
        const rows = getRows(result);
        return rows.map((row: any) => ({
          id: row.id,
          email: row.email,
          password: row.password,
          name: row.name,
          createdAt: row.created_at ? (typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()) : new Date().toISOString(),
        }));
      } catch (initError) {
        console.error('Auto-init failed:', initError);
        return [];
      }
    }
    return [];
  }
}

export async function saveUserPostgres(user: User): Promise<void> {
  try {
    const sql = await getSql();
    await sql`
      INSERT INTO users (id, email, password, name, created_at)
      VALUES (${user.id}, ${user.email}, ${user.password}, ${user.name}, ${user.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        name = EXCLUDED.name
    `;
  } catch (error: any) {
    console.error('Save user error:', error);
    // Nếu bảng chưa tồn tại, tự động khởi tạo database
    if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
      console.log('Tables do not exist, initializing database...');
      try {
        await initDatabase();
        // Thử lại sau khi init
        const sql = await getSql();
        await sql`
          INSERT INTO users (id, email, password, name, created_at)
          VALUES (${user.id}, ${user.email}, ${user.password}, ${user.name}, ${user.createdAt})
          ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            password = EXCLUDED.password,
            name = EXCLUDED.name
        `;
        return;
      } catch (initError) {
        console.error('Auto-init failed:', initError);
        throw initError;
      }
    }
    throw error;
  }
}

export async function saveUsersPostgres(users: User[]): Promise<void> {
  for (const user of users) {
    await saveUserPostgres(user);
  }
}

// Student functions
export async function getStudentsPostgres(): Promise<Student[]> {
  try {
    const sql = await getSql();
    const result = await sql`SELECT * FROM students ORDER BY stt ASC`;
    const rows = getRows(result);
    return rows.map((row: any) => ({
      id: row.id,
      classId: row.class_id || '',
      stt: row.stt,
      hoVaTen: row.ho_va_ten,
      ngayVao: row.ngay_vao || '',
      soDienThoai: row.so_dien_thoai || '',
      ngayDong: row.ngay_dong || '',
      kyTen: row.ky_ten || '',
      diemDanh: {
        B1: row.diem_danh_b1 || false,
        B2: row.diem_danh_b2 || false,
        B3: row.diem_danh_b3 || false,
        B4: row.diem_danh_b4 || false,
        B5: row.diem_danh_b5 || false,
        B6: row.diem_danh_b6 || false,
        B7: row.diem_danh_b7 || false,
        B8: row.diem_danh_b8 || false,
      },
      ghiChu: row.ghi_chu || '',
      chietKhau: parseFloat(row.chiet_khau) || 0,
      phanTram: parseFloat(row.phan_tram) || 0,
      createdAt: row.created_at ? (typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()) : new Date().toISOString(),
      updatedAt: row.updated_at ? (typeof row.updated_at === 'string' ? row.updated_at : row.updated_at.toISOString()) : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Get students error:', error);
    return [];
  }
}

export async function saveStudentPostgres(student: Student): Promise<void> {
  try {
    const sql = await getSql();
    await sql`
      INSERT INTO students (
        id, class_id, stt, ho_va_ten, ngay_vao, so_dien_thoai, ngay_dong, ky_ten,
        diem_danh_b1, diem_danh_b2, diem_danh_b3, diem_danh_b4,
        diem_danh_b5, diem_danh_b6, diem_danh_b7, diem_danh_b8,
        ghi_chu, chiet_khau, phan_tram, created_at, updated_at
      )
      VALUES (
        ${student.id}, ${student.classId || null}, ${student.stt}, ${student.hoVaTen}, ${student.ngayVao},
        ${student.soDienThoai}, ${student.ngayDong}, ${student.kyTen},
        ${student.diemDanh.B1}, ${student.diemDanh.B2}, ${student.diemDanh.B3}, ${student.diemDanh.B4},
        ${student.diemDanh.B5}, ${student.diemDanh.B6}, ${student.diemDanh.B7}, ${student.diemDanh.B8},
        ${student.ghiChu}, ${student.chietKhau}, ${student.phanTram},
        ${student.createdAt}, ${student.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        class_id = EXCLUDED.class_id,
        stt = EXCLUDED.stt,
        ho_va_ten = EXCLUDED.ho_va_ten,
        ngay_vao = EXCLUDED.ngay_vao,
        so_dien_thoai = EXCLUDED.so_dien_thoai,
        ngay_dong = EXCLUDED.ngay_dong,
        ky_ten = EXCLUDED.ky_ten,
        diem_danh_b1 = EXCLUDED.diem_danh_b1,
        diem_danh_b2 = EXCLUDED.diem_danh_b2,
        diem_danh_b3 = EXCLUDED.diem_danh_b3,
        diem_danh_b4 = EXCLUDED.diem_danh_b4,
        diem_danh_b5 = EXCLUDED.diem_danh_b5,
        diem_danh_b6 = EXCLUDED.diem_danh_b6,
        diem_danh_b7 = EXCLUDED.diem_danh_b7,
        diem_danh_b8 = EXCLUDED.diem_danh_b8,
        ghi_chu = EXCLUDED.ghi_chu,
        chiet_khau = EXCLUDED.chiet_khau,
        phan_tram = EXCLUDED.phan_tram,
        updated_at = EXCLUDED.updated_at
    `;
  } catch (error) {
    console.error('Save student error:', error);
    throw error;
  }
}

export async function saveStudentsPostgres(students: Student[]): Promise<void> {
  for (const student of students) {
    await saveStudentPostgres(student);
  }
}

export async function deleteStudentPostgres(id: string): Promise<void> {
  try {
    const sql = await getSql();
    await sql`DELETE FROM students WHERE id = ${id}`;
  } catch (error) {
    console.error('Delete student error:', error);
    throw error;
  }
}

// Class functions
export async function getClassesPostgres(): Promise<ClassInfo[]> {
  try {
    const sql = await getSql();
    const result = await sql`SELECT * FROM classes ORDER BY created_at DESC`;
    const rows = getRows(result);
    return rows.map((row: any) => ({
      id: row.id,
      tenLop: row.ten_lop,
      giaoVien: row.giao_vien || '',
      siSo: row.si_so || 0,
      thangNam: row.thang_nam || '',
      thoiGianHoc: row.thoi_gian_hoc || '',
      trungTam: row.trung_tam || '',
      createdAt: row.created_at ? (typeof row.created_at === 'string' ? row.created_at : row.created_at.toISOString()) : new Date().toISOString(),
      updatedAt: row.updated_at ? (typeof row.updated_at === 'string' ? row.updated_at : row.updated_at.toISOString()) : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Get classes error:', error);
    return [];
  }
}

export async function saveClassPostgres(classInfo: ClassInfo): Promise<void> {
  try {
    const sql = await getSql();
    await sql`
      INSERT INTO classes (
        id, ten_lop, giao_vien, si_so, thang_nam, thoi_gian_hoc, trung_tam, created_at, updated_at
      )
      VALUES (
        ${classInfo.id}, ${classInfo.tenLop}, ${classInfo.giaoVien}, ${classInfo.siSo},
        ${classInfo.thangNam}, ${classInfo.thoiGianHoc}, ${classInfo.trungTam},
        ${classInfo.createdAt}, ${classInfo.updatedAt}
      )
      ON CONFLICT (id) DO UPDATE SET
        ten_lop = EXCLUDED.ten_lop,
        giao_vien = EXCLUDED.giao_vien,
        si_so = EXCLUDED.si_so,
        thang_nam = EXCLUDED.thang_nam,
        thoi_gian_hoc = EXCLUDED.thoi_gian_hoc,
        trung_tam = EXCLUDED.trung_tam,
        updated_at = EXCLUDED.updated_at
    `;
  } catch (error) {
    console.error('Save class error:', error);
    throw error;
  }
}

export async function saveClassesPostgres(classes: ClassInfo[]): Promise<void> {
  for (const classInfo of classes) {
    await saveClassPostgres(classInfo);
  }
}

export async function deleteClassPostgres(id: string): Promise<void> {
  try {
    const sql = await getSql();
    await sql`DELETE FROM classes WHERE id = ${id}`;
  } catch (error) {
    console.error('Delete class error:', error);
    throw error;
  }
}

