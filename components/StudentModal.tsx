'use client';

import { useState, useEffect } from 'react';
import { Student, ClassInfo } from '@/lib/db';

interface StudentModalProps {
  student: Student | null;
  classId?: string;
  onClose: () => void;
  onSave: () => void;
}

export default function StudentModal({ student, classId, onClose, onSave }: StudentModalProps) {
  const [formData, setFormData] = useState({
    classId: '',
    hoVaTen: '',
    ngayVao: '',
    soDienThoai: '',
    ngayDong: '',
    kyTen: '',
    diemDanh: {
      B1: false,
      B2: false,
      B3: false,
      B4: false,
      B5: false,
      B6: false,
      B7: false,
      B8: false,
    },
    ghiChu: '',
    chietKhau: 0,
    phanTram: 0,
  });
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!classId) {
      loadClasses();
    }
  }, [classId]);

  useEffect(() => {
    if (student) {
      setFormData({
        classId: student.classId || classId || '',
        hoVaTen: student.hoVaTen,
        ngayVao: student.ngayVao,
        soDienThoai: student.soDienThoai,
        ngayDong: student.ngayDong,
        kyTen: student.kyTen,
        diemDanh: student.diemDanh,
        ghiChu: student.ghiChu,
        chietKhau: student.chietKhau,
        phanTram: student.phanTram,
      });
    } else {
      // Reset form khi thêm mới
      setFormData({
        classId: classId || '',
        hoVaTen: '',
        ngayVao: '',
        soDienThoai: '',
        ngayDong: '',
        kyTen: '',
        diemDanh: {
          B1: false,
          B2: false,
          B3: false,
          B4: false,
          B5: false,
          B6: false,
          B7: false,
          B8: false,
        },
        ghiChu: '',
        chietKhau: 0,
        phanTram: 0,
      });
    }
  }, [student, classId]);

  const loadClasses = async () => {
    try {
      const res = await fetch('/api/classes');
      if (res.ok) {
        const data = await res.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = student ? `/api/students/${student.id}` : '/api/students';
      const method = student ? 'PUT' : 'POST';

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

  const handleAttendanceChange = (key: keyof typeof formData.diemDanh) => {
    setFormData({
      ...formData,
      diemDanh: {
        ...formData.diemDanh,
        [key]: !formData.diemDanh[key],
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {student ? 'Sửa thông tin học sinh' : 'Thêm học sinh mới'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {!classId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lớp
                </label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Chọn lớp (tùy chọn)</option>
                  {classes.map((classInfo) => (
                    <option key={classInfo.id} value={classInfo.id}>
                      {classInfo.tenLop} {classInfo.thangNam ? `(${classInfo.thangNam})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên *
              </label>
              <input
                type="text"
                value={formData.hoVaTen}
                onChange={(e) => setFormData({ ...formData, hoVaTen: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày vào
              </label>
              <input
                type="text"
                value={formData.ngayVao}
                onChange={(e) => setFormData({ ...formData, ngayVao: e.target.value })}
                placeholder="26-thg 9"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày đóng
              </label>
              <input
                type="text"
                value={formData.ngayDong}
                onChange={(e) => setFormData({ ...formData, ngayDong: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ký tên
              </label>
              <input
                type="text"
                value={formData.kyTen}
                onChange={(e) => setFormData({ ...formData, kyTen: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chiết khấu
              </label>
              <input
                type="number"
                value={formData.chietKhau}
                onChange={(e) => setFormData({ ...formData, chietKhau: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phần trăm (%)
              </label>
              <input
                type="number"
                value={formData.phanTram}
                onChange={(e) => setFormData({ ...formData, phanTram: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Điểm danh
            </label>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
              {(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8'] as const).map((key) => (
                <label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.diemDanh[key]}
                    onChange={() => handleAttendanceChange(key)}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{key}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ghi chú
            </label>
            <textarea
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang lưu...' : student ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

