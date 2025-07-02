import { NotificationType } from '../contexts/UserContext';

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * 클라이언트 관련 알림 유틸리티
 */
export const clientNotifications = {
  /**
   * 새 클라이언트 등록 알림
   */
  newClientRegistered: (userId: string, clientName: string): NotificationPayload => ({
    userId,
    type: 'info',
    title: '새 고객 등록',
    message: `${clientName} 고객이 새로 등록되었습니다.`,
    link: '/clients'
  }),

  /**
   * 클라이언트 회원권 만료 임박 알림
   */
  membershipExpiringSoon: (userId: string, clientName: string, daysLeft: number): NotificationPayload => ({
    userId,
    type: 'warning',
    title: '회원권 만료 임박',
    message: `${clientName} 고객의 회원권이 ${daysLeft}일 후 만료됩니다.`,
    link: '/clients'
  }),

  /**
   * 클라이언트 결제 실패 알림
   */
  paymentFailed: (userId: string, clientName: string): NotificationPayload => ({
    userId,
    type: 'error',
    title: '결제 실패',
    message: `${clientName} 고객의 자동 결제가 실패했습니다. 확인이 필요합니다.`,
    link: '/clients'
  })
};

/**
 * 스케줄 관련 알림 유틸리티
 */
export const scheduleNotifications = {
  /**
   * 새 세션 예약 알림
   */
  sessionBooked: (userId: string, clientName: string, date: string, time: string): NotificationPayload => ({
    userId,
    type: 'success',
    title: '세션 예약 완료',
    message: `${clientName} 고객의 세션이 ${date} ${time}에 예약되었습니다.`,
    link: '/schedule'
  }),

  /**
   * 세션 취소 알림
   */
  sessionCancelled: (userId: string, clientName: string, date: string, time: string): NotificationPayload => ({
    userId,
    type: 'warning',
    title: '세션 취소',
    message: `${clientName} 고객의 ${date} ${time} 세션이 취소되었습니다.`,
    link: '/schedule'
  }),

  /**
   * 세션 시작 전 알림
   */
  sessionReminder: (userId: string, clientName: string, timeUntilStart: string): NotificationPayload => ({
    userId,
    type: 'info',
    title: '세션 알림',
    message: `${clientName} 고객과의 세션이 ${timeUntilStart} 후에 시작됩니다.`,
    link: '/schedule'
  })
};

/**
 * 시스템 관련 알림 유틸리티
 */
export const systemNotifications = {
  /**
   * 시스템 유지보수 알림
   */
  maintenance: (userId: string, date: string, time: string): NotificationPayload => ({
    userId,
    type: 'warning',
    title: '시스템 점검 예정',
    message: `시스템 점검이 ${date} ${time}에 예정되어 있습니다. 서비스 이용에 참고해주세요.`,
    link: '/dashboard'
  }),

  /**
   * 새 업데이트 알림
   */
  newUpdate: (userId: string, version: string): NotificationPayload => ({
    userId,
    type: 'info',
    title: '시스템 업데이트',
    message: `애플리케이션이 버전 ${version}으로 업데이트되었습니다. 새로운 기능을 확인해보세요.`,
    link: '/dashboard'
  })
};

/**
 * 작업 관련 알림 유틸리티
 */
export const taskNotifications = {
  /**
   * 새 작업 할당 알림
   */
  taskAssigned: (userId: string, taskTitle: string): NotificationPayload => ({
    userId,
    type: 'info',
    title: '새 작업 할당',
    message: `새 작업이 할당되었습니다: ${taskTitle}`,
    link: '/tasks'
  }),

  /**
   * 작업 마감 임박 알림
   */
  taskDueSoon: (userId: string, taskTitle: string, timeLeft: string): NotificationPayload => ({
    userId,
    type: 'warning',
    title: '작업 마감 임박',
    message: `작업 마감까지 ${timeLeft} 남았습니다: ${taskTitle}`,
    link: '/tasks'
  }),

  /**
   * 작업 완료 알림
   */
  taskCompleted: (userId: string, taskTitle: string, completedBy: string): NotificationPayload => ({
    userId,
    type: 'success',
    title: '작업 완료',
    message: `${completedBy}님이 작업을 완료했습니다: ${taskTitle}`,
    link: '/tasks'
  })
}; 