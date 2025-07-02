import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Permission, 
  UserRole, 
  UserPosition,
  hasPermission as checkPermission,
  canModifyData as checkCanModify,
  filterDataByPermission,
  hasElevatedPermission,
  checkPermissionWithReason,
  logPermissionCheck
} from '../types/permissions';

/**
 * 🔐 강화된 권한 시스템 훅
 * 권한 검사와 데이터 필터링을 위한 유틸리티 제공
 */
export const usePermissions = () => {
  const { user } = useAuth();

  // 🛡️ 기본 권한 검사
  const hasPermission = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.some(permission => checkPermission(user.role, permission));
  }, [user]);

  const hasAllPermissions = useCallback((permissions: Permission[]): boolean => {
    if (!user) return false;
    return permissions.every(permission => checkPermission(user.role, permission));
  }, [user]);

  // 🚨 데이터 수정 권한 검사 (보안 강화)
  const canModifyData = useCallback((
    dataType: string, 
    dataOwnerId?: string, 
    itemDepartment?: string, 
    assignedUsers?: string[]
  ): boolean => {
    if (!user) return false;
    
    const result = checkCanModify(
      user.role, 
      dataType, 
      dataOwnerId, 
      user.id, 
      user.department, 
      itemDepartment, 
      assignedUsers
    );

    // 보안 로그 기록
    logPermissionCheck(
      user.id,
      user.role,
      `modify_${dataType}`,
      dataOwnerId || 'unknown',
      result ? 'allowed' : 'denied'
    );

    return result;
  }, [user]);

  // 📊 데이터 필터링 (권한 기반)
  const filterUserData = useCallback(<T extends { 
    created_by?: string; 
    assigned_to?: string | string[]; 
    department?: string; 
    id?: string 
  }>(data: T[], dataType: string): T[] => {
    if (!user) return [];
    
    return filterDataByPermission(
      data, 
      user.role, 
      dataType, 
      user.id, 
      user.department
    );
  }, [user]);

  // 👑 관리자/팀장 권한 검사
  const hasElevatedAccess = useCallback((level: 'team_lead' | 'manager' | 'admin'): boolean => {
    if (!user) return false;
    return hasElevatedPermission(user.role, user.position, level);
  }, [user]);

  // 📝 상세 권한 검사 (이유 포함)
  const checkPermissionWithDetails = useCallback((permission: Permission) => {
    if (!user) return { allowed: false, reason: '로그인이 필요합니다.' };
    return checkPermissionWithReason(user.role, permission, user.position);
  }, [user]);

  // 🎯 역할별 편의 함수들
  const isRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const isPosition = useCallback((position: UserPosition): boolean => {
    return user?.position === position;
  }, [user]);

  const isInDepartment = useCallback((department: string): boolean => {
    return user?.department === department;
  }, [user]);

  // 🔒 특정 작업별 권한 검사
  const canCreateTask = useCallback((): boolean => {
    return hasPermission('tasks.create');
  }, [hasPermission]);

  const canAssignTask = useCallback((): boolean => {
    return hasPermission('tasks.assign') && hasElevatedAccess('manager');
  }, [hasPermission, hasElevatedAccess]);

  const canViewAllTasks = useCallback((): boolean => {
    return hasAnyPermission(['tasks.view_all', 'tasks.view_department']);
  }, [hasAnyPermission]);

  const canManageUsers = useCallback((): boolean => {
    return hasAnyPermission(['users.create', 'users.update', 'users.delete']) && 
           hasElevatedAccess('manager');
  }, [hasAnyPermission, hasElevatedAccess]);

  const canViewReports = useCallback((reportType: 'all' | 'department' | 'own' = 'own'): boolean => {
    switch (reportType) {
      case 'all':
        return hasPermission('reports.view_all');
      case 'department':
        return hasAnyPermission(['reports.view_all', 'reports.view_department']);
      case 'own':
        return hasAnyPermission(['reports.view_all', 'reports.view_department', 'reports.view_own']);
      default:
        return false;
    }
  }, [hasPermission, hasAnyPermission]);

  const canManageMembers = useCallback((): boolean => {
    return hasAnyPermission(['members.view_all', 'members.create', 'members.update']);
  }, [hasAnyPermission]);

  const canManageSchedules = useCallback((): boolean => {
    return hasAnyPermission(['schedules.create', 'schedules.update', 'schedules.view_all']);
  }, [hasAnyPermission]);

  const canViewSales = useCallback((scope: 'all' | 'department' | 'own' = 'own'): boolean => {
    switch (scope) {
      case 'all':
        return hasPermission('sales.view_all');
      case 'department':
        return hasAnyPermission(['sales.view_all', 'sales.view_department']);
      case 'own':
        return hasAnyPermission(['sales.view_all', 'sales.view_department', 'sales.view_own']);
      default:
        return false;
    }
  }, [hasPermission, hasAnyPermission]);

  // 🚫 접근 거부 처리
  const handleAccessDenied = useCallback((reason: string, action: string) => {
    if (user) {
      logPermissionCheck(
        user.id,
        user.role,
        action,
        'system',
        'denied',
        reason
      );
    }
    
    console.warn(`[ACCESS DENIED] ${reason} - Action: ${action}`);
  }, [user]);

  return {
    // 기본 권한 검사
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // 데이터 권한
    canModifyData,
    filterUserData,
    
    // 상급 권한
    hasElevatedAccess,
    checkPermissionWithDetails,
    
    // 역할/직책 확인
    isRole,
    isPosition,
    isInDepartment,
    
    // 작업별 권한
    canCreateTask,
    canAssignTask,
    canViewAllTasks,
    canManageUsers,
    canViewReports,
    canManageMembers,
    canManageSchedules,
    canViewSales,
    
    // 유틸리티
    handleAccessDenied,
    
    // 사용자 정보
    user,
    isLoggedIn: !!user,
    userRole: user?.role,
    userPosition: user?.position,
    userDepartment: user?.department
  };
};

/**
 * 🎯 특정 기능별 권한 훅들
 */
export const useTaskPermissions = () => {
  const { canCreateTask, canAssignTask, canViewAllTasks, canModifyData } = usePermissions();
  
  return {
    canCreate: canCreateTask,
    canAssign: canAssignTask,
    canViewAll: canViewAllTasks,
    canModify: (taskId: string, createdBy?: string, assignedTo?: string[]) => 
      canModifyData('tasks', createdBy, undefined, assignedTo),
  };
};

export const useUserPermissions = () => {
  const { canManageUsers, hasElevatedAccess, canModifyData } = usePermissions();
  
  return {
    canManage: canManageUsers,
    canViewAll: () => hasElevatedAccess('manager'),
    canModify: (userId: string, targetUserDepartment?: string) => 
      canModifyData('users', userId, targetUserDepartment),
  };
};

export const useReportPermissions = () => {
  const { canViewReports, canModifyData, hasPermission } = usePermissions();
  
  return {
    canView: canViewReports,
    canApprove: () => hasPermission('reports.approve'),
    canModify: (reportId: string, createdBy?: string, department?: string) => 
      canModifyData('reports', createdBy, department),
  };
}; 