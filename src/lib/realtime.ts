import { supabase } from './supabase';

// 실시간 테이블 변경 구독 타입
export type RealtimePayload<T> = {
  new: T;
  old: T | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
};

// 실시간 구독 옵션
export interface SubscriptionOptions {
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

// 실시간 채널 추적
const activeChannels: Map<string, any> = new Map();

/**
 * 테이블 변경사항 실시간 구독
 */
export function subscribeToTable<T extends Record<string, any>>(
  tableName: string,
  callback: (payload: RealtimePayload<T>) => void,
  options: SubscriptionOptions = { event: '*' }
): () => void {
  const { event = '*', filter } = options;
  const channelId = `${tableName}:${event}:${filter || 'all'}`;
  
  // 실제 Supabase 연동 시 여기에 실제 구독 로직 구현
  console.log(`구독 시작: ${channelId}`);
  
  // 채널 객체
  const channel = {
    unsubscribe: () => console.log(`구독 해제: ${channelId}`)
  };
  
  // 구독 추적
  activeChannels.set(channelId, channel);
  
  // 구독 해제 함수 반환
  return () => unsubscribeFromChannel(channelId);
}

/**
 * 특정 채널 구독 해제
 */
function unsubscribeFromChannel(channelId: string): void {
  const channel = activeChannels.get(channelId);
  if (channel) {
    channel.unsubscribe();
    activeChannels.delete(channelId);
  }
}

/**
 * 모든 실시간 구독 해제
 */
export function unsubscribeAll(): void {
  activeChannels.forEach((channel, id) => {
    channel.unsubscribe();
  });
  activeChannels.clear();
} 