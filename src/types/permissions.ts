// 🔐 권한 관리 시스템 정의 - 부서별 역할 시스템

// 사용자 역할 정의 (부서별)
export type UserRole = 'admin' | 'reception' | 'fitness' | 'tennis' | 'golf';

// 세부 직책 정의 (각 부서에서 사용 가능)
export type UserPosition = 
  | '팀장' | '부팀장' | '매니저' | '과장' | '임원'
  | '시니어 트레이너' | '트레이너' | '퍼스널 트레이너' | '인턴 트레이너'
  | '리셉션 매니저' | '리셉션 직원'
  | '코치' | '테니스 코치' | '어시스턴트 코치'
  | '프로' | '골프 프로' | '어시스턴트 프로'
  | '사원' | '인턴';

// 권한 카테고리별 세부 권한 정의
export type Permission = 
  // 사용자 관리
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.delete'
  | 'users.view_all'
  | 'users.view_department'
  | 'users.view_own'
  
  // 업무 관리
  | 'tasks.create'
  | 'tasks.read'
  | 'tasks.update'
  | 'tasks.delete'
  | 'tasks.assign'
  | 'tasks.view_all'
  | 'tasks.view_department'
  | 'tasks.view_assigned'
  | 'tasks.view_own'
  | 'tasks.comment'
  
  // 공지사항 관리
  | 'announcements.create'
  | 'announcements.read'
  | 'announcements.update'
  | 'announcements.delete'
  | 'announcements.publish'
  
  // 보고서 관리
  | 'reports.create'
  | 'reports.read'
  | 'reports.update'
  | 'reports.delete'
  | 'reports.view_all'
  | 'reports.view_department'
  | 'reports.view_own'
  | 'reports.approve'
  
  // 매출 관리
  | 'sales.create'
  | 'sales.read'
  | 'sales.update'
  | 'sales.delete'
  | 'sales.view_all'
  | 'sales.view_department'
  | 'sales.view_own'
  
  // 회원 관리
  | 'members.create'
  | 'members.read'
  | 'members.update'
  | 'members.delete'
  | 'members.view_all'
  | 'members.view_department'
  | 'members.view_assigned'
  
  // 고객 관리
  | 'customers.create'
  | 'customers.read'
  | 'customers.update'
  | 'customers.delete'
  | 'customers.view_all'
  | 'customers.view_department'
  
  // 트레이너 관리
  | 'trainers.create'
  | 'trainers.read'
  | 'trainers.update'
  | 'trainers.delete'
  | 'trainers.view_all'
  | 'trainers.view_department'
  
  // 일정 관리
  | 'schedules.create'
  | 'schedules.read'
  | 'schedules.update'
  | 'schedules.delete'
  | 'schedules.view_all'
  | 'schedules.view_department'
  | 'schedules.view_own'
  
  // OT 관리
  | 'ot.create'
  | 'ot.read'
  | 'ot.update'
  | 'ot.delete'
  | 'ot.assign'
  | 'ot.view_all'
  | 'ot.view_assigned'
  | 'ot.progress_update'
  
  // 패스 관리
  | 'pass.create'
  | 'pass.read'
  | 'pass.update'
  | 'pass.delete'
  | 'pass.view_all'
  
  // 자판기 관리
  | 'vending.create'
  | 'vending.read'
  | 'vending.update'
  | 'vending.view_all'
  | 'vending.view_own'
  
  // 건의사항
  | 'suggestions.create'
  | 'suggestions.read'
  | 'suggestions.update'
  | 'suggestions.delete'
  | 'suggestions.respond'
  | 'suggestions.view_all'
  | 'suggestions.view_own'
  
  // 매뉴얼
  | 'manuals.read'
  | 'manuals.create'
  | 'manuals.update'
  | 'manuals.delete'
  
  // 관리 기능
  | 'admin.dashboard'
  | 'admin.settings'
  | 'admin.logs'
  | 'admin.backup'
  | 'admin.task_management'
  | 'admin.announcements'
  | 'admin.reports'
  | 'admin.suggestions'
  
  // 알림 관리
  | 'notifications.send'
  | 'notifications.manage';

// 부서별 권한 매핑
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // 관리자는 모든 권한 보유
    'users.create', 'users.read', 'users.update', 'users.delete', 'users.view_all',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.delete', 'tasks.assign', 'tasks.view_all', 'tasks.view_assigned', 'tasks.view_own', 'tasks.comment',
    'announcements.create', 'announcements.read', 'announcements.update', 'announcements.delete', 'announcements.publish',
    'reports.create', 'reports.read', 'reports.update', 'reports.delete', 'reports.view_all', 'reports.approve',
    'sales.create', 'sales.read', 'sales.update', 'sales.delete', 'sales.view_all', 'sales.view_own',
    'members.create', 'members.read', 'members.update', 'members.delete', 'members.view_all',
    'customers.create', 'customers.read', 'customers.update', 'customers.delete', 'customers.view_all',
    'trainers.create', 'trainers.read', 'trainers.update', 'trainers.delete', 'trainers.view_all',
    'schedules.create', 'schedules.read', 'schedules.update', 'schedules.delete', 'schedules.view_all',
    'ot.create', 'ot.read', 'ot.update', 'ot.delete', 'ot.assign', 'ot.view_all', 'ot.view_assigned', 'ot.progress_update',
    'pass.create', 'pass.read', 'pass.update', 'pass.delete', 'pass.view_all',
    'vending.create', 'vending.read', 'vending.update', 'vending.view_all', 'vending.view_own',
    'suggestions.create', 'suggestions.read', 'suggestions.update', 'suggestions.delete', 'suggestions.respond', 'suggestions.view_all', 'suggestions.view_own',
    'manuals.read', 'manuals.create', 'manuals.update', 'manuals.delete',
    'admin.dashboard', 'admin.settings', 'admin.logs', 'admin.backup', 'admin.task_management', 'admin.announcements', 'admin.reports', 'admin.suggestions',
    'notifications.send', 'notifications.manage'
  ],
  
  reception: [
    // 리셉션팀: 회원 관리, 일정 관리, 매출 관리, OT 배정 중심
    'users.view_own',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.view_department', 'tasks.view_assigned', 'tasks.comment',
    'announcements.read',
    'reports.create', 'reports.read', 'reports.view_department', 'reports.view_own',
    'sales.create', 'sales.read', 'sales.update', 'sales.view_all',
    'members.create', 'members.read', 'members.update', 'members.view_all',
    'customers.read', 'customers.update', 'customers.view_all',
    'trainers.read', 'trainers.view_all',
    'schedules.create', 'schedules.read', 'schedules.update', 'schedules.view_all',
    'ot.create', 'ot.read', 'ot.update', 'ot.assign', 'ot.view_all', 'ot.view_assigned', 'ot.progress_update',
    'pass.create', 'pass.read', 'pass.update', 'pass.view_all',
    'vending.create', 'vending.read', 'vending.update', 'vending.view_all', 'vending.view_own',
    'suggestions.create', 'suggestions.read', 'suggestions.view_own',
    'manuals.read'
  ],
  
  fitness: [
    // 피트니스팀: 회원 운동 관리, 개인 트레이닝, OT 진행
    'users.view_own',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.view_department', 'tasks.view_assigned', 'tasks.comment',
    'announcements.read',
    'reports.create', 'reports.read', 'reports.view_department', 'reports.view_own',
    'sales.create', 'sales.read', 'sales.view_department', 'sales.view_own',
    'members.read', 'members.update', 'members.view_department', 'members.view_assigned',
    'schedules.create', 'schedules.read', 'schedules.update', 'schedules.view_department', 'schedules.view_own',
    'ot.read', 'ot.view_assigned', 'ot.progress_update',
    'vending.create', 'vending.read', 'vending.view_own',
    'suggestions.create', 'suggestions.read', 'suggestions.view_own',
    'manuals.read'
  ],
  
  tennis: [
    // 테니스팀: 테니스 레슨, 코트 관리
    'users.view_own',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.view_department', 'tasks.view_assigned', 'tasks.comment',
    'announcements.read',
    'reports.create', 'reports.read', 'reports.view_department', 'reports.view_own',
    'sales.create', 'sales.read', 'sales.view_department', 'sales.view_own',
    'members.read', 'members.update', 'members.view_department', 'members.view_assigned',
    'schedules.create', 'schedules.read', 'schedules.update', 'schedules.view_department', 'schedules.view_own',
    'ot.read', 'ot.view_assigned', 'ot.progress_update',
    'vending.create', 'vending.read', 'vending.view_own',
    'suggestions.create', 'suggestions.read', 'suggestions.view_own',
    'manuals.read'
  ],
  
  golf: [
    // 골프팀: 골프 레슨, 연습장 관리
    'users.view_own',
    'tasks.create', 'tasks.read', 'tasks.update', 'tasks.view_department', 'tasks.view_assigned', 'tasks.comment',
    'announcements.read',
    'reports.create', 'reports.read', 'reports.view_department', 'reports.view_own',
    'sales.create', 'sales.read', 'sales.view_department', 'sales.view_own',
    'members.read', 'members.update', 'members.view_department', 'members.view_assigned',
    'schedules.create', 'schedules.read', 'schedules.update', 'schedules.view_department', 'schedules.view_own',
    'ot.read', 'ot.view_assigned', 'ot.progress_update',
    'vending.create', 'vending.read', 'vending.view_own',
    'suggestions.create', 'suggestions.read', 'suggestions.view_own',
    'manuals.read'
  ]
};

// 페이지별 필요 권한 정의
export const pagePermissions: Record<string, Permission[]> = {
  '/dashboard': [],
  '/dashboard/my-tasks': ['tasks.view_assigned', 'tasks.view_own'],
  '/dashboard/all-tasks': ['tasks.view_all', 'tasks.view_department'],
  '/dashboard/admin/tasks': ['tasks.view_all', 'tasks.assign'],
  '/dashboard/admin/staff': ['users.view_all', 'users.create', 'users.update'],
  '/dashboard/admin/announcements': ['announcements.create', 'announcements.update', 'announcements.delete'],
  '/dashboard/admin/suggestions': ['admin.dashboard', 'suggestions.view_all'],
  '/dashboard/sales-report': ['sales.view_all', 'sales.view_department'],
  '/dashboard/sales-report-user': ['sales.view_own'],
  '/dashboard/sales-entry': ['sales.create'],
  '/dashboard/sales-report-create': ['reports.create', 'sales.view_department', 'sales.view_own'],
  '/dashboard/members': ['members.view_all', 'members.view_department'],
  '/dashboard/daily-report': ['reports.create', 'reports.view_own'],
  '/dashboard/customer/list': ['members.view_all'],
  '/dashboard/schedules': ['schedules.view_all', 'schedules.view_department', 'schedules.view_own'],
  '/dashboard/ot-assignment': ['ot.view_all', 'ot.view_assigned', 'ot.assign'],
  '/dashboard/pass-management': ['pass.view_all', 'pass.create'],
  '/dashboard/vending-sales': ['vending.create', 'vending.view_all', 'vending.view_own'],
  '/dashboard/announcements': ['announcements.read'],
  '/dashboard/manuals': ['manuals.read'],
  '/dashboard/suggestions': ['suggestions.create', 'suggestions.read', 'suggestions.view_own']
};

// 데이터 접근 레벨 정의
export type DataAccessLevel = 'all' | 'department' | 'assigned' | 'own' | 'none';

// 부서별 데이터 접근 레벨
export const roleDataAccess: Record<UserRole, Record<string, DataAccessLevel>> = {
  admin: {
    users: 'all',
    tasks: 'all',
    reports: 'all',
    sales: 'all',
    members: 'all',
    announcements: 'all',
    schedules: 'all',
    ot: 'all',
    pass: 'all',
    vending: 'all',
    suggestions: 'all',
    manuals: 'all'
  },
  reception: {
    users: 'own',
    tasks: 'department',
    reports: 'department',
    sales: 'all',
    members: 'all',
    announcements: 'all',
    schedules: 'all',
    ot: 'all',
    pass: 'all',
    vending: 'all',
    suggestions: 'own',
    manuals: 'all'
  },
  fitness: {
    users: 'own',
    tasks: 'department',
    reports: 'department',
    sales: 'department',
    members: 'department',
    announcements: 'all',
    schedules: 'department',
    ot: 'assigned',
    pass: 'none',
    vending: 'own',
    suggestions: 'own',
    manuals: 'all'
  },
  tennis: {
    users: 'own',
    tasks: 'department',
    reports: 'department',
    sales: 'department',
    members: 'department',
    announcements: 'all',
    schedules: 'department',
    ot: 'assigned',
    pass: 'none',
    vending: 'own',
    suggestions: 'own',
    manuals: 'all'
  },
  golf: {
    users: 'own',
    tasks: 'department',
    reports: 'department',
    sales: 'department',
    members: 'department',
    announcements: 'all',
    schedules: 'department',
    ot: 'assigned',
    pass: 'none',
    vending: 'own',
    suggestions: 'own',
    manuals: 'all'
  }
};

// 권한 검사 유틸리티 함수들
export const hasPermission = (userRole: UserRole, permission: Permission): boolean => {
  return rolePermissions[userRole]?.includes(permission) || false;
};

export const hasPageAccess = (userRole: UserRole, pathname: string): boolean => {
  const requiredPermissions = pagePermissions[pathname];
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true; // 권한이 필요하지 않은 페이지
  }
  
  return requiredPermissions.some(permission => hasPermission(userRole, permission));
};

export const getDataAccessLevel = (userRole: UserRole, dataType: string): DataAccessLevel => {
  return roleDataAccess[userRole]?.[dataType] || 'none';
};

export const canModifyData = (userRole: UserRole, dataType: string, dataOwnerId?: string, currentUserId?: string, userDepartment?: string, itemDepartment?: string, assignedUsers?: string[]): boolean => {
  const accessLevel = getDataAccessLevel(userRole, dataType);
  
  switch (accessLevel) {
    case 'all':
      return true;
      
    case 'department':
      // 부서 정보를 활용한 엄격한 검사
      if (!userDepartment) return false;
      
      // 관리자는 모든 부서 데이터 접근 가능
      if (userRole === 'admin') return true;
      
      // 같은 부서만 접근 가능
      if (itemDepartment) {
        return userDepartment === itemDepartment;
      }
      
      // 부서 정보가 없는 경우 소유자 기반 검사
      return dataOwnerId === currentUserId;
      
    case 'assigned':
      // 배정된 데이터인지 엄격한 검사
      if (!currentUserId) return false;
      
      // 배정된 사용자 목록이 있는 경우
      if (assignedUsers && Array.isArray(assignedUsers)) {
        return assignedUsers.includes(currentUserId);
      }
      
      // 배정 정보가 없으면 소유자인지 확인
      return dataOwnerId === currentUserId;
      
    case 'own':
      // 본인 소유 데이터만 접근 가능
      if (!currentUserId || !dataOwnerId) return false;
      return dataOwnerId === currentUserId;
      
    case 'none':
    default:
      return false;
  }
};

// 🔐 보안 강화된 데이터 필터링 함수
export const filterDataByPermission = <T extends { 
  created_by?: string; 
  assigned_to?: string | string[]; 
  department?: string; 
  id?: string 
}>(
  data: T[], 
  userRole: UserRole, 
  dataType: string, 
  currentUserId: string, 
  userDepartment?: string
): T[] => {
  const accessLevel = getDataAccessLevel(userRole, dataType);
  
  switch (accessLevel) {
    case 'all':
      return data;
      
    case 'department':
      if (userRole === 'admin') return data;
      if (!userDepartment) return [];
      
      return data.filter(item => {
        // 부서 정보가 있으면 부서로 필터링
        if (item.department) {
          return item.department === userDepartment;
        }
        // 부서 정보가 없으면 생성자 기준
        return item.created_by === currentUserId;
      });
      
    case 'assigned':
      return data.filter(item => {
        // 배정된 사용자 확인
        if (item.assigned_to) {
          if (Array.isArray(item.assigned_to)) {
            return item.assigned_to.includes(currentUserId);
          }
          return item.assigned_to === currentUserId;
        }
        // 배정 정보가 없으면 생성자 확인
        return item.created_by === currentUserId;
      });
      
    case 'own':
      return data.filter(item => item.created_by === currentUserId);
      
    case 'none':
    default:
      return [];
  }
};

// 🛡️ 특별 권한 검사 (관리자, 팀장 등)
export const hasElevatedPermission = (
  userRole: UserRole, 
  userPosition: UserPosition | undefined, 
  requiredLevel: 'team_lead' | 'manager' | 'admin'
): boolean => {
  // 관리자는 모든 권한 보유
  if (userRole === 'admin') return true;
  
  switch (requiredLevel) {
    case 'admin':
      return userRole === 'admin';
      
    case 'manager':
      if (userRole === 'admin') return true;
      return userPosition !== undefined && ['팀장', '부팀장', '매니저', '리셉션 매니저'].includes(userPosition);
             
    case 'team_lead':
      if (userRole === 'admin') return true;
      return userPosition !== undefined && canManageTeam(userPosition);
             
    default:
      return false;
  }
};

// 🔍 권한 검사 결과와 이유를 반환하는 상세 함수
export const checkPermissionWithReason = (
  userRole: UserRole, 
  permission: Permission, 
  userPosition?: UserPosition
): { allowed: boolean; reason: string } => {
  // 기본 권한 검사
  const hasBasicPermission = hasPermission(userRole, permission);
  
  if (!hasBasicPermission) {
    return {
      allowed: false,
      reason: `${departmentNames[userRole]} 부서에서는 '${permission}' 권한이 없습니다.`
    };
  }
  
  // 특별 권한이 필요한 경우 추가 검사
  const adminOnlyPermissions: Permission[] = [
    'users.create', 'users.delete', 'announcements.delete', 
    'reports.approve', 'admin.settings', 'admin.logs', 'admin.backup'
  ];
  
  if (adminOnlyPermissions.includes(permission) && userRole !== 'admin') {
    return {
      allowed: false,
      reason: `'${permission}' 권한은 관리자만 사용할 수 있습니다.`
    };
  }
  
  // 팀장급 권한이 필요한 경우
  const managerPermissions: Permission[] = [
    'users.update', 'tasks.assign', 'ot.assign', 'notifications.send'
  ];
  
  if (managerPermissions.includes(permission)) {
    const hasManagerLevel = hasElevatedPermission(userRole, userPosition, 'manager');
    if (!hasManagerLevel) {
      return {
        allowed: false,
        reason: `'${permission}' 권한은 팀장 이상만 사용할 수 있습니다.`
      };
    }
  }
  
  return {
    allowed: true,
    reason: '권한이 확인되었습니다.'
  };
};

// 🔒 보안 감사를 위한 권한 로깅 함수
export const logPermissionCheck = (
  userId: string,
  userRole: UserRole,
  action: string,
  resource: string,
  result: 'allowed' | 'denied',
  reason?: string
): void => {
  // 프로덕션 환경에서는 보안 로그 시스템으로 전송
  if (import.meta.env.PROD) {
    // TODO: 실제 보안 로그 시스템 연동
    console.warn(`[SECURITY] ${result.toUpperCase()}: User ${userId} (${userRole}) attempted ${action} on ${resource}. Reason: ${reason || 'N/A'}`);
  } else {
    // 개발 환경에서는 디버그 로그
    console.log(`[PERMISSION] ${result}: ${userId} (${userRole}) -> ${action} on ${resource}`);
  }
};

// 부서별 한글 이름 매핑
export const departmentNames: Record<UserRole, string> = {
  admin: '관리자',
  reception: '리셉션',
  fitness: '피트니스',
  tennis: '테니스',
  golf: '골프'
};

// 직책별 한글 이름과 권한 레벨 정의
export const positionInfo: Record<UserPosition, { name: string; level: number; canManageTeam: boolean }> = {
  '임원': { name: '임원', level: 6, canManageTeam: true },
  '팀장': { name: '팀장', level: 5, canManageTeam: true },
  '부팀장': { name: '부팀장', level: 4, canManageTeam: true },
  '매니저': { name: '매니저', level: 4, canManageTeam: true },
  '과장': { name: '과장', level: 3, canManageTeam: true },
  '리셉션 매니저': { name: '리셉션 매니저', level: 4, canManageTeam: true },
  '시니어 트레이너': { name: '시니어 트레이너', level: 3, canManageTeam: false },
  '트레이너': { name: '트레이너', level: 2, canManageTeam: false },
  '퍼스널 트레이너': { name: '퍼스널 트레이너', level: 2, canManageTeam: false },
  '코치': { name: '코치', level: 2, canManageTeam: false },
  '테니스 코치': { name: '테니스 코치', level: 2, canManageTeam: false },
  '프로': { name: '프로', level: 3, canManageTeam: false },
  '골프 프로': { name: '골프 프로', level: 3, canManageTeam: false },
  '리셉션 직원': { name: '리셉션 직원', level: 2, canManageTeam: false },
  '어시스턴트 코치': { name: '어시스턴트 코치', level: 1, canManageTeam: false },
  '어시스턴트 프로': { name: '어시스턴트 프로', level: 1, canManageTeam: false },
  '인턴 트레이너': { name: '인턴 트레이너', level: 1, canManageTeam: false },
  '사원': { name: '사원', level: 2, canManageTeam: false },
  '인턴': { name: '인턴', level: 1, canManageTeam: false }
};

// 직책에 따른 추가 권한 검사
export const hasPositionPermission = (position: UserPosition | undefined, requiredLevel: number): boolean => {
  if (!position) return false;
  const posInfo = positionInfo[position];
  return posInfo ? posInfo.level >= requiredLevel : false;
};

export const canManageTeam = (position: UserPosition | undefined): boolean => {
  if (!position) return false;
  const posInfo = positionInfo[position];
  return posInfo ? posInfo.canManageTeam : false;
}; 