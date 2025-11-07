// Database adapter cho Vercel Postgres
// Sử dụng file này khi deploy lên Vercel với Postgres

import { User, Student, ClassInfo } from './db';

// Dynamic import để tránh lỗi khi package chưa được cài đặt
async function getSql() {
  const { sql } = await import('@vercel/postgres');
  return sql;
}

// Khởi tạo tables (chạy một lần)
export async function initDatabase() {
  try {
    const sql = await getSql();
    
    // Tạo bảng users
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Tạo bảng classes
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

    // Tạo bảng students
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
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// User functions
export async function getUsersPostgres(): Promise<User[]> {
  try {
    const sql = await getSql();
    const result = await sql`SELECT * FROM users ORDER BY created_at DESC`;
    return result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      createdAt: row.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('Get users error:', error);
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
  } catch (error) {
    console.error('Save user error:', error);
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
    return result.rows.map((row) => ({
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
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
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
    return result.rows.map((row) => ({
      id: row.id,
      tenLop: row.ten_lop,
      giaoVien: row.giao_vien || '',
      siSo: row.si_so || 0,
      thangNam: row.thang_nam || '',
      thoiGianHoc: row.thoi_gian_hoc || '',
      trungTam: row.trung_tam || '',
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
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

