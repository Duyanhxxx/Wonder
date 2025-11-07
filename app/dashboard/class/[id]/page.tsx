'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import StudentModal from '@/components/StudentModal';
import { Student, ClassInfo } from '@/lib/db';

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.id as string;

  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
    loadClassInfo();
    loadStudents();
  }, [classId]);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/login');
        return;
      }
      const data = await res.json();
      setUser(data.user);
    } catch (error) {
      router.push('/login');
    }
  };

  const loadClassInfo = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        const found = data.classes?.find((c: ClassInfo) => c.id === classId);
        setClassInfo(found || null);
      }
    } catch (error) {
      console.error('Error loading class info:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const res = await fetch(`/api/students?classId=${classId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStudent(null);
    setShowModal(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa học sinh này?')) {
      return;
    }

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadStudents();
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa học sinh');
      }
    } catch (error) {
      alert('Lỗi khi xóa học sinh');
    }
  };

  const filteredStudents = students.filter((student) =>
    student.hoVaTen.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.soDienThoai.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">Không tìm thấy lớp học</div>
          <Link
            href="/dashboard"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Quay lại Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-all hover:bg-gray-100 px-3 py-1.5 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Quay lại
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {classInfo.tenLop}
                </h1>
                {classInfo.giaoVien && (
                  <div className="text-sm text-gray-600 font-medium">👨‍🏫 {classInfo.giaoVien}</div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 font-medium">{user?.name}</span>
              </div>
              <button
                onClick={() => {
                  fetch('/api/auth/logout', { method: 'POST' });
                  router.push('/login');
                }}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Class Info Banner */}
        <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xs text-blue-100 mb-1 font-medium uppercase tracking-wide">Tháng/Năm</div>
                <div className="text-2xl font-bold">{classInfo.thangNam || 'N/A'}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xs text-blue-100 mb-1 font-medium uppercase tracking-wide">Sĩ số</div>
                <div className="text-2xl font-bold">
                  {students.length} / {classInfo.siSo || 'N/A'}
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xs text-blue-100 mb-1 font-medium uppercase tracking-wide">Thời gian học</div>
                <div className="text-lg font-semibold">{classInfo.thoiGianHoc || 'N/A'}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-xs text-blue-100 mb-1 font-medium uppercase tracking-wide">Trung tâm</div>
                <div className="text-lg font-semibold line-clamp-1">{classInfo.trungTam}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
            />
          </div>
          <div>
            <button
              onClick={handleAdd}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm học sinh
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-200/50">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    STT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Họ và tên
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày vào
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    SĐT
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ngày đóng
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Điểm danh
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Ghi chú
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="text-gray-500 font-medium">
                          {searchTerm ? 'Không tìm thấy học sinh nào' : 'Chưa có học sinh nào. Hãy thêm học sinh mới!'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => {
                    const attendanceCount = Object.values(student.diemDanh).filter(Boolean).length;
                    return (
                      <tr key={student.id} className="hover:bg-blue-50/50 transition-colors duration-150 border-b border-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shadow-md">
                              {student.stt}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {student.hoVaTen}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {student.ngayVao || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 font-mono">
                            {student.soDienThoai || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {student.ngayDong || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-1.5 mb-2">
                            {(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'] as const).map((key) => (
                              <span
                                key={key}
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                                  student.diemDanh[key]
                                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-400'
                                }`}
                                title={key}
                              >
                                {student.diemDanh[key] ? '✓' : key.replace('B', '')}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">
                            {attendanceCount}/8 buổi
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {student.ghiChu || <span className="text-gray-400">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(student)}
                              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium text-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all font-medium text-sm flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Tổng số học sinh: <span className="font-semibold">{filteredStudents.length}</span>
        </div>
      </main>

      {showModal && (
        <StudentModal
          student={editingStudent}
          classId={classId}
          onClose={() => {
            setShowModal(false);
            setEditingStudent(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingStudent(null);
            loadStudents();
          }}
        />
      )}
    </div>
  );
}

