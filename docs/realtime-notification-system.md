# 🔔 실시간 알림 시스템 가이드

## 🎯 개요

Spodot 피트니스 관리 시스템에 Supabase Realtime을 활용한 완전한 실시간 알림 시스템이 구현되었습니다. 사용자는 작업 할당, 공지사항, 일정 변경 등의 이벤트를 실시간으로 알림받을 수 있습니다.

## 🏗️ 시스템 아키텍처

### 핵심 컴포넌트

```
🔔 실시간 알림 시스템
├── 📡 RealtimeService (WebSocket 관리)
├── 🎯 RealtimeContext (React Context)
├── 🖥️ RealtimeStatus 컴포넌트들
├── 📊 데이터베이스 트리거 & 함수
└── 🔐 보안 정책 (RLS)
```

### 기술 스택

- **WebSocket**: Supabase Realtime
- **프론트엔드**: React Context + Custom Hooks
- **백엔드**: PostgreSQL Triggers + Functions
- **보안**: Row Level Security (RLS)
- **상태관리**: React Context + useState

## 🚀 주요 기능

### 1. 실시간 알림 수신
- 작업 할당/변경 시 즉시 알림
- 공지사항 등록 시 전체 사용자 알림
- 일정 변경 시 해당 사용자 알림
- 토스트 + 알림센터 동시 표시

### 2. 온라인 사용자 추적
- 현재 접속 중인 사용자 실시간 표시
- 사용자 프로필 및 역할 정보
- 마지막 접속 시간 추적

### 3. 브로드캐스트 메시징
- 실시간 채팅 (향후 확장)
- 긴급 공지 브로드캐스트
- 시스템 알림 전파

### 4. 연결 상태 관리
- 자동 재연결 시스템
- 연결 상태 실시간 표시
- 네트워크 오류 복구

## 💻 사용법

### 1. 기본 설정

#### App.tsx에 Provider 추가
```tsx
import { RealtimeProvider } from './contexts/RealtimeContext';

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        {/* 다른 컴포넌트들 */}
      </RealtimeProvider>
    </AuthProvider>
  );
}
```

#### 실시간 상태 사용
```tsx
import { useRealtime } from '../contexts/RealtimeContext';

function MyComponent() {
  const { isConnected, onlineUsers, subscribeToNotifications } = useRealtime();
  
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      console.log('새 알림:', notification);
      // 커스텀 처리 로직
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div>
      <p>연결 상태: {isConnected ? '연결됨' : '연결 안됨'}</p>
      <p>온라인 사용자: {Object.keys(onlineUsers).length}명</p>
    </div>
  );
}
```

### 2. 헤더에 실시간 상태 표시

```tsx
import { RealtimeStatusBar } from '../components/common/RealtimeStatus';

function Header() {
  return (
    <header>
      <div className="left-section">
        {/* 로고, 메뉴 등 */}
      </div>
      
      <div className="right-section">
        <RealtimeStatusBar />
        <NotificationCenter />
        <UserMenu />
      </div>
    </header>
  );
}
```

### 3. 수동 알림 생성

```tsx
import { realtimeService } from '../services/realtimeService';

// 브로드캐스트 메시지 전송
const sendUrgentMessage = async () => {
  await realtimeService.sendBroadcastMessage(
    'urgent_channel',
    'emergency',
    {
      title: '긴급 공지',
      message: '즉시 대피하세요',
      timestamp: new Date().toISOString()
    }
  );
};

// 특정 채널 구독
const subscribeToChatChannel = () => {
  const unsubscribe = realtimeService.subscribeToBroadcast(
    'chat_general',
    'message',
    (payload) => {
      console.log('새 채팅 메시지:', payload);
    }
  );
  
  return unsubscribe;
};
```

## 🔧 설정 및 커스터마이징

### RealtimeService 설정

```typescript
// src/services/realtimeService.ts
export class RealtimeService {
  private maxReconnectAttempts = 5;  // 재연결 시도 횟수
  private reconnectDelay = 1000;     // 재연결 지연 시간 (ms)
  
  // 설정 변경 가능
  setReconnectOptions(maxAttempts: number, delay: number) {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectDelay = delay;
  }
}
```

### 알림 타입 커스터마이징

```typescript
// 커스텀 알림 타입 추가
export interface CustomNotificationPayload extends RealtimeNotificationPayload {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'user' | 'business';
  actions?: Array<{
    label: string;
    action: string;
  }>;
}
```

## 📊 데이터베이스 스키마

### notifications 테이블

```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type varchar(20) CHECK (type IN ('info', 'success', 'warning', 'error')),
  title varchar(255) NOT NULL,
  message text NOT NULL,
  link varchar(255),
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### 자동 알림 트리거

1. **작업 할당 알림**
   ```sql
   -- 새 작업 할당 시 담당자에게 알림
   -- 작업 재할당 시 새 담당자에게 알림
   ```

2. **작업 상태 변경 알림**
   ```sql
   -- 작업 완료 시 할당자에게 알림
   -- 작업 지연 시 관련자들에게 경고 알림
   ```

3. **공지사항 알림**
   ```sql
   -- 새 공지사항 등록 시 모든 사용자에게 알림
   -- 우선순위에 따른 알림 타입 차등화
   ```

4. **일정 변경 알림**
   ```sql
   -- 새 일정 등록 시 해당 사용자에게 알림
   -- 일정 시간 변경 시 경고 알림
   ```

## 🔐 보안 및 권한

### Row Level Security (RLS)

```sql
-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 업데이트 가능
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
```

### 실시간 채널 보안

- 사용자별 개별 알림 채널: `user_notifications_{userId}`
- 공통 공지사항 채널: `announcement_changes`
- 워크스페이스 프레즌스: `workspace_presence`

## 📈 모니터링 및 분석

### 알림 통계 조회

```sql
-- 타입별 알림 통계
SELECT * FROM notification_stats;

-- 사용자별 알림 통계
SELECT * FROM user_notification_stats;
```

### 실시간 연결 상태 모니터링

```tsx
import { useRealtimeDebug } from '../contexts/RealtimeContext';

function DebugPanel() {
  const { isConnected, onlineUsersCount, connectionStatus } = useRealtimeDebug();
  
  return (
    <div className="debug-panel">
      <h3>실시간 연결 상태</h3>
      <p>상태: {connectionStatus}</p>
      <p>온라인 사용자: {onlineUsersCount}명</p>
    </div>
  );
}
```

## 🎨 UI 컴포넌트

### 1. ConnectionIndicator
연결 상태를 시각적으로 표시

```tsx
<ConnectionIndicator />
// 출력: 🟢 실시간 연결됨 🔄
```

### 2. OnlineUsers
온라인 사용자 목록과 아바타

```tsx
<OnlineUsers />
// 출력: 👥 온라인 3명 [아바타들...]
```

### 3. RealtimeNotificationBadge
실시간 알림 개수 배지

```tsx
<RealtimeNotificationBadge count={5} />
// 출력: 🔴 5
```

### 4. RealtimeDebugPanel (개발용)
개발 환경에서만 표시되는 디버그 패널

```tsx
<RealtimeDebugPanel />
// 개발자 도구로만 접근 가능
```

## 🚀 성능 최적화

### 1. 연결 관리
- 자동 재연결 시스템 (지수 백오프)
- 최대 재연결 시도 제한
- 주기적 연결 상태 확인 (30초)

### 2. 메모리 관리
- 컴포넌트 언마운트 시 자동 구독 해제
- 콜백 함수 Set 관리로 메모리 누수 방지

### 3. 알림 정리
```sql
-- 오래된 알림 자동 정리
SELECT cleanup_old_notifications();
```

## 🛠️ 문제 해결

### 일반적인 문제들

#### 1. 연결이 안 될 때
```typescript
// 연결 상태 확인
const isConnected = await realtimeService.checkConnection();
if (!isConnected) {
  // 수동 재연결
  await realtimeService.refreshConnection();
}
```

#### 2. 알림이 오지 않을 때
```sql
-- Realtime 활성화 확인
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- 알림 테이블 확인
SELECT * FROM notifications WHERE user_id = 'your-user-id' ORDER BY created_at DESC;
```

#### 3. 권한 오류
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'notifications';
```

### 디버깅 도구

1. **브라우저 콘솔**: 실시간 이벤트 로그
2. **RealtimeDebugPanel**: 연결 상태 실시간 모니터링
3. **Supabase Dashboard**: Realtime 로그 확인

## 🔄 업데이트 및 확장

### 새로운 알림 타입 추가

1. **데이터베이스 업데이트**
```sql
-- 새 알림 타입 추가
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('info', 'success', 'warning', 'error', 'urgent'));
```

2. **트리거 함수 추가**
```sql
CREATE OR REPLACE FUNCTION notify_new_event()
RETURNS TRIGGER AS $$
-- 새 이벤트 알림 로직
END;
$$ LANGUAGE plpgsql;
```

3. **프론트엔드 핸들러 추가**
```typescript
// 새 알림 타입 처리
case 'urgent':
  showUrgentNotification(notification.title, notification.message);
  break;
```

### 채팅 시스템 확장

```typescript
// 실시간 채팅 채널 구독
const subscribeToChatChannel = (roomId: string) => {
  return realtimeService.subscribeToBroadcast(
    `chat_room_${roomId}`,
    'message',
    (message) => {
      // 채팅 메시지 처리
      addMessageToRoom(roomId, message);
    }
  );
};

// 채팅 메시지 전송
const sendChatMessage = async (roomId: string, message: string) => {
  await realtimeService.sendBroadcastMessage(
    `chat_room_${roomId}`,
    'message',
    {
      text: message,
      sender: user.id,
      timestamp: new Date().toISOString()
    }
  );
};
```

## 📚 API 레퍼런스

### RealtimeService 메서드

```typescript
class RealtimeService {
  // 사용자 알림 구독
  subscribeToUserNotifications(userId: string, callback: Function): () => void
  
  // 작업 변경 구독
  subscribeToTaskChanges(userId: string, callback: Function): () => void
  
  // 공지사항 구독
  subscribeToAnnouncements(callback: Function): () => void
  
  // 일정 변경 구독
  subscribeToScheduleChanges(userId: string, callback: Function): () => void
  
  // 브로드캐스트 구독
  subscribeToBroadcast(channel: string, event: string, callback: Function): () => void
  
  // 브로드캐스트 전송
  sendBroadcastMessage(channel: string, event: string, payload: any): Promise<void>
  
  // 온라인 사용자 추적
  subscribeToPresence(channel: string, userId: string, userInfo: object, callback: Function): () => void
  
  // 연결 상태 확인
  checkConnection(): Promise<boolean>
  
  // 모든 구독 해제
  unsubscribeAll(): void
}
```

### useRealtime Hook

```typescript
interface RealtimeContextType {
  isConnected: boolean;
  onlineUsers: Record<string, OnlineUser[]>;
  subscribeToNotifications: (callback: Function) => () => void;
  sendMessage: (channel: string, event: string, payload: any) => Promise<void>;
  subscribeToChatChannel: (channel: string, onMessage: Function) => () => void;
  refreshConnection: () => Promise<void>;
}
```

---

## 🎉 결론

실시간 알림 시스템이 완전히 구현되어 사용자는 모든 중요한 이벤트를 실시간으로 알림받을 수 있습니다. 시스템은 확장 가능하며, 새로운 알림 타입이나 기능을 쉽게 추가할 수 있도록 설계되었습니다.

### 주요 달성 사항
- ✅ Supabase Realtime 기반 WebSocket 연결
- ✅ 자동 알림 트리거 시스템
- ✅ 온라인 사용자 추적
- ✅ 브로드캐스트 메시징
- ✅ 자동 재연결 및 오류 복구
- ✅ 완전한 보안 정책 (RLS)
- ✅ 개발자 친화적 디버깅 도구

이제 피트니스 센터 관리 시스템에서 모든 사용자가 실시간으로 소통하고 업무를 효율적으로 처리할 수 있습니다! 🚀 