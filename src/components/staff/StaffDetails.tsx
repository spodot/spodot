import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Edit, Trash, Save, Calendar, Clock, Phone, Mail, MapPin, AlertCircle, Shield, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Staff, UserStatus, useUser } from '../../contexts/UserContext';
import clsx from 'clsx';

interface StaffDetailsProps {
  staff: Staff;
  onClose: () => void;
}

// 권한 목록
const AVAILABLE_PERMISSIONS = [
  { id: 'view_clients', label: '고객 조회' },
  { id: 'edit_clients', label: '고객 편집' },
  { id: 'view_trainers', label: '트레이너 조회' },
  { id: 'edit_trainers', label: '트레이너 편집' },
  { id: 'view_schedules', label: '일정 조회' },
  { id: 'edit_schedules', label: '일정 편집' },
  { id: 'view_tasks', label: '업무 조회' },
  { id: 'edit_tasks', label: '업무 편집' },
  { id: 'view_reports', label: '보고서 조회' },
  { id: 'edit_reports', label: '보고서 편집' },
  { id: 'view_equipment', label: '장비 조회' },
  { id: 'edit_equipment', label: '장비 편집' },
  { id: 'view_inventory', label: '재고 조회' },
  { id: 'edit_inventory', label: '재고 편집' },
  { id: 'view_payments', label: '결제 조회' },
  { id: 'process_payments', label: '결제 처리' },
];

const StaffDetails = ({ staff, onClose }: StaffDetailsProps) => {
  const { updateStaff, deleteUser, updatePermissions } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Staff>(staff);
  
  useEffect(() => {
    setFormData(staff);
  }, [staff]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 관리자 역할이 선택되면 모든 권한 추가
    if (name === 'role' && value === 'admin') {
      setFormData(prev => ({
        ...prev,
        role: 'admin',
        permissions: ['all']
      }));
    } else if (name === 'role' && value === 'staff') {
      setFormData(prev => ({
        ...prev,
        role: 'staff',
        permissions: []
      }));
    }
  };
  
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...(prev.permissions || []), value]
        : (prev.permissions || []).filter(p => p !== value)
    }));
  };
  
  const handleSave = () => {
    // 역할이 관리자인 경우 권한 업데이트
    if (formData.role === 'admin' && !formData.permissions?.includes('all')) {
      updatePermissions(staff.id, ['all']);
    } else if (formData.role === 'staff') {
      updatePermissions(staff.id, formData.permissions || []);
    }
    
    // 직원 정보 업데이트
    updateStaff(staff.id, formData);
    
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    deleteUser(staff.id);
    onClose();
  };
  
  // 직원 상태에 따른 스타일
  const getStatusStyle = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-purple-100 text-purple-800';
    }
  };
  
  // 직원 상태 텍스트
  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'pending': return '대기중';
      case 'suspended': return '정지됨';
    }
  };
  
  // 직원 권한 레벨 표시
  const renderPermissionLevel = () => {
    if (formData.role === 'admin' || formData.permissions?.includes('all')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
          <Shield className="w-3 h-3 mr-1" />
          관리자
        </span>
      );
    }
    
    const permCount = formData.permissions?.length || 0;
    if (permCount > 5) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
          <Settings className="w-3 h-3 mr-1" />
          고급 권한
        </span>
      );
    } else if (permCount > 2) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
          <Settings className="w-3 h-3 mr-1" />
          일반 권한
        </span>
      );
    } else if (permCount > 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">
          <Settings className="w-3 h-3 mr-1" />
          제한 권한
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
        <Settings className="w-3 h-3 mr-1" />
        권한 없음
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            {isEditing ? '직원 정보 수정' : '직원 정보'}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button 
                  className="p-1 text-blue-600 hover:text-blue-800:text-blue-300"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={18} />
                </button>
                <button 
                  className="p-1 text-red-600 hover:text-red-800:text-red-300"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash size={18} />
                </button>
              </>
            )}
            <button 
              className="p-1 text-slate-400 hover:text-slate-500:text-slate-300"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* 확인 메시지 */}
        {isDeleting && (
          <div className="p-4 border-b border-slate-200 bg-red-50">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">직원 삭제 확인</h3>
                <p className="text-sm text-red-600 mt-1">
                  정말로 '{staff.name}' 직원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    className="btn btn-sm btn-outline text-red-600 border-red-600 hover:bg-red-50:bg-red-900/30"
                    onClick={handleDelete}
                  >
                    삭제
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setIsDeleting(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 상세 정보 또는 수정 폼 */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 섹션 */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">기본 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    이름
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input w-full"
                      required
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.name}
                    </div>
                  )}
                </div>
                
                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    상태
                  </label>
                  {isEditing ? (
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="pending">대기중</option>
                      <option value="suspended">정지됨</option>
                    </select>
                  ) : (
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getStatusStyle(formData.status)
                    )}>
                      {getStatusText(formData.status)}
                    </span>
                  )}
                </div>
                
                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    이메일
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input w-full"
                      required
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Mail className="w-4 h-4 mr-1.5 text-slate-400" />
                      <a href={`mailto:${formData.email}`} className="hover:underline">
                        {formData.email}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    전화번호
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input w-full"
                      required
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Phone className="w-4 h-4 mr-1.5 text-slate-400" />
                      <a href={`tel:${formData.phone}`} className="hover:underline">
                        {formData.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 직원 정보 섹션 */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">직원 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 부서 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    부서
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="department"
                      value={formData.department || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      placeholder="부서명 (예: 회원관리, 운영)"
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.department || '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 직책 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    직책
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="position"
                      value={formData.position || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      placeholder="직책 (예: 매니저, 사원)"
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.position || '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 입사일 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    입사일
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                      {formData.hireDate || '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 역할 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    역할
                  </label>
                  {isEditing ? (
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="staff">일반 직원</option>
                      <option value="admin">관리자</option>
                    </select>
                  ) : (
                    <div className="flex items-center text-slate-900">
                      {formData.role === 'admin' ? (
                        <Shield className="w-4 h-4 mr-1.5 text-red-500" />
                      ) : (
                        <User className="w-4 h-4 mr-1.5 text-slate-400" />
                      )}
                      {formData.role === 'admin' ? '관리자' : '일반 직원'}
                    </div>
                  )}
                </div>
                
                {/* 권한 레벨 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    권한 레벨
                  </label>
                  <div>
                    {renderPermissionLevel()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* 권한 설정 섹션 */}
            {isEditing && formData.role !== 'admin' && (
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <h3 className="font-medium text-slate-900">권한 설정</h3>
                  <span className="ml-2 text-xs text-slate-500">
                    (직원이 접근할 수 있는 기능을 선택하세요)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {AVAILABLE_PERMISSIONS.map(permission => (
                    <div key={permission.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`permission-${permission.id}`}
                        value={permission.id}
                        checked={formData.permissions?.includes(permission.id) || false}
                        onChange={handlePermissionChange}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`permission-${permission.id}`}
                        className="ml-2 block text-sm text-slate-700"
                      >
                        {permission.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 권한 목록 - 보기 모드 */}
            {!isEditing && formData.role !== 'admin' && formData.permissions && formData.permissions.length > 0 && (
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">권한 목록</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.permissions.map(perm => {
                    const permission = AVAILABLE_PERMISSIONS.find(p => p.id === perm);
                    return (
                      <span 
                        key={perm} 
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <Settings className="w-3 h-3 mr-1" />
                        {permission?.label || perm}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* 관리자 경고 */}
            {isEditing && formData.role === 'admin' && (
              <div className="md:col-span-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800">관리자 권한 안내</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      관리자는 모든 기능에 대한 접근 권한을 가집니다. 시스템 전체 설정을 변경하고 모든 데이터에 접근할 수 있습니다. 
                      관리자 권한은 꼭 필요한 직원에게만 부여해야 합니다.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* 계정 정보 */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">계정 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    등록일
                  </label>
                  <div className="flex items-center text-slate-900">
                    <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                    {format(new Date(formData.createdAt), 'yyyy년 MM월 dd일')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    최근 업데이트
                  </label>
                  <div className="flex items-center text-slate-900">
                    <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                    {format(new Date(formData.updatedAt), 'yyyy년 MM월 dd일')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 하단 버튼 */}
        <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
          {isEditing ? (
            <>
              <button 
                className="btn btn-outline"
                onClick={() => setIsEditing(false)}
              >
                취소
              </button>
              <button
                className="btn btn-primary inline-flex items-center"
                onClick={handleSave}
              >
                <Save size={16} className="mr-2" />
                저장
              </button>
            </>
          ) : (
            <button 
              className="btn btn-outline"
              onClick={onClose}
            >
              닫기
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StaffDetails; 