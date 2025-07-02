import { ReactNode } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, UserRole } from '../../types/permissions';

interface PermissionGateProps {
  children: ReactNode;
  permission?: Permission | Permission[];
  role?: UserRole | UserRole[];
  fallback?: ReactNode;
  showIf?: 'any' | 'all'; // 'any': 하나라도 만족하면 표시, 'all': 모두 만족해야 표시
}

/**
 * 권한 기반 UI 렌더링 컴포넌트
 * 사용자의 권한에 따라 UI 요소를 조건부로 표시합니다.
 */
const PermissionGate = ({ 
  children, 
  permission, 
  role, 
  fallback = null,
  showIf = 'any'
}: PermissionGateProps) => {
  const { user, hasPermission } = useAuth();

  // 사용자가 로그인하지 않은 경우
  if (!user) {
    return <>{fallback}</>;
  }

  // 권한과 역할이 모두 지정되지 않은 경우 항상 표시
  if (!permission && !role) {
    return <>{children}</>;
  }

  let hasRequiredPermission = true;
  let hasRequiredRole = true;

  // 권한 검사 (권한이 지정된 경우만)
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    
    if (showIf === 'all') {
      hasRequiredPermission = permissions.every(p => hasPermission(p));
    } else {
      hasRequiredPermission = permissions.some(p => hasPermission(p));
    }
  }

  // 역할 검사 (역할이 지정된 경우만)
  if (role) {
    const roles = Array.isArray(role) ? role : [role];
    
    if (showIf === 'all') {
      hasRequiredRole = roles.every(r => user.role === r);
    } else {
      hasRequiredRole = roles.some(r => user.role === r);
    }
  }

  // 조건 결합: 권한과 역할이 모두 지정된 경우 둘 다 만족해야 함
  let shouldShow = true;
  
  if (permission && role) {
    // 권한과 역할이 모두 지정된 경우: 둘 다 만족해야 함
    shouldShow = hasRequiredPermission && hasRequiredRole;
  } else if (permission) {
    // 권한만 지정된 경우: 권한만 확인
    shouldShow = hasRequiredPermission;
  } else if (role) {
    // 역할만 지정된 경우: 역할만 확인
    shouldShow = hasRequiredRole;
  }

  return shouldShow ? <>{children}</> : <>{fallback}</>;
};

export default PermissionGate;

// 편의 컴포넌트들 (부서별 역할 시스템)
export const AdminOnly = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate role="admin" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const ReceptionOnly = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate role={['admin', 'reception']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const FitnessOnly = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate role={['admin', 'fitness']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const TennisOnly = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate role={['admin', 'tennis']} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const GolfOnly = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate role={['admin', 'golf']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// 운영팀 (리셉션 + 관리자)
export const OperationTeam = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate role={['admin', 'reception']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// 트레이닝팀 (피트니스, 테니스, 골프)
export const TrainingTeam = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate role={['admin', 'fitness', 'tennis', 'golf']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// 특정 권한 기반 컴포넌트들
export const CanCreateTasks = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate permission="tasks.create" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CanViewAllTasks = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate permission={['tasks.view_all', 'tasks.view_department']} showIf="any" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CanManageUsers = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate permission={['users.create', 'users.update', 'users.delete']} showIf="any" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CanManageAnnouncements = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate permission="announcements.create" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CanManageMembers = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate permission={['members.view_all', 'members.view_department']} showIf="any" fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CanManageSchedules = ({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGate permission={['schedules.view_all', 'schedules.view_department']} showIf="any" fallback={fallback}>
    {children}
  </PermissionGate>
); 