import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, CheckCircle, AlertCircle, Info, AlertTriangle, 
  X, Check, Trash2, ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useNotification } from '../../contexts/NotificationContext';
import { supabaseApiService } from '../../services/supabaseApi';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

type NotificationType = 'info' | 'warning' | 'success' | 'error';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  userId: string;
}

const NotificationIcon = ({ type }: { type: NotificationType }) => {
  switch (type) {
    case 'success':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case 'info':
    default:
      return <Info className="w-4 h-4 text-blue-500" />;
  }
};

const NotificationItem = ({ notification, onRead, onDelete }: { 
  notification: Notification, 
  onRead: (id: string) => void, 
  onDelete: (id: string) => void 
}) => {
  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { 
    addSuffix: true,
    locale: ko
  });

  const fullDate = format(new Date(notification.createdAt), 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
  
  return (
    <div className={`
      p-3 border-b border-slate-200 
      ${notification.isRead ? 'bg-white' : 'bg-blue-50'}
    `}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          <NotificationIcon type={notification.type} />
        </div>
        <div className="ml-3 flex-1">
          <div className="text-sm font-medium text-slate-900">
            {notification.title}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {notification.message}
          </p>
          <div className="mt-1 flex justify-between items-center">
            <div className="text-xs text-slate-500" title={fullDate}>
              {timeAgo}
            </div>
            <div className="flex space-x-1">
              {!notification.isRead && (
                <button
                  onClick={() => onRead(notification.id)}
                  title="읽음으로 표시"
                  className="p-1 text-blue-500 hover:text-blue-700"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              {notification.link && (
                <Link
                  to={notification.link}
                  title="관련 페이지로 이동"
                  className="p-1 text-blue-500 hover:text-blue-700"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
              <button
                onClick={() => onDelete(notification.id)}
                title="알림 삭제"
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationCenter = () => {
  const { badges } = useNotification();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // 알림 데이터 로드
  const loadNotifications = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await supabaseApiService.notifications.getByUserId(user.id);
      setNotifications(response.data);
    } catch (error) {
      console.error('알림 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    try {
      await supabaseApiService.notifications.markAsRead(notificationId);
      setNotifications(prev => prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ));
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error);
    }
  };

  // 알림 삭제
  const deleteNotification = async (notificationId: string) => {
    try {
      await supabaseApiService.notifications.delete(notificationId);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('알림 삭제 실패:', error);
    }
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await supabaseApiService.notifications.markAllAsRead(user.id);
      setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('모든 알림 읽음 처리 실패:', error);
    }
  };

  // 알림 센터 열릴 때마다 데이터 로드
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, user?.id]);

  // 바깥쪽 클릭 시 알림 센터 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // 알림이 비어 있을 때 보여줄 컴포넌트
  const EmptyNotifications = () => (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <Bell className="h-12 w-12 text-slate-300 mb-4" />
      <h4 className="text-sm font-medium text-slate-900 mb-1">
        알림이 없습니다
      </h4>
      <p className="text-xs text-slate-500">
        새로운 알림이 도착하면 여기에 표시됩니다
      </p>
    </div>
  );

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full text-slate-500 hover:text-slate-600 focus:outline-none"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-white text-xs">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50"
          >
            <div className="p-3 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-medium text-slate-900">
                알림 {notifications.length > 0 && `(${unreadCount}/${notifications.length})`}
              </h3>
              <div className="flex space-x-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))
              ) : (
                <EmptyNotifications />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter; 