# 알림 시스템 (Notification System)

SpodotSports 애플리케이션의 알림 시스템 구현 및 사용 가이드입니다.

## 개요

알림 시스템은 두 가지 주요 구성 요소로 이루어져 있습니다:

1. **영구 알림 (Persistent Notifications)**: 사용자별로 저장되는 알림으로, 알림 센터에서 확인 가능합니다.
2. **토스트 알림 (Toast Notifications)**: 임시로 표시되는 알림으로, 특정 작업 후 피드백을 제공합니다.

## 주요 구성 요소

### 1. 컨텍스트 및 훅

- **UserContext**: 영구 알림 데이터 관리 및 CRUD 작업 담당
- **NotificationContext**: 토스트 알림 표시 관리
- **useUser()**: 영구 알림 관련 기능에 접근
- **useNotification()**: 토스트 알림 표시 기능에 접근

### 2. 컴포넌트

- **Toast**: 화면 상단에 표시되는 토스트 알림 컴포넌트
- **NotificationCenter**: 헤더에 있는 알림 센터 버튼 및 드롭다운
- **NotificationExample**: 알림 시스템 테스트용 컴포넌트

### 3. 유틸리티

- **notificationUtils.ts**: 다양한 유형의 알림 생성을 도와주는 유틸리티 함수 모음

## 알림 타입

알림은 다음 유형으로 구분됩니다:

- **info**: 일반 정보 알림 (파란색)
- **success**: 성공 알림 (초록색)
- **warning**: 경고 알림 (노란색)
- **error**: 오류 알림 (빨간색)

## 사용 방법

### 1. 토스트 알림 표시하기

토스트 알림은 간단한 피드백을 빠르게 표시할 때 사용합니다.

```typescript
import { useNotification } from '../contexts/NotificationContext';

const MyComponent = () => {
  const { showToast } = useNotification();
  
  const handleSomething = () => {
    // 작업 수행 후
    showToast('success', '저장 완료', '변경사항이 저장되었습니다.');
  };
  
  return (
    <button onClick={handleSomething}>저장</button>
  );
};
```

### 2. 영구 알림 생성하기

영구 알림은 알림 센터에 저장되어 사용자가 나중에 확인할 수 있습니다.

```typescript
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { createNotification } = useUser();
  const { user } = useAuth();
  
  const handleCreateNotification = () => {
    if (!user) return;
    
    createNotification({
      userId: user.id,
      type: 'info',
      title: '알림 제목',
      message: '알림 내용을 여기에 작성합니다.',
      link: '/some-page' // 선택적으로 링크 추가
    });
  };
  
  return (
    <button onClick={handleCreateNotification}>알림 생성</button>
  );
};
```

### 3. 유틸리티 사용하기

유틸리티 함수를 사용하면 일관된 형식의 알림을 쉽게 생성할 수 있습니다.

```typescript
import { useUser } from '../contexts/UserContext';
import { useAuth } from '../contexts/AuthContext';
import { clientNotifications } from '../utils/notificationUtils';

const MyComponent = () => {
  const { createNotification } = useUser();
  const { user } = useAuth();
  
  const handleNewClient = () => {
    if (!user) return;
    
    // 클라이언트 추가 로직...
    
    // 알림 생성
    const notification = clientNotifications.newClientRegistered(
      user.id,
      '신규 고객 이름'
    );
    
    createNotification(notification);
  };
  
  return (
    <button onClick={handleNewClient}>고객 추가</button>
  );
};
```

## 알림 관리

### 알림 읽음 표시

```typescript
import { useUser } from '../contexts/UserContext';

const NotificationItem = ({ notification }) => {
  const { markNotificationAsRead } = useUser();
  
  return (
    <div>
      {/* 알림 내용 */}
      <button onClick={() => markNotificationAsRead(notification.id)}>
        읽음 표시
      </button>
    </div>
  );
};
```

### 모든 알림 읽음 표시

```typescript
import { useUser } from '../contexts/UserContext';

const NotificationList = () => {
  const { markAllNotificationsAsRead } = useUser();
  
  return (
    <div>
      {/* 알림 목록 */}
      <button onClick={markAllNotificationsAsRead}>
        모두 읽음 표시
      </button>
    </div>
  );
};
```

### 알림 삭제

```typescript
import { useUser } from '../contexts/UserContext';

const NotificationItem = ({ notification }) => {
  const { deleteNotification } = useUser();
  
  return (
    <div>
      {/* 알림 내용 */}
      <button onClick={() => deleteNotification(notification.id)}>
        삭제
      </button>
    </div>
  );
};
```

## 확장 및 사용자 정의

### 새로운 알림 유형 추가하기

알림 유틸리티를 확장하려면 `src/utils/notificationUtils.ts` 파일에 새로운 함수를 추가하면 됩니다.

```typescript
export const myNewNotifications = {
  someNewNotification: (userId: string, param1: string): NotificationPayload => ({
    userId,
    type: 'info',
    title: '새 알림 유형',
    message: `${param1}에 대한 새로운 알림입니다.`,
    link: '/some-route'
  })
};
```

## 고려사항

1. **알림 과부하**: 사용자에게 너무 많은 알림을 보내지 않도록 주의하세요.
2. **명확한 메시지**: 알림 메시지는 간결하고 정확해야 합니다.
3. **액션 연결**: 가능하면 알림에 관련 액션(링크)를 연결하여 사용자가 바로 조치를 취할 수 있게 하세요. 