import React, { useState } from 'react';
import { X, User, Mail, Phone, Building, Briefcase, Save, ChevronDown } from 'lucide-react';
import { useUser, Staff } from '../../contexts/UserContext';
import { UserPosition, positionInfo } from '../../types/permissions';

interface EditStaffFormProps {
  staff: Staff;
  onClose: () => void;
}

const AVAILABLE_PERMISSIONS = [
  // 업무 관리
  { id: 'tasks.view_assigned', label: '내 업무', category: '업무 관리' },
  { id: 'tasks.view_department', label: '팀 업무 보기', category: '업무 관리' },
  { id: 'tasks.view_all', label: '전체 업무 조회', category: '업무 관리' },
  { id: 'tasks.create', label: '업무 생성', category: '업무 관리' },
  { id: 'tasks.update', label: '업무 편집', category: '업무 관리' },
  { id: 'tasks.comment', label: '업무 댓글', category: '업무 관리' },
  
  // 보고서 관리
  { id: 'reports.create', label: '일일 업무 보고', category: '보고서 관리' },
  { id: 'reports.view_own', label: '내 보고서 조회', category: '보고서 관리' },
  { id: 'reports.view_department', label: '팀 보고서 조회', category: '보고서 관리' },
  { id: 'reports.view_all', label: '전체 보고서 조회', category: '보고서 관리' },
  
  // 일정 관리
  { id: 'schedules.view_own', label: '내 일정 조회', category: '일정 관리' },
  { id: 'schedules.view_department', label: '팀 일정 조회', category: '일정 관리' },
  { id: 'schedules.view_all', label: '일정 관리', category: '일정 관리' },
  { id: 'schedules.create', label: '일정 생성', category: '일정 관리' },
  { id: 'schedules.update', label: '일정 편집', category: '일정 관리' },
  
  // 공지사항
  { id: 'announcements.read', label: '공지사항', category: '공지사항' },
  { id: 'announcements.create', label: '공지사항 작성', category: '공지사항' },
  
  // 매뉴얼
  { id: 'manuals.read', label: '매뉴얼', category: '매뉴얼' },
  
  // 건의사항
  { id: 'suggestions.create', label: '건의사항', category: '건의사항' },
  { id: 'suggestions.view_own', label: '내 건의사항 조회', category: '건의사항' },
  { id: 'suggestions.view_all', label: '전체 건의사항 조회', category: '건의사항' },
  { id: 'suggestions.respond', label: '건의사항 응답', category: '건의사항' },
  
  // 매출 관리
  { id: 'sales.create', label: '매출 등록', category: '매출 관리' },
  { id: 'sales.view_department', label: '매출보고 작성', category: '매출 관리' },
  { id: 'sales.view_own', label: '매출 보고서', category: '매출 관리' },
  { id: 'sales.view_all', label: '전체 매출 조회', category: '매출 관리' },
  
  // 자판기 관리
  { id: 'vending.view_own', label: '자판기 관리', category: '자판기 관리' },
  { id: 'vending.view_all', label: '전체 자판기 매출', category: '자판기 관리' },
  
  // 운영 관리
  { id: 'members.view_department', label: '회원 관리', category: '운영 관리' },
  { id: 'members.view_all', label: '전체 회원 조회', category: '운영 관리' },
  { id: 'members.create', label: '회원 생성', category: '운영 관리' },
  { id: 'members.update', label: '회원 편집', category: '운영 관리' },
  
  { id: 'customers.view_all', label: '고객 관리', category: '운영 관리' },
  { id: 'customers.create', label: '고객 생성', category: '운영 관리' },
  { id: 'customers.update', label: '고객 편집', category: '운영 관리' },
  
  { id: 'trainers.view_all', label: '트레이너 관리', category: '운영 관리' },
  { id: 'trainers.create', label: '트레이너 생성', category: '운영 관리' },
  { id: 'trainers.update', label: '트레이너 편집', category: '운영 관리' },
  
  // OT 관리
  { id: 'ot.view_assigned', label: 'OT 배정', category: 'OT 관리' },
  { id: 'ot.view_all', label: '전체 OT 조회', category: 'OT 관리' },
  { id: 'ot.assign', label: 'OT 할당', category: 'OT 관리' },
  { id: 'ot.progress_update', label: 'OT 진행 업데이트', category: 'OT 관리' },
  
  // 이용권 관리
  { id: 'pass.view_all', label: '이용권 관리', category: '이용권 관리' },
  { id: 'pass.create', label: '이용권 생성', category: '이용권 관리' },
  
  // 시스템 관리
  { id: 'users.view_all', label: '직원 관리', category: '시스템 관리' },
  { id: 'users.create', label: '직원 생성', category: '시스템 관리' },
  { id: 'users.update', label: '직원 편집', category: '시스템 관리' },
  
  { id: 'admin.task_management', label: '업무 관리', category: '시스템 관리' },
  { id: 'admin.announcements', label: '공지사항 관리', category: '시스템 관리' },
  { id: 'admin.reports', label: '보고서 관리', category: '시스템 관리' },
  { id: 'admin.suggestions', label: '건의사항 관리', category: '시스템 관리' },
];

const EditStaffForm: React.FC<EditStaffFormProps> = ({ staff, onClose }) => {
  const { updateStaff } = useUser();
  const [formData, setFormData] = useState({
    name: staff.name,
    email: staff.email,
    phone: staff.phone || '',
    department: staff.department || '',
    position: staff.position || '',
    status: staff.status,
    permissions: staff.permissions || []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(p => p !== permissionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      alert('이름과 이메일은 필수입니다.');
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (updateStaff) {
        const success = await updateStaff(staff.id, formData);
        if (success) {
          alert('직원 정보가 성공적으로 수정되었습니다.');
          onClose();
        } else {
          alert('직원 정보 수정에 실패했습니다.');
        }
      } else {
        alert('수정 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('직원 수정 오류:', error);
      alert('직원 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto my-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <User size={20} className="mr-2 text-blue-500" />
            직원 정보 수정
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="직원 이름"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="이메일 주소"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">
                전화번호
              </label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="010-0000-0000"
                />
              </div>
            </div>

            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-700 mb-1">
                부서
              </label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full pl-10 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="부서명"
                />
              </div>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-slate-700 mb-1">
                직책
              </label>
              <div className="relative">
                <Briefcase size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10" />
                <select
                  id="position"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="">직책 선택</option>
                  {Object.entries(positionInfo).map(([id, info]) => (
                    <option key={id} value={id}>{info.name}</option>
                  ))}
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">
                상태
              </label>
              <div className="relative">
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                  style={{ backgroundImage: 'none' }}
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="pending">보류</option>
                  <option value="suspended">정지</option>
                </select>
                <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 접근 권한 설정 */}
          <div>
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">접근 권한 설정</h3>
              <p className="text-sm text-slate-600">
                시스템 메뉴별로 접근 권한을 설정합니다. <span className="text-blue-600 font-medium">조회</span>는 보기만, <span className="text-green-600 font-medium">생성/편집</span>은 추가·수정이 가능합니다.
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              {Object.entries(
                AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
                  const category = permission.category || '기타';
                  if (!acc[category]) acc[category] = [];
                  acc[category].push(permission);
                  return acc;
                }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>)
              ).map(([category, permissions]) => (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-medium text-slate-700">{category}</h4>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {permissions.map(permission => (
                        <label key={permission.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.permissions.includes(permission.id)}
                            onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                            className="form-checkbox text-blue-600 mr-2 rounded"
                          />
                          <span className="text-sm text-slate-700">{permission.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center ${
                isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Save size={16} className="mr-2" />
              {isSubmitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffForm; 