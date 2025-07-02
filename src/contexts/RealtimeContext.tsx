import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { realtimeService, RealtimeNotificationPayload } from '../services/realtimeService';
import { logger } from '../utils/notifications';

// 온라인 사용자 정보
export interface OnlineUser {
  user_id: string;
  name: string;
  role: string;
  avatar?: string;
  online_at: string;
}

// 실시간 컨텍스트 타입
interface RealtimeContextType {
  // 연결 상태
  isConnected: boolean;
  
  // 온라인 사용자 목록
  onlineUsers: Record<string, OnlineUser[]>;
  
  // 실시간 알림 수신 콜백 등록
  subscribeToNotifications: (callback: (notification: RealtimeNotificationPayload) => void) => () => void;
  
  // 브로드캐스트 메시지 전송
  sendMessage: (channelName: string, eventName: string, payload: any) => Promise<void>;
  
  // 채팅 채널 구독
  subscribeToChatChannel: (channelName: string, onMessage: (message: any) => void) => () => void;
  
  // 연결 상태 새로고침
  refreshConnection: () => Promise<void>;
}

// 컨텍스트 생성
const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// 실시간 Provider 컴포넌트
export const RealtimeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser[]>>({});
  
  // 실시간 알림 구독 상태
  const [notificationCallbacks] = useState<Set<(notification: RealtimeNotificationPayload) => void>>(new Set());
  
  // 구독 해제 함수들 저장
  const [unsubscribeFunctions] = useState<Set<() => void>>(new Set());

  // 사용자 인증 상태에 따른 실시간 연결 관리
  useEffect(() => {
    if (user?.id) {
      initializeRealtimeConnections();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [user?.id]);

  // 실시간 연결 초기화 (비활성화)
  const initializeRealtimeConnections = async () => {
    // 실시간 기능 비활성화
    logger.info('실시간 연결 비활성화됨');
    setIsConnected(false);
  };

  // 정리 함수
  const cleanup = () => {
    unsubscribeFunctions.forEach(unsub => unsub());
    unsubscribeFunctions.clear();
    notificationCallbacks.clear();
    setIsConnected(false);
    setOnlineUsers({});
    logger.info('실시간 연결 정리 완료');
  };

  // 실시간 알림 콜백 등록
  const subscribeToNotifications = (callback: (notification: RealtimeNotificationPayload) => void) => {
    notificationCallbacks.add(callback);
    
    // 구독 해제 함수 반환
    return () => {
      notificationCallbacks.delete(callback);
    };
  };

  // 브로드캐스트 메시지 전송
  const sendMessage = async (channelName: string, eventName: string, payload: any) => {
    await realtimeService.sendBroadcastMessage(channelName, eventName, payload);
  };

  // 채팅 채널 구독
  const subscribeToChatChannel = (channelName: string, onMessage: (message: any) => void) => {
    const unsubscribe = realtimeService.subscribeToBroadcast(
      channelName,
      'message',
      onMessage
    );
    
    unsubscribeFunctions.add(unsubscribe);
    return unsubscribe;
  };

  // 연결 상태 새로고침 (비활성화)
  const refreshConnection = async () => {
    // 실시간 기능 비활성화로 인한 더미 함수
    setIsConnected(false);
  };

  // 주기적 연결 상태 확인 비활성화

  const value: RealtimeContextType = {
    isConnected,
    onlineUsers,
    subscribeToNotifications,
    sendMessage,
    subscribeToChatChannel,
    refreshConnection
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
};

// 커스텀 훅
export const useRealtime = (): RealtimeContextType => {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
};

// 개발자용 실시간 상태 디버깅 훅
export const useRealtimeDebug = () => {
  const { isConnected, onlineUsers } = useRealtime();
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      logger.info('실시간 연결 상태:', isConnected);
      logger.info('온라인 사용자 수:', Object.keys(onlineUsers).length);
    }
  }, [isConnected, onlineUsers]);

  return {
    isConnected,
    onlineUsersCount: Object.keys(onlineUsers).length,
    connectionStatus: isConnected ? '연결됨' : '연결 안됨'
  };
}; 