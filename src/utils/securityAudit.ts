import { UserRole, Permission } from '../types/permissions';

// 🔒 보안 이벤트 타입 정의
export type SecurityEventType = 
  | 'permission_denied'
  | 'unauthorized_access'
  | 'data_access_violation'
  | 'privilege_escalation_attempt'
  | 'suspicious_activity'
  | 'login_attempt'
  | 'password_change'
  | 'role_change'
  | 'permission_change';

export interface SecurityEvent {
  id: string;
  timestamp: Date;
  type: SecurityEventType;
  userId: string;
  userRole: UserRole;
  action: string;
  resource: string;
  result: 'success' | 'denied' | 'error';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  details: {
    ip?: string;
    userAgent?: string;
    requestedPermission?: Permission;
    targetResource?: string;
    reason?: string;
    additionalContext?: Record<string, any>;
  };
}

// 🚨 보안 감사 시스템
export class SecurityAuditSystem {
  private static instance: SecurityAuditSystem;
  private events: SecurityEvent[] = [];
  private listeners: Array<(event: SecurityEvent) => void> = [];
  
  public static getInstance(): SecurityAuditSystem {
    if (!SecurityAuditSystem.instance) {
      SecurityAuditSystem.instance = new SecurityAuditSystem();
    }
    return SecurityAuditSystem.instance;
  }

  // 🔍 보안 이벤트 기록
  public logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    this.events.push(securityEvent);
    this.notifyListeners(securityEvent);
    
    // 콘솔 출력 (개발/프로덕션 구분)
    if (import.meta.env.DEV) {
      this.logToConsole(securityEvent);
    } else {
      this.logToProduction(securityEvent);
    }

    // 위험도가 높은 이벤트 즉시 처리
    if (securityEvent.riskLevel === 'high' || securityEvent.riskLevel === 'critical') {
      this.handleHighRiskEvent(securityEvent);
    }
  }

  // 📊 보안 통계 조회
  public getSecurityStats(timeRange?: { start: Date; end: Date }) {
    let filteredEvents = this.events;
    
    if (timeRange) {
      filteredEvents = this.events.filter(event => 
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      );
    }

    return {
      total: filteredEvents.length,
      byType: this.groupByType(filteredEvents),
      byRisk: this.groupByRisk(filteredEvents),
      byUser: this.groupByUser(filteredEvents),
      deniedAttempts: filteredEvents.filter(e => e.result === 'denied').length,
      suspiciousActivity: filteredEvents.filter(e => e.type === 'suspicious_activity').length
    };
  }

  // 🎯 특정 사용자의 보안 이벤트 조회
  public getUserSecurityEvents(userId: string, limit = 50): SecurityEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // 🚩 의심스러운 활동 탐지
  public detectSuspiciousActivity(userId: string): boolean {
    const recentEvents = this.getUserSecurityEvents(userId, 10);
    const deniedAttempts = recentEvents.filter(e => e.result === 'denied').length;
    
    // 최근 10회 시도 중 5회 이상 거부된 경우
    if (deniedAttempts >= 5) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        userId,
        userRole: 'admin', // 시스템 감지
        action: 'multiple_access_denied',
        resource: 'system',
        result: 'denied',
        riskLevel: 'high',
        details: {
          reason: `${deniedAttempts}회 연속 접근 거부`,
          additionalContext: { recentDeniedCount: deniedAttempts }
        }
      });
      return true;
    }

    return false;
  }

  // 📝 리스너 등록/해제
  public addListener(listener: (event: SecurityEvent) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (event: SecurityEvent) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // 🧹 이벤트 정리 (오래된 로그 삭제)
  public cleanupOldEvents(daysToKeep = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const originalLength = this.events.length;
    this.events = this.events.filter(event => event.timestamp >= cutoffDate);
    
    console.log(`[SECURITY AUDIT] Cleaned up ${originalLength - this.events.length} old security events`);
  }

  // Private 메서드들
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyListeners(event: SecurityEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('[SECURITY AUDIT] Listener error:', error);
      }
    });
  }

  private logToConsole(event: SecurityEvent): void {
    const color = this.getRiskColor(event.riskLevel);
    console.log(
      `%c[SECURITY] ${event.type.toUpperCase()}`,
      `color: ${color}; font-weight: bold;`,
      {
        user: event.userId,
        role: event.userRole,
        action: event.action,
        result: event.result,
        details: event.details
      }
    );
  }

  private logToProduction(event: SecurityEvent): void {
    // 프로덕션 환경에서는 외부 로깅 시스템으로 전송
    // TODO: 실제 보안 로깅 시스템과 연동
    if (event.riskLevel === 'high' || event.riskLevel === 'critical') {
      console.warn('[SECURITY ALERT]', JSON.stringify(event));
    }
  }

  private handleHighRiskEvent(event: SecurityEvent): void {
    // 위험도가 높은 이벤트 즉시 대응
    if (event.riskLevel === 'critical') {
      // 즉시 알림, 계정 잠금 등의 조치
      console.error('[CRITICAL SECURITY EVENT]', event);
      // TODO: 실시간 알림 시스템 연동
    }
  }

  private groupByType(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<SecurityEventType, number>);
  }

  private groupByRisk(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.riskLevel] = (acc[event.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupByUser(events: SecurityEvent[]) {
    return events.reduce((acc, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'low': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#6b7280';
    }
  }
}

// 🛡️ 보안 감사 헬퍼 함수들
export const securityAudit = SecurityAuditSystem.getInstance();

export const logPermissionDenied = (
  userId: string,
  userRole: UserRole,
  permission: Permission,
  resource: string,
  reason?: string
) => {
  securityAudit.logSecurityEvent({
    type: 'permission_denied',
    userId,
    userRole,
    action: `access_${permission}`,
    resource,
    result: 'denied',
    riskLevel: 'medium',
    details: {
      requestedPermission: permission,
      reason
    }
  });
};

export const logUnauthorizedAccess = (
  userId: string,
  userRole: UserRole,
  attemptedResource: string,
  ip?: string
) => {
  securityAudit.logSecurityEvent({
    type: 'unauthorized_access',
    userId,
    userRole,
    action: 'access_attempt',
    resource: attemptedResource,
    result: 'denied',
    riskLevel: 'high',
    details: {
      ip,
      targetResource: attemptedResource
    }
  });
};

export const logDataAccessViolation = (
  userId: string,
  userRole: UserRole,
  dataType: string,
  attemptedAction: string
) => {
  securityAudit.logSecurityEvent({
    type: 'data_access_violation',
    userId,
    userRole,
    action: attemptedAction,
    resource: dataType,
    result: 'denied',
    riskLevel: 'high',
    details: {
      reason: '권한 범위를 벗어난 데이터 접근 시도'
    }
  });
};

// 🎯 개발 환경용 보안 테스트 함수
export const testSecuritySystem = () => {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('Security testing is only available in development mode');
    return;
  }

  console.log('🔒 보안 시스템 테스트 시작...');
  
  // 테스트 이벤트 생성
  logPermissionDenied('test_user', 'reception', 'users.delete', 'user_management', '권한 없음');
  logUnauthorizedAccess('test_user', 'fitness', '/admin/settings', '192.168.1.100');
  logDataAccessViolation('test_user', 'golf', 'reports', 'view_all_reports');

  // 통계 확인
  const stats = securityAudit.getSecurityStats();
  console.log('📊 보안 통계:', stats);
  
  console.log('✅ 보안 시스템 테스트 완료');
}; 