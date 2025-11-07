import { promises as fs } from 'fs';
import path from 'path';

// Auto-detect: Use Postgres if POSTGRES_URL is set, otherwise use file system
const usePostgres = !!process.env.POSTGRES_URL;

// Note: For Vercel deployment, file system is read-only
// You should use a database like Vercel Postgres, Supabase, or MongoDB
// This implementation works for local development only
const dbPath = process.env.VERCEL 
  ? '/tmp/data' // Vercel allows writing to /tmp
  : path.join(process.cwd(), 'data');

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  createdAt: string;
}

export interface ClassInfo {
  id: string;
  tenLop: string; // Ví dụ: "8A4"
  giaoVien: string; // Ví dụ: "Cô Tiên - Lý"
  siSo: number; // Sĩ số lớp
  thangNam: string; // Ví dụ: "09/2025"
  thoiGianHoc: string; // Thời gian học
  trungTam: string; // Tên trung tâm
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  classId: string; // ID của lớp học
  stt: number;
  hoVaTen: string;
  ngayVao: string;
  soDienThoai: string;
  ngayDong: string;
  kyTen: string;
  diemDanh: {
    B1: boolean;
    B2: boolean;
    B3: boolean;
    B4: boolean;
    B5: boolean;
    B6: boolean;
    B7: boolean;
    B8: boolean;
  };
  ghiChu: string;
  chietKhau: number;
  phanTram: number;
  createdAt: string;
  updatedAt: string;
}

async function ensureDbDir() {
  try {
    await fs.mkdir(dbPath, { recursive: true });
  } catch (error) {
    // Directory already exists
  }
}

export async function getUsers(): Promise<User[]> {
  if (usePostgres) {
    try {
      const { getUsersPostgres } = await import('./db-postgres');
      return getUsersPostgres();
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  try {
    const data = await fs.readFile(path.join(dbPath, 'users.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveUsers(users: User[]): Promise<void> {
  if (usePostgres) {
    try {
      const { saveUsersPostgres } = await import('./db-postgres');
      return saveUsersPostgres(users);
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  await fs.writeFile(
    path.join(dbPath, 'users.json'),
    JSON.stringify(users, null, 2)
  );
}

export async function getStudents(): Promise<Student[]> {
  if (usePostgres) {
    try {
      const { getStudentsPostgres } = await import('./db-postgres');
      return getStudentsPostgres();
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  try {
    const data = await fs.readFile(path.join(dbPath, 'students.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveStudents(students: Student[]): Promise<void> {
  if (usePostgres) {
    try {
      const { saveStudentsPostgres } = await import('./db-postgres');
      return saveStudentsPostgres(students);
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  await fs.writeFile(
    path.join(dbPath, 'students.json'),
    JSON.stringify(students, null, 2)
  );
}

export async function deleteStudentsByClassId(classId: string): Promise<void> {
  if (usePostgres) {
    try {
      const { deleteStudentsByClassIdPostgres } = await import('./db-postgres');
      return deleteStudentsByClassIdPostgres(classId);
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  try {
    const data = await fs.readFile(path.join(dbPath, 'students.json'), 'utf-8');
    const students = JSON.parse(data);
    const filtered = students.filter((s: Student) => s.classId !== classId);
    await fs.writeFile(
      path.join(dbPath, 'students.json'),
      JSON.stringify(filtered, null, 2)
    );
  } catch {
    // File doesn't exist, nothing to delete
  }
}

export async function getClasses(): Promise<ClassInfo[]> {
  if (usePostgres) {
    try {
      const { getClassesPostgres } = await import('./db-postgres');
      return getClassesPostgres();
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  try {
    const data = await fs.readFile(path.join(dbPath, 'classes.json'), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveClasses(classes: ClassInfo[]): Promise<void> {
  if (usePostgres) {
    try {
      const { saveClassesPostgres } = await import('./db-postgres');
      return saveClassesPostgres(classes);
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  await fs.writeFile(
    path.join(dbPath, 'classes.json'),
    JSON.stringify(classes, null, 2)
  );
}

export async function deleteClass(classId: string): Promise<void> {
  if (usePostgres) {
    try {
      const { deleteClassPostgres } = await import('./db-postgres');
      return deleteClassPostgres(classId);
    } catch (error) {
      console.error('Postgres error, falling back to file system:', error);
      // Fallback to file system
    }
  }
  
  await ensureDbDir();
  try {
    const data = await fs.readFile(path.join(dbPath, 'classes.json'), 'utf-8');
    const classes = JSON.parse(data);
    const filtered = classes.filter((c: ClassInfo) => c.id !== classId);
    await fs.writeFile(
      path.join(dbPath, 'classes.json'),
      JSON.stringify(filtered, null, 2)
    );
  } catch {
    // File doesn't exist, nothing to delete
  }
}

