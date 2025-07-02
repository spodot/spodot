import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell } from 'lucide-react';

// 공지사항 인터페이스
export interface Announcement {
  id: string;
  message: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
  expiresAt?: string;
  priority: 'low' | 'medium' | 'high';
  link?: string;
}

interface AnnouncementProps {
  announcements: Announcement[];
  onDismiss?: (id: string) => void;
}

const Announcement = ({ announcements, onDismiss }: AnnouncementProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  // 여러 공지사항이 있을 경우 자동 전환
  useEffect(() => {
    if (announcements.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [announcements.length]);

  // Ensure announcements is not null or empty before proceeding
  if (!visible || !announcements || announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  // 공지사항 우선순위에 따른 스타일 변경
  const getBgColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100';
      case 'medium':
        return 'bg-amber-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getTextColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-800';
      case 'medium':
        return 'text-amber-800';
      default:
        return 'text-blue-800';
    }
  };

  const getIconColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-amber-500';
      default:
        return 'text-blue-500';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className={`${getBgColor(currentAnnouncement.priority)} ${getTextColor(currentAnnouncement.priority)} px-4 py-2 w-full`}
      >
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-2">
            <Bell size={16} className={getIconColor(currentAnnouncement.priority)} />
            <p className="text-sm font-medium">
              {currentAnnouncement.message}
              {currentAnnouncement.link && (
                <a
                  href={currentAnnouncement.link}
                  className="underline ml-2 font-semibold"
                >
                  자세히 보기
                </a>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {announcements.length > 1 && (
              <div className="text-xs">
                {currentIndex + 1} / {announcements.length}
              </div>
            )}
            
            {onDismiss && (
              <button
                onClick={() => {
                  onDismiss(currentAnnouncement.id);
                  if (announcements.length === 1) {
                    setVisible(false);
                  }
                }}
                className="p-1 rounded-full hover:bg-white/20"
                aria-label="공지사항 닫기"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Announcement; 