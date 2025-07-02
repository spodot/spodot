import { supabase } from '../lib/supabase';
import { RealtimeChannel, REALTIME_LISTEN_TYPES } from '@supabase/supabase-js';
import { showSuccess, showError, showInfo, showWarning, logger } from '../utils/notifications';

// 실시간 이벤트 타입
export interface RealtimeEvent<T = any> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  table: string;
  schema: string;
  commit_timestamp: string;
}

// 실시간 구독 콜백 타입
export type RealtimeCallback<T = any> = (event: RealtimeEvent<T>) => void;

// 실시간 알림 페이로드
export interface RealtimeNotificationPayload {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
}

// 실시간 서비스 클래스 - 임시 비활성화
export class RealtimeService {
  private static instance: RealtimeService;
  private channels = new Map<string, RealtimeChannel>();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3; // 재시도 횟수 줄임
  private reconnectDelay = 2000; // 지연 시간 늘림
  private isShuttingDown = false; // 종료 플래그 추가
  private activeSubscriptions = new Set<string>(); // 활성 구독 추적

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  // 연결 상태 확인
  getConnectionStatus(): boolean {
    return false; // 임시로 항상 false 반환
  }

  // 실시간 알림 구독 (임시 비활성화)
  subscribeToUserNotifications(
    userId: string,
    onNotification: (notification: RealtimeNotificationPayload) => void
  ): () => void {
    logger.info(`실시간 알림 구독 (비활성화됨): ${userId}`);
    return () => {}; // 빈 함수 반환
  }

  // 실시간 작업 변경 구독 (임시 비활성화)
  subscribeToTaskChanges(
    userId: string,
    onTaskChange: RealtimeCallback
  ): () => void {
    logger.info(`작업 변경 구독 (비활성화됨): ${userId}`);
    return () => {}; // 빈 함수 반환
  }

  // 실시간 공지사항 구독 (임시 비활성화)
  subscribeToAnnouncements(
    onAnnouncementChange: RealtimeCallback
  ): () => void {
    logger.info('공지사항 구독 (비활성화됨)');
    return () => {}; // 빈 함수 반환
  }

  // 실시간 일정 변경 구독 (임시 비활성화)
  subscribeToScheduleChanges(
    userId: string,
    onScheduleChange: RealtimeCallback
  ): () => void {
    logger.info(`일정 변경 구독 (비활성화됨): ${userId}`);
    return () => {}; // 빈 함수 반환
  }

  // 브로드캐스트 메시지 구독 (임시 비활성화)
  subscribeToBroadcast(
    channelName: string,
    eventName: string,
    onMessage: (payload: any) => void
  ): () => void {
    logger.info(`브로드캐스트 구독 (비활성화됨): ${channelName}/${eventName}`);
    return () => {}; // 빈 함수 반환
  }

  // 브로드캐스트 메시지 전송 (임시 비활성화)
  async sendBroadcastMessage(
    channelName: string,
    eventName: string,
    payload: any
  ): Promise<void> {
    logger.info(`브로드캐스트 메시지 전송 (비활성화됨): ${channelName}/${eventName}`);
  }

  // 온라인 사용자 추적 (임시 비활성화)
  subscribeToPresence(
    channelName: string,
    userId: string,
    userInfo: { name: string; role: string; avatar?: string },
    onPresenceChange: (presences: Record<string, any>) => void
  ): () => void {
    logger.info(`프레즌스 구독 (비활성화됨): ${channelName}`);
    return () => {}; // 빈 함수 반환
  }

  // 모든 구독 해제 (임시 비활성화)
  unsubscribeAll(): void {
    logger.info('모든 실시간 구독 해제 (비활성화됨)');
  }

  // 연결 상태 확인 (임시 비활성화)
  async checkConnection(): Promise<boolean> {
    return false; // 임시로 항상 false 반환
  }
}

// 싱글톤 인스턴스 export
export const realtimeService = RealtimeService.getInstance(); 