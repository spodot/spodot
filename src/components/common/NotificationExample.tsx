import React from 'react';
import { useUser } from '../../contexts/UserContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  clientNotifications, 
  scheduleNotifications, 
  systemNotifications, 
  taskNotifications 
} from '../../utils/notificationUtils';

const NotificationExample = () => {
  const { createNotification } = useUser();
  const { showToast } = useNotification();
  const { user } = useAuth();

  const handleCreateClientNotification = () => {
    if (!user) return;
    
    const notification = clientNotifications.newClientRegistered(
      user.id, 
      '박지민'
    );
    
    createNotification(notification);
    showToast(notification.type, '알림 생성됨', '새로운 고객 등록 알림이 생성되었습니다.');
  };

  const handleCreateScheduleNotification = () => {
    if (!user) return;
    
    const notification = scheduleNotifications.sessionBooked(
      user.id, 
      '김철수', 
      '2023년 12월 15일', 
      '14:00'
    );
    
    createNotification(notification);
    showToast(notification.type, '알림 생성됨', '새로운 세션 예약 알림이 생성되었습니다.');
  };

  const handleCreateTaskNotification = () => {
    if (!user) return;
    
    const notification = taskNotifications.taskDueSoon(
      user.id, 
      '월간 보고서 작성', 
      '2일'
    );
    
    createNotification(notification);
    showToast(notification.type, '알림 생성됨', '새로운 작업 마감 알림이 생성되었습니다.');
  };

  const handleCreateSystemNotification = () => {
    if (!user) return;
    
    const notification = systemNotifications.maintenance(
      user.id, 
      '2023년 12월 10일', 
      '오전 3:00 ~ 5:00'
    );
    
    createNotification(notification);
    showToast(notification.type, '알림 생성됨', '새로운 시스템 점검 알림이 생성되었습니다.');
  };

  const handleShowToastOnly = () => {
    showToast('info', '토스트 메시지', '이것은 알림 센터에 저장되지 않는 임시 토스트 메시지입니다.', 5000);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-4">알림 시스템 테스트</h2>
      <p className="text-slate-600 mb-6">
        아래 버튼을 클릭하여 다양한 유형의 알림을 생성하고 테스트해보세요.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={handleCreateClientNotification}
          className="btn bg-blue-500 hover:bg-blue-600 text-white"
        >
          고객 알림 생성
        </button>
        
        <button
          onClick={handleCreateScheduleNotification}
          className="btn bg-green-500 hover:bg-green-600 text-white"
        >
          일정 알림 생성
        </button>
        
        <button
          onClick={handleCreateTaskNotification}
          className="btn bg-yellow-500 hover:bg-yellow-600 text-white"
        >
          작업 알림 생성
        </button>
        
        <button
          onClick={handleCreateSystemNotification}
          className="btn bg-red-500 hover:bg-red-600 text-white"
        >
          시스템 알림 생성
        </button>
        
        <button
          onClick={handleShowToastOnly}
          className="btn bg-purple-500 hover:bg-purple-600 text-white"
        >
          토스트만 표시
        </button>
      </div>
    </div>
  );
};

export default NotificationExample; 