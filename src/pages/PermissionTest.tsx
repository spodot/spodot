import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import PermissionGate from '../components/auth/PermissionGate';
import { Shield, User, Eye, Edit, Plus, Settings } from 'lucide-react';

const PermissionTest: React.FC = () => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">로그인이 필요합니다.</p>
        </div>
      </div>
    );
  }

  const testPermissions = [
    { permission: 'tasks.view_assigned', label: '내 업무 보기', icon: Eye },
    { permission: 'tasks.view_department', label: '팀 업무 보기', icon: Eye },
    { permission: 'tasks.create', label: '업무 생성', icon: Plus },
    { permission: 'tasks.update', label: '업무 수정', icon: Edit },
    { permission: 'schedules.view_own', label: '내 일정 보기', icon: Eye },
    { permission: 'schedules.view_department', label: '팀 일정 보기', icon: Eye },
    { permission: 'schedules.create', label: '일정 생성', icon: Plus },
    { permission: 'members.view_own', label: '내 회원 보기', icon: Eye },
    { permission: 'members.view_department', label: '팀 회원 보기', icon: Eye },
    { permission: 'members.create', label: '회원 등록', icon: Plus },
    { permission: 'sales.create', label: '매출 등록', icon: Plus },
    { permission: 'sales.view_own', label: '내 매출 보기', icon: Eye },
    { permission: 'sales.view_department', label: '팀 매출 보기', icon: Eye },
    { permission: 'reports.create', label: '보고서 작성', icon: Plus },
    { permission: 'reports.view_own', label: '내 보고서 보기', icon: Eye },
    { permission: 'announcements.read', label: '공지사항 읽기', icon: Eye },
    { permission: 'announcements.create', label: '공지사항 작성', icon: Plus },
    { permission: 'manuals.read', label: '매뉴얼 읽기', icon: Eye },
    { permission: 'manuals.create', label: '매뉴얼 작성', icon: Plus },
    { permission: 'suggestions.create', label: '건의사항 작성', icon: Plus },
    { permission: 'vending.view_own', label: '자판기 관리', icon: Eye },
    { permission: 'ot.view_assigned', label: 'OT 관리', icon: Eye },
    { permission: 'users.view_all', label: '직원 조회', icon: Eye },
    { permission: 'users.create', label: '직원 등록', icon: Plus },
    { permission: 'admin.settings', label: '시스템 설정', icon: Settings },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-600" />
          권한 시스템 테스트
        </h1>
        <p className="text-gray-600">현재 로그인한 사용자의 권한을 확인합니다.</p>
      </div>

      {/* 사용자 정보 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          현재 사용자 정보
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">이름</label>
            <p className="text-gray-900">{user.name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">이메일</label>
            <p className="text-gray-900">{user.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">역할</label>
            <p className="text-gray-900">{user.role}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">직책</label>
            <p className="text-gray-900">{user.position || '미설정'}</p>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm font-medium text-gray-500">개별 권한</label>
          <p className="text-gray-900">
            {user.permissions && user.permissions.length > 0 
              ? `${user.permissions.length}개 권한: ${user.permissions.join(', ')}`
              : '개별 권한 없음 (역할별 기본 권한만 사용)'
            }
          </p>
        </div>
      </div>

      {/* 권한 테스트 그리드 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">권한 테스트 결과</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testPermissions.map(({ permission, label, icon: Icon }) => {
            const hasAccess = hasPermission(permission as any);
            return (
              <div
                key={permission}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  hasAccess
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${hasAccess ? 'text-green-600' : 'text-red-600'}`} />
                  <div className="flex-1">
                    <p className={`font-medium ${hasAccess ? 'text-green-900' : 'text-red-900'}`}>
                      {label}
                    </p>
                    <p className={`text-sm ${hasAccess ? 'text-green-600' : 'text-red-600'}`}>
                      {permission}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    hasAccess 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {hasAccess ? '허용' : '거부'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PermissionGate 컴포넌트 테스트 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">PermissionGate 컴포넌트 테스트</h2>
        <div className="space-y-4">
          <PermissionGate permission="tasks.view_assigned">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">✅ 내 업무 보기 권한이 있습니다!</p>
            </div>
          </PermissionGate>

          <PermissionGate permission="tasks.create">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800">✅ 업무 생성 권한이 있습니다!</p>
            </div>
          </PermissionGate>

          <PermissionGate permission="users.create">
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-purple-800">✅ 직원 등록 권한이 있습니다!</p>
            </div>
          </PermissionGate>

          <PermissionGate permission="admin.settings">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">✅ 시스템 설정 권한이 있습니다!</p>
            </div>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
};

export default PermissionTest; 