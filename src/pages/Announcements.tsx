import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { 
  Megaphone, 
  Search, 
  Calendar, 
  Clock, 
  User, 
  ChevronRight,
  Pin,
  AlertCircle,
  CheckCircle,
  Info,
  X,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import { useAnnouncement } from '../contexts/AnnouncementContext';
import { Announcement } from '../types/index';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { supabaseApiService } from '../services/supabaseApi';

interface AnnouncementDetailModalProps {
  announcement: Announcement;
  onClose: () => void;
}

const AnnouncementDetailModal = ({ announcement, onClose }: AnnouncementDetailModalProps) => {
  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'medium': return <Info className="h-5 w-5 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-5 w-5 text-green-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '보통';
    }
  };

  const getPriorityBg = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-50 border-red-200';
      case 'medium': return 'bg-yellow-50 border-yellow-200';
      case 'low': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Megaphone className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-slate-600">공지사항</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3">
                {announcement.title}
              </h2>
              <div className={clsx(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                getPriorityBg(announcement.priority)
              )}>
                {getPriorityIcon(announcement.priority)}
                <span className="ml-1">{getPriorityText(announcement.priority)}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-sm text-slate-600">
              <User className="h-4 w-4 mr-2" />
              <span>작성자: {announcement.authorId || '관리자'}</span>
            </div>
            <div className="flex items-center text-sm text-slate-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                작성일: {format(new Date(announcement.createdAt), 'yyyy년 MM월 dd일', { locale: ko })}
              </span>
            </div>
            {announcement.endDate && (
              <div className="flex items-center text-sm text-slate-600">
                <Clock className="h-4 w-4 mr-2" />
                <span>
                  만료일: {format(new Date(announcement.endDate), 'yyyy년 MM월 dd일', { locale: ko })}
                </span>
              </div>
            )}
            {announcement.category && (
              <div className="flex items-center text-sm text-slate-600">
                <Pin className="h-4 w-4 mr-2" />
                <span>카테고리: {announcement.category}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">내용</h3>
            <div className="prose prose-slate max-w-none">
              <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">
                {announcement.content}
              </p>
            </div>

            {/* 첨부 이미지 표시 */}
            {announcement.images && announcement.images.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-slate-900 mb-3 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  첨부 이미지 ({announcement.images.length}개)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {announcement.images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-48 object-cover rounded-lg border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(image.url, '_blank')}
                      />
                      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {image.name}
                      </div>
                      <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                        {(image.size / 1024 / 1024).toFixed(1)}MB
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  💡 이미지를 클릭하면 새 창에서 원본 크기로 볼 수 있습니다.
                </p>
              </div>
            )}
          </div>

          {announcement.tags && announcement.tags.length > 0 && (
            <div className="border-t border-slate-200 pt-6 mt-6">
              <h4 className="text-sm font-medium text-slate-900 mb-2">태그</h4>
              <div className="flex flex-wrap gap-2">
                {announcement.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function Announcements() {
  const { announcements, setAnnouncements } = useAnnouncement();
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const { user } = useAuth();
  const { markAsRead } = useNotification();

  // 필터링된 공지사항
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(announcement => {
      const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           announcement.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (announcement.authorId && announcement.authorId.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesPriority = priorityFilter === 'all' || announcement.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    });
  }, [announcements, searchQuery, priorityFilter]);

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Info className="h-4 w-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityText = (priority?: string) => {
    switch (priority) {
      case 'high': return '긴급';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '보통';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const isExpired = (endDate?: string) => {
    if (!endDate) return false;
    return new Date(endDate) < new Date();
  };

  const handleAnnouncementClick = async (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    
    // 공지사항을 읽음으로 표시
    try {
      await supabaseApiService.announcements.markAsRead(announcement.id);
      // 뱃지 수 감소
      markAsRead('announcements');
      
      // 로컬 상태 업데이트
      setAnnouncements(prev => 
        prev.map(ann => 
          ann.id === announcement.id 
            ? { ...ann, readBy: [...ann.readBy, user?.id || ''] }
            : ann
        )
      );
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Megaphone className="mr-3 text-blue-600" size={32} />
                공지사항
              </h1>
              <p className="text-slate-600 mt-2">중요한 공지사항과 업데이트를 확인하세요</p>
            </div>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="공지사항 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-slate-400" size={20} />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">모든 우선순위</option>
                <option value="high">긴급</option>
                <option value="medium">보통</option>
                <option value="low">낮음</option>
              </select>
            </div>
          </div>
        </div>

        {/* 공지사항 목록 */}
        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">공지사항이 없습니다</h3>
              <p className="text-slate-600">
                {searchQuery || priorityFilter !== 'all' 
                  ? '검색 조건에 맞는 공지사항이 없습니다.' 
                  : '등록된 공지사항이 없습니다.'
                }
              </p>
            </div>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  'bg-white rounded-xl shadow-sm border border-slate-200 p-6 cursor-pointer transition-all hover:shadow-md',
                  isExpired(announcement.endDate) && 'opacity-60'
                )}
                onClick={() => handleAnnouncementClick(announcement)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mr-3',
                        getPriorityColor(announcement.priority)
                      )}>
                        {getPriorityIcon(announcement.priority)}
                        <span className="ml-1">{getPriorityText(announcement.priority)}</span>
                      </div>
                      {isExpired(announcement.endDate) && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          만료됨
                        </span>
                      )}
                      {announcement.showInBanner && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200 ml-2">
                          <Pin className="h-3 w-3 mr-1" />
                          상단 고정
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                      {announcement.title}
                    </h3>
                    
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {announcement.content}
                    </p>
                    
                    <div className="flex items-center text-sm text-slate-500 space-x-4">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>{announcement.authorId || '관리자'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>
                          {format(new Date(announcement.createdAt), 'yyyy.MM.dd', { locale: ko })}
                        </span>
                      </div>
                      {announcement.endDate && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>
                            만료: {format(new Date(announcement.endDate), 'yyyy.MM.dd', { locale: ko })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <ChevronRight className="h-5 w-5 text-slate-400 ml-4 flex-shrink-0" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* 공지사항 상세 모달 */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <AnnouncementDetailModal
            announcement={selectedAnnouncement}
            onClose={() => setSelectedAnnouncement(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
} 