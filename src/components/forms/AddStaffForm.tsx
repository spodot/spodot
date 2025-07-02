import React, { useState } from 'react';
import { X, Save, User, Shield, Settings, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useUser, UserStatus, Staff } from '../../contexts/UserContext';
import { UserPosition, positionInfo, departmentNames, UserRole } from '../../types/permissions';
import clsx from 'clsx';
import { logger, showSuccess, showError } from '../../utils/notifications';

export interface AddStaffFormProps {
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

const AddStaffForm = ({ onClose }: AddStaffFormProps) => {
  const { addStaff } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    status: 'active' as UserStatus,
    position: '' as UserPosition,
    hireDate: format(new Date(), 'yyyy-MM-dd'),
    role: 'reception' as UserRole,
    permissions: [] as string[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
    
    // 역할에 따른 기본 권한 설정
    if (name === 'role') {
      let defaultPermissions: string[] = [];
      switch (value) {
        case 'admin':
          // 관리자는 모든 권한
          defaultPermissions = AVAILABLE_PERMISSIONS.map(p => p.id);
          break;
        case 'reception':
          defaultPermissions = [
            'tasks.view_assigned', 'tasks.view_department', 'tasks.create', 'tasks.update', 'tasks.comment',
            'schedules.view_all', 'schedules.create', 'schedules.update',
            'members.view_department', 'members.create', 'members.update',
            'customers.view_all', 'customers.update',
            'trainers.view_all',
            'sales.create', 'sales.view_all',
            'reports.create', 'reports.view_department',
            'ot.view_assigned', 'ot.assign', 'ot.progress_update',
            'pass.view_all', 'pass.create',
            'vending.view_own',
            'announcements.read',
            'suggestions.create', 'suggestions.view_own',
            'manuals.read'
          ];
          break;
        case 'fitness':
        case 'tennis':
        case 'golf':
          defaultPermissions = [
            'tasks.view_assigned', 'tasks.create', 'tasks.update', 'tasks.comment',
            'schedules.view_department', 'schedules.view_own', 'schedules.create', 'schedules.update',
            'members.view_department', 'members.update',
            'sales.create', 'sales.view_own',
            'reports.create', 'reports.view_own',
            'ot.view_assigned', 'ot.progress_update',
            'vending.view_own',
            'announcements.read',
            'suggestions.create', 'suggestions.view_own',
            'manuals.read'
          ];
          break;
        default:
          defaultPermissions = ['tasks.view_assigned', 'announcements.read', 'manuals.read'];
      }
      
      setFormData(prev => ({
        ...prev,
        role: value as UserRole,
        permissions: defaultPermissions
      }));
    }
  };
  
  const handlePermissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          permissions: [...prev.permissions, value]
        };
      } else {
        return {
          ...prev,
          permissions: prev.permissions.filter(p => p !== value)
        };
      }
    });
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // 필수 필드 검증
    if (!formData.name) newErrors.name = '이름을 입력해 주세요';
    if (!formData.email) {
      newErrors.email = '이메일을 입력해 주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해 주세요';
    }
    
    if (!formData.phone) {
      newErrors.phone = '전화번호를 입력해 주세요';
    } else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(formData.phone) && !/^\d{10,11}$/.test(formData.phone)) {
      newErrors.phone = '유효한 전화번호 형식을 입력해 주세요 (예: 010-1234-5678 또는 01012345678)';
    }
    
    // 비밀번호 유효성 검사 - 이제 간소화됨
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해 주세요';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해 주세요';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }
    
    if (!formData.position) newErrors.position = '직책을 입력해 주세요';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const staffData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        status: formData.status,
        role: formData.role,
        position: formData.position,
        hireDate: formData.hireDate,
        permissions: formData.permissions
      };
      
      const newStaffId = await addStaff?.(staffData);
      
      if (newStaffId) {
        showSuccess('직원이 성공적으로 추가되었습니다.');
        onClose();
      } else {
        showError('직원 추가에 실패했습니다.');
      }
    } catch (error) {
      logger.error("AddStaffForm handleSubmit error:", error);
      showError('직원 추가 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
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
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            새 직원 추가
          </h2>
          <button 
            className="text-slate-400 hover:text-slate-500"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 기본 정보 섹션 */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">기본 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      이름
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={clsx(
                        'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        errors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      )}
                      placeholder="직원 이름"
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  {/* 상태 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      상태
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        style={{ backgroundImage: 'none' }}
                        required
                      >
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                        <option value="pending">대기중</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  
                  {/* 이메일 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      이메일
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={clsx(
                        'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      )}
                      placeholder="example@mail.com"
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                  
                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      전화번호
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={clsx(
                        'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      )}
                      placeholder="010-1234-5678"
                      required
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  {/* 비밀번호 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      비밀번호
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={clsx(
                        'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      )}
                      placeholder="********"
                      required
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                    )}
                  </div>
                  
                  {/* 비밀번호 확인 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      비밀번호 확인
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={clsx(
                        'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                        errors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                      )}
                      placeholder="********"
                      required
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 직원 정보 섹션 */}
              <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">직원 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 직책 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      직책
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="position"
                        value={formData.position}
                        onChange={handleChange}
                        className={clsx(
                          'w-full px-3 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white',
                          errors.position ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        )}
                        style={{ backgroundImage: 'none' }}
                        required
                      >
                        <option value="">직책 선택</option>
                        {Object.entries(positionInfo).map(([key, info]) => (
                          <option key={key} value={key as UserPosition}>
                            {info.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {errors.position && (
                      <p className="mt-1 text-sm text-red-500">{errors.position}</p>
                    )}
                  </div>
                  
                  {/* 입사일 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      입사일
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="date"
                      name="hireDate"
                      value={formData.hireDate}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  
                  {/* 역할 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      시스템 역할
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-3 pr-10 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                        style={{ backgroundImage: 'none' }}
                        required
                      >
                        <option value="reception">리셉션</option>
                        <option value="fitness">헬스</option>
                        <option value="tennis">테니스</option>
                        <option value="golf">골프</option>
                        <option value="admin">관리자</option>
                      </select>
                      <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      • 리셉션: 회원관리, 일정관리, 매출관리 등 프론트 업무 권한<br/>
                      • 헬스: 회원관리, 일정관리, OT 진행 권한<br/>
                      • 테니스: 회원관리, 일정관리, OT 진행 권한<br/>
                      • 골프: 회원관리, 일정관리, OT 진행 권한<br/>
                      • 관리자: 모든 기능 접근 가능
                    </p>
                  </div>
                </div>
              </div>
              
              {/* 권한 섹션 */}
              {formData.role !== 'admin' && (
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
                  <div className="mb-3">
                    <h3 className="font-medium text-slate-900 mb-1">접근 권한 설정</h3>
                    <p className="text-sm text-slate-600">
                      시스템 메뉴별로 접근 권한을 설정합니다. 
                      <span className="text-blue-600 font-medium">조회</span>는 보기만, 
                      <span className="text-blue-600 font-medium">생성/편집</span>은 추가·수정이 가능합니다.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    {Object.entries(
                      AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
                        const category = permission.category;
                        if (!acc[category]) acc[category] = [];
                        acc[category].push(permission);
                        return acc;
                      }, {} as Record<string, typeof AVAILABLE_PERMISSIONS>)
                    ).map(([category, permissions]) => (
                      <div key={category} className="border border-slate-200 rounded-lg p-3">
                        <h4 className="font-medium text-slate-800 mb-2 text-sm">{category}</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {permissions.map(permission => (
                            <div key={permission.id} className="flex items-center">
                              <input
                                type="checkbox"
                                id={permission.id}
                                value={permission.id}
                                checked={formData.permissions.includes(permission.id)}
                                onChange={handlePermissionChange}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={permission.id}
                                className="ml-2 block text-sm text-slate-700"
                              >
                                {permission.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 역할별 권한 안내 */}
              {formData.role && (
                <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start">
                    <Settings className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                    <div>
                      <h3 className="font-medium text-blue-800">
                        {formData.role === 'admin' ? '관리자' : 
                         formData.role === 'reception' ? '리셉션' :
                         formData.role === 'fitness' ? '피트니스' :
                         formData.role === 'tennis' ? '테니스' :
                         formData.role === 'golf' ? '골프' : '직원'} 권한
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {formData.role === 'admin' && '관리자는 모든 시스템 권한을 가집니다.'}
                        {formData.role === 'reception' && '리셉션은 회원관리, 일정관리, 매출관리, OT배정 등 프론트 업무 권한을 가집니다.'}
                        {formData.role === 'fitness' && '피트니스 부서는 회원관리, 일정관리, OT 진행 권한을 가집니다.'}
                        {formData.role === 'tennis' && '테니스 부서는 회원관리, 일정관리, OT 진행 권한을 가집니다.'}
                        {formData.role === 'golf' && '골프 부서는 회원관리, 일정관리, OT 진행 권한을 가집니다.'}
                        <br />필요에 따라 추가 권한을 선택하거나 제거할 수 있습니다.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
              <button 
                type="button" 
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                onClick={onClose}
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center"
                disabled={isSubmitting}
              >
                <Save size={16} className="mr-2" />
                {isSubmitting ? '저장 중...' : '직원 저장'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddStaffForm; 