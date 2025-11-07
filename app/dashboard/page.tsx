'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ClassInfo } from '@/lib/db';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassInfo | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
    loadClasses();
  }, []);

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

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const handleAddClass = () => {
    setEditingClass(null);
    setShowClassModal(true);
  };

  const handleEditClass = (classInfo: ClassInfo) => {
    setEditingClass(classInfo);
    setShowClassModal(true);
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Bạn có chắc muốn xóa lớp này? Tất cả học sinh trong lớp sẽ bị xóa.')) {
      return;
    }

    try {
      const res = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadClasses();
      } else {
        const data = await res.json();
        alert(data.error || 'Lỗi khi xóa lớp');
      }
    } catch (error) {
      alert('Lỗi khi xóa lớp');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsm') || fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isHtml = fileName.endsWith('.html') || fileName.endsWith('.htm');
    const isCsv = fileName.endsWith('.csv');
    
    if (!isExcel && !isHtml && !isCsv) {
      alert('Chỉ chấp nhận file Excel (.xlsm, .xlsx, .xls), HTML (.html, .htm) hoặc CSV (.csv)');
      return;
    }

    setUploading(true);
    setUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/students/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadMessage(`Lỗi: ${data.error}`);
        setUploading(false);
        return;
      }

      let message = `Thành công: ${data.message}`;
      if (data.classesCreated > 0) {
        message += `\nĐã tạo ${data.classesCreated} lớp học mới`;
        if (data.classes && data.classes.length > 0) {
          message += `: ${data.classes.map((c: any) => c.tenLop).join(', ')}`;
        }
      }

      setUploadMessage(message);
      loadClasses();
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadMessage('');
      }, 3000);
    } catch (error) {
      setUploadMessage('Lỗi khi upload file');
    } finally {
      setUploading(false);
    }
  };

  const filteredClasses = classes.filter((classInfo) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      classInfo.tenLop.toLowerCase().includes(searchLower) ||
      classInfo.giaoVien.toLowerCase().includes(searchLower) ||
      classInfo.thangNam.toLowerCase().includes(searchLower) ||
      classInfo.trungTam.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <nav className="bg-white/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Wonder Center
                </h1>
                <span className="text-xs text-gray-500">Quản lý lớp học</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-700 font-medium">Xin chào, {user?.name}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header với search và actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm lớp, giáo viên, tháng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Upload Excel
            </button>
            <button
              onClick={handleAddClass}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo lớp mới
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-700 mb-1">Tổng số lớp</div>
                <div className="text-3xl font-bold text-blue-900">{classes.length}</div>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 rounded-2xl shadow-lg border border-indigo-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-indigo-700 mb-1">Lớp đang hiển thị</div>
                <div className="text-3xl font-bold text-indigo-900">{filteredClasses.length}</div>
              </div>
              <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border border-purple-200/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-purple-700 mb-1">Tháng hiện tại</div>
                <div className="text-3xl font-bold text-purple-900">
                  {new Date().toLocaleDateString('vi-VN', { month: '2-digit', year: 'numeric' })}
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Trello-like Cards Grid */}
        {filteredClasses.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-gray-200/50">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <div className="text-gray-500 text-lg mb-2 font-medium">
              {searchTerm ? 'Không tìm thấy lớp nào' : 'Chưa có lớp nào'}
            </div>
            <div className="text-gray-400 text-sm mb-6">
              {searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy tạo lớp mới hoặc upload Excel để bắt đầu!'}
            </div>
            {!searchTerm && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleAddClass}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Tạo lớp mới
                </button>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Excel
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredClasses.map((classInfo) => (
              <ClassCard
                key={classInfo.id}
                classInfo={classInfo}
                onEdit={() => handleEditClass(classInfo)}
                onDelete={() => handleDeleteClass(classInfo.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-slideUp">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Upload File
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadMessage('');
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {uploadMessage && (
              <div
                className={`mb-6 p-4 rounded-xl border-2 ${
                  uploadMessage.includes('Lỗi')
                    ? 'bg-red-50 border-red-200 text-red-700'
                    : 'bg-green-50 border-green-200 text-green-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  {uploadMessage.includes('Lỗi') ? (
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <pre className="whitespace-pre-wrap text-sm font-medium">{uploadMessage}</pre>
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Chọn file Excel, HTML hoặc CSV
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".xlsm,.xlsx,.xls,.html,.htm,.csv"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-blue-400 bg-gray-50 hover:bg-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-xs text-gray-500">Click để chọn file</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong className="font-semibold">💡 Khuyến nghị:</strong> Sử dụng file <strong>CSV</strong> (dễ parse nhất, ít lỗi nhất)
                  <br />
                  Hoặc file Excel (.xlsm, .xlsx, .xls) hoặc HTML (.html, .htm)
                </p>
              </div>
            </div>

            {uploading && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                  <svg className="animate-spin h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-blue-700 font-medium">Đang xử lý file...</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadMessage('');
                }}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class Modal */}
      {showClassModal && (
        <ClassModal
          classInfo={editingClass}
          onClose={() => {
            setShowClassModal(false);
            setEditingClass(null);
          }}
          onSave={() => {
            setShowClassModal(false);
            setEditingClass(null);
            loadClasses();
          }}
        />
      )}
    </div>
  );
}

// Class Card Component (Trello-like)
function ClassCard({
  classInfo,
  onEdit,
  onDelete,
}: {
  classInfo: ClassInfo;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [studentCount, setStudentCount] = useState(0);

  useEffect(() => {
    loadStudentCount();
  }, [classInfo.id]);

  const loadStudentCount = async () => {
    try {
      const res = await fetch(`/api/students?classId=${classInfo.id}`);
      if (res.ok) {
        const data = await res.json();
        setStudentCount(data.students?.length || 0);
      }
    } catch (error) {
      console.error('Error loading student count:', error);
    }
  };

  // Tính phần trăm sĩ số
  const attendancePercent = classInfo.siSo > 0 
    ? Math.round((studentCount / classInfo.siSo) * 100) 
    : 0;

  return (
    <Link href={`/dashboard/class/${classInfo.id}`}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-2xl transition-all duration-300 cursor-pointer h-full flex flex-col transform hover:-translate-y-2 overflow-hidden group">
        {/* Header với màu gradient */}
        <div className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-all"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-white font-bold text-xl mb-1 drop-shadow-md">{classInfo.tenLop}</h3>
                {classInfo.giaoVien && (
                  <div className="text-blue-100 text-sm font-medium">👨‍🏫 {classInfo.giaoVien}</div>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="text-white hover:bg-white/20 p-2 rounded-lg transition-all backdrop-blur-sm"
                  title="Sửa lớp"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-white hover:bg-red-500/30 p-2 rounded-lg transition-all backdrop-blur-sm"
                  title="Xóa lớp"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 bg-white">
          <div className="space-y-3">
            {classInfo.thangNam && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{classInfo.thangNam}</span>
              </div>
            )}
            {classInfo.thoiGianHoc && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{classInfo.thoiGianHoc}</span>
              </div>
            )}
            {classInfo.trungTam && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-gray-600 text-xs line-clamp-1">{classInfo.trungTam}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer với stats */}
        <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-b-2xl border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm">
              <span className="font-bold text-gray-900 text-lg">{studentCount}</span>
              <span className="text-gray-600 ml-1">học sinh</span>
            </div>
            {classInfo.siSo > 0 && (
              <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                / {classInfo.siSo} sĩ số
              </div>
            )}
          </div>
          {classInfo.siSo > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(attendancePercent, 100)}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

// Class Modal Component
function ClassModal({
  classInfo,
  onClose,
  onSave,
}: {
  classInfo: ClassInfo | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    tenLop: '',
    giaoVien: '',
    siSo: 0,
    thangNam: '',
    thoiGianHoc: '',
    trungTam: 'TRUNG TÂM BDVH & NGOẠI NGỮ WONDER',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classInfo) {
      setFormData({
        tenLop: classInfo.tenLop,
        giaoVien: classInfo.giaoVien,
        siSo: classInfo.siSo,
        thangNam: classInfo.thangNam,
        thoiGianHoc: classInfo.thoiGianHoc,
        trungTam: classInfo.trungTam,
      });
    } else {
      // Set tháng hiện tại mặc định
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setFormData({
        tenLop: '',
        giaoVien: '',
        siSo: 0,
        thangNam: `${month}/${year}`,
        thoiGianHoc: '',
        trungTam: 'TRUNG TÂM BDVH & NGOẠI NGỮ WONDER',
      });
    }
  }, [classInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = classInfo ? `/api/classes/${classInfo.id}` : '/api/classes';
      const method = classInfo ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Có lỗi xảy ra');
        setLoading(false);
        return;
      }

      onSave();
    } catch (err) {
      setError('Có lỗi xảy ra. Vui lòng thử lại.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUp">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                classInfo 
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                  : 'bg-gradient-to-br from-green-500 to-emerald-600'
              }`}>
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                {classInfo ? 'Sửa thông tin lớp' : 'Tạo lớp mới'}
              </h2>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-1 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-red-500">*</span>
                Tên lớp
              </label>
              <input
                type="text"
                value={formData.tenLop}
                onChange={(e) => setFormData({ ...formData, tenLop: e.target.value })}
                required
                placeholder="Ví dụ: 6A10, K8A9"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Giáo viên
              </label>
              <input
                type="text"
                value={formData.giaoVien}
                onChange={(e) => setFormData({ ...formData, giaoVien: e.target.value })}
                placeholder="Ví dụ: Cô Tiên - Lý"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tháng/Năm
              </label>
              <input
                type="text"
                value={formData.thangNam}
                onChange={(e) => setFormData({ ...formData, thangNam: e.target.value })}
                placeholder="Ví dụ: 10/2025"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Sĩ số
              </label>
              <input
                type="number"
                value={formData.siSo}
                onChange={(e) => setFormData({ ...formData, siSo: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Thời gian học
              </label>
              <input
                type="text"
                value={formData.thoiGianHoc}
                onChange={(e) => setFormData({ ...formData, thoiGianHoc: e.target.value })}
                placeholder="Ví dụ: Thứ 2,4,6 - 19:00-21:00"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Trung tâm
              </label>
              <input
                type="text"
                value={formData.trungTam}
                onChange={(e) => setFormData({ ...formData, trungTam: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                classInfo
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang lưu...
                </span>
              ) : (
                classInfo ? 'Cập nhật' : 'Tạo lớp'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
