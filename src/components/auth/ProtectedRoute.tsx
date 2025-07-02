import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Permission, UserRole } from '../../types/permissions';
import { showError } from '../../utils/notifications';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: Permission | Permission[];
  redirectTo?: string;
  showAccessDenied?: boolean;
}

/**
 * 🛡️ 보안 강화된 라우트 보호 컴포넌트
 * 권한과 역할을 검사하여 라우트 접근을 제어합니다.
 */
const ProtectedRoute = ({ 
  children, 
  requiredPermission,
  requiredRole,
  redirectTo = '/dashboard',
  showAccessDenied = true
}: ProtectedRouteProps) => {
  const { user, hasPermission, hasAnyPermission, checkPermissionWithDetails } = useAuth();

  // 로그인하지 않은 사용자
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 역할 검사
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const hasRequiredRole = roles.includes(user.role);
    
    if (!hasRequiredRole) {
      if (showAccessDenied) {
        showError(`이 페이지는 ${roles.join(', ')} 권한이 필요합니다.`);
      }
      return <Navigate to={redirectTo} replace />;
    }
  }

  // 권한 검사 (상세한 권한 검사 포함)
  if (requiredPermission) {
    const permissions = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
    
    // 하나라도 권한이 있으면 통과
    const hasRequiredPermission = hasAnyPermission(permissions);
    
    if (!hasRequiredPermission) {
      // 상세한 권한 검사로 구체적인 이유 제공
      const permissionCheck = checkPermissionWithDetails(permissions[0]);
      
      if (showAccessDenied) {
        showError(permissionCheck.reason);
      }
      
      // 보안 로그 기록
      console.warn(`[SECURITY] Access denied for user ${user.id} (${user.role}) to permission ${permissions.join(', ')}`);
      
      return <Navigate to={redirectTo} replace />;
    }
  }

  console.log(`✅ ProtectedRoute: 접근 허용 - ${location.pathname} (역할: ${user.role})`);
  return <>{children}</>;
};

// 권한 없음 컴포넌트
const UnauthorizedComponent = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <ShieldX className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">접근 권한이 없습니다</h1>
          <p className="text-slate-600 mb-6">
            현재 사용자 권한({user?.role})으로는 이 페이지에 접근할 수 없습니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              이전 페이지로 돌아가기
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              대시보드로 이동
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProtectedRoute;

// 🚨 특별 보호 컴포넌트들 (높은 보안 수준 필요)
export const AdminOnlyRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

export const ManagerOnlyRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute 
    requiredRole={['admin']}
    requiredPermission={['users.update', 'tasks.assign']}
  >
    {children}
  </ProtectedRoute>
);

export const StaffManagementRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute 
    requiredPermission={['users.view_all', 'users.create', 'users.update']}
  >
    {children}
  </ProtectedRoute>
);

export const TaskManagementRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute 
    requiredPermission={['tasks.view_all', 'tasks.assign']}
  >
    {children}
  </ProtectedRoute>
);

export const ReportManagementRoute = ({ children }: { children: ReactNode }) => (
  <ProtectedRoute 
    requiredPermission={['reports.view_all', 'reports.approve']}
  >
    {children}
  </ProtectedRoute>
);