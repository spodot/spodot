import React, { useState } from 'react';
import { X, KeyRound, Save } from 'lucide-react';
import { useUser, Staff } from '../../contexts/UserContext';

interface PermissionsFormProps {
  staff: Staff;
  onClose: () => void;
}

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

const PermissionsForm: React.FC<PermissionsFormProps> = ({ staff, onClose }) => {
  const { updateUser } = useUser();
  const [permissions, setPermissions] = useState<string[]>(staff.permissions || []);

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setPermissions(prev => 
      checked
        ? [...prev, permissionId]
        : prev.filter(p => p !== permissionId)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedStaff: Staff = {
      ...staff,
      permissions
    };

    if (updateUser) {
      updateUser(staff.id, updatedStaff);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center">
            <KeyRound size={20} className="mr-2 text-purple-500" />
            권한 설정 - {staff.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 직원 정보 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-slate-700 mb-2">직원 정보</h4>
            <div className="text-sm text-slate-600 space-y-1">
              <div><span className="font-medium">이름:</span> {staff.name}</div>
              <div><span className="font-medium">부서:</span> {staff.department || '미지정'}</div>
              <div><span className="font-medium">직책:</span> {staff.position || '미지정'}</div>
            </div>
          </div>

          {/* 권한 설정 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              권한 선택 ({permissions.length}개 선택됨)
            </label>
            <div className="space-y-3 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {AVAILABLE_PERMISSIONS.map(permission => (
                <label key={permission.id} className="flex items-center hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={permissions.includes(permission.id)}
                    onChange={(e) => handlePermissionChange(permission.id, e.target.checked)}
                    className="form-checkbox text-purple-600 mr-3"
                  />
                  <span className="text-sm text-slate-700">{permission.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 권한 요약 */}
          {permissions.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-800 mb-2">선택된 권한</h4>
              <div className="flex flex-wrap gap-2">
                {permissions.map(permId => {
                  const perm = AVAILABLE_PERMISSIONS.find(p => p.id === permId);
                  return perm ? (
                    <span key={permId} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      {perm.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

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
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
            >
              <Save size={16} className="mr-2" />
              권한 저장
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PermissionsForm; 