import { motion } from 'framer-motion';
import { Bell, Calendar, CheckCircle, UserPlus, AlertCircle } from 'lucide-react';

// 알림 타입
type NotificationType = 'info' | 'success' | 'warning' | 'schedule' | 'user';

// 알림 데이터
const notificationsData = [
  {
    id: 1,
    type: 'schedule' as NotificationType,
    message: '김철수 트레이너가 내일 일정을 변경했습니다.',
    time: '10분 전',
    read: false
  },
  {
    id: 2,
    type: 'user' as NotificationType,
    message: '새로운 고객 등록: 박지민',
    time: '1시간 전',
    read: false
  },
  {
    id: 3,
    type: 'info' as NotificationType,
    message: '오늘 예정된 PT 세션이 3개 있습니다.',
    time: '3시간 전',
    read: true
  },
  {
    id: 4,
    type: 'success' as NotificationType,
    message: '이번 달 매출 목표 달성 (₩15,000,000)',
    time: '어제',
    read: true
  },
  {
    id: 5,
    type: 'warning' as NotificationType,
    message: '장비 유지보수가 필요합니다: 트레드밀 #3',
    time: '3일 전',
    read: true
  }
];

// 알림 타입별 아이콘
const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'schedule':
      return <Calendar size={18} className="text-blue-500" />;
    case 'user':
      return <UserPlus size={18} className="text-indigo-500" />;
    case 'success':
      return <CheckCircle size={18} className="text-green-500" />;
    case 'warning':
      return <AlertCircle size={18} className="text-yellow-500" />;
    default:
      return <Bell size={18} className="text-slate-500" />;
  }
};

const NotificationsPanel = () => {
  return (
    <div className="space-y-2">
      {notificationsData.map((notification, index) => (
        <motion.div
          key={notification.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.05 }}
          className={`p-3 rounded-lg border ${
            !notification.read 
              ? 'border-blue-200 bg-blue-50' 
              : 'border-slate-200'
          }`}
        >
          <div className="flex">
            <div className="flex-shrink-0 pt-1">
              {getNotificationIcon(notification.type)}
            </div>
            <div className="ml-3 flex-1">
              <p className={`text-sm ${
                !notification.read 
                  ? 'font-medium text-slate-900' 
                  : 'text-slate-700'
              }`}>
                {notification.message}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {notification.time}
              </p>
            </div>
            {!notification.read && (
              <div className="flex-shrink-0">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default NotificationsPanel;