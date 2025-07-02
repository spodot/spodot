import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, FileText, AlertTriangle, Tag, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useTask, TaskPriority, TaskCategory, TaskStatus } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import { useAnnouncement } from '../../contexts/AnnouncementContext';
import { useUser } from '../../contexts/UserContext';
import clsx from 'clsx';

interface AddTaskFormProps {
  onClose: () => void;
}

const AddTaskForm = ({ onClose }: AddTaskFormProps) => {
  const { addTask } = useTask();
  const { user } = useAuth();
  const { createAnnouncement } = useAnnouncement();
  const { staff: staffList = [] } = useUser() || {};
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    category: 'general' as TaskCategory,
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    assignedTo: [] as string[],
    assignedToName: [] as string[],
    status: 'pending' as TaskStatus
  });

  // 공지사항 관련 상태 추가
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [announcementPriority, setAnnouncementPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [announcementExpireDate, setAnnouncementExpireDate] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')); // 기본값: 7일 후

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 업무 추가
    const newTask = addTask({
      ...formData,
      assignedBy: user?.id || '',
      assignedByName: user?.name || ''
    });
    
    // 공지사항으로 설정되었다면 공지사항도 생성
    if (isAnnouncement && user) {
      createAnnouncement({
        message: `[업무] ${formData.title} - ${formData.description}`,
        createdBy: user.id,
        createdByName: user.name,
        expiresAt: new Date(announcementExpireDate).toISOString(),
        priority: announcementPriority,
        link: `/tasks?id=${newTask}` // 업무 상세 페이지로 연결
      });
    }
    
    onClose();
  };

  // 우선순위에 따른 배지 스타일
  const getPriorityBadgeStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
    }
  };

  // 카테고리 텍스트
  const getCategoryText = (category: TaskCategory) => {
    switch (category) {
      case 'maintenance': return '유지보수';
      case 'administrative': return '행정';
      case 'client': return '고객';
      case 'training': return '교육';
      case 'general': return '일반';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            업무 추가
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              업무 제목
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="form-input w-full"
              placeholder="업무 제목을 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              업무 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-input h-32 w-full"
              placeholder="업무 설명을 입력하세요"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                우선순위
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                className="form-input w-full"
              >
                <option value="low">낮음</option>
                <option value="medium">중간</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                className="form-input w-full"
              >
                <option value="general">일반</option>
                <option value="maintenance">유지보수</option>
                <option value="administrative">행정</option>
                <option value="client">고객</option>
                <option value="training">교육</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              마감일
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="form-input pl-10 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              담당자
            </label>
            <div className="flex flex-wrap gap-2">
              {staffList && staffList.length > 0 ? staffList.map((staff) => (
                <label key={staff.id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    value={staff.id}
                    checked={formData.assignedTo.includes(staff.id)}
                    onChange={e => {
                      const checked = e.target.checked;
                      setFormData(prev => {
                        let assignedTo = checked
                          ? [...prev.assignedTo, staff.id]
                          : prev.assignedTo.filter(id => id !== staff.id);
                        let assignedToName = checked
                          ? [...prev.assignedToName, staff.name]
                          : prev.assignedToName.filter((_, idx) => prev.assignedTo[idx] !== staff.id);
                        // assignedToName 동기화
                        assignedToName = assignedTo.map(id => {
                          const s = staffList.find(st => st.id === id);
                          return s ? s.name : '';
                        });
                        return { ...prev, assignedTo, assignedToName };
                      });
                    }}
                  />
                  {staff.name}
                </label>
              )) : <span className="text-xs text-slate-400">직원 없음</span>}
            </div>
          </div>

          {/* 공지사항 설정 */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center mb-3">
              <input
                type="checkbox"
                id="isAnnouncement"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="form-checkbox h-4 w-4 text-blue-500"
              />
              <label htmlFor="isAnnouncement" className="ml-2 text-sm font-medium text-slate-700 flex items-center">
                <Bell size={16} className="mr-1 text-blue-500" />
                공지사항으로 등록
              </label>
            </div>
            
            {isAnnouncement && (
              <div className="space-y-3 pl-6">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    중요도
                  </label>
                  <select
                    value={announcementPriority}
                    onChange={(e) => setAnnouncementPriority(e.target.value as 'low' | 'medium' | 'high')}
                    className="form-input w-full py-1 text-sm"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    만료일
                  </label>
                  <input
                    type="date"
                    value={announcementExpireDate}
                    onChange={(e) => setAnnouncementExpireDate(e.target.value)}
                    className="form-input w-full py-1 text-sm"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4 mt-6">
            <span className="text-sm font-medium text-slate-700">미리보기:</span>
            <div className="flex space-x-2">
              <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                getPriorityBadgeStyle(formData.priority)
              )}>
                {formData.priority === 'low' && '낮음'}
                {formData.priority === 'medium' && '중간'}
                {formData.priority === 'high' && '높음'}
                {formData.priority === 'urgent' && '긴급'}
              </span>
              
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {getCategoryText(formData.category)}
              </span>
              
              {isAnnouncement && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center">
                  <Bell size={12} className="mr-1" />
                  공지사항
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              업무 추가
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddTaskForm; 