import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, Tag, AlertTriangle, Edit, Trash, Check } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTask, Task, TaskStatus, TaskPriority, TaskCategory } from '../../contexts/TaskContext';
import { useAuth } from '../../contexts/AuthContext';
import TaskComments from './TaskComments';
import clsx from 'clsx';

interface TaskDetailsProps {
  task: Task;
  onClose: () => void;
  onEdit?: () => void;
}

const TaskDetails = ({ task, onClose, onEdit }: TaskDetailsProps) => {
  const { updateTask, deleteTask } = useTask();
  const { user } = useAuth();
  
  // 업무 삭제
  const handleDelete = () => {
    if (window.confirm('이 업무를 삭제하시겠습니까?')) {
      deleteTask(task.id);
      onClose();
    }
  };
  
  // 업무 상태 변경
  const handleStatusChange = (status: TaskStatus) => {
    updateTask(task.id, { status });
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
  
  // 상태에 따른 배지 스타일
  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  // 카테고리에 따른 배지 스타일
  const getCategoryBadgeStyle = (category: TaskCategory) => {
    switch (category) {
      case 'maintenance':
        return 'bg-purple-100 text-purple-800';
      case 'administrative':
        return 'bg-indigo-100 text-indigo-800';
      case 'client':
        return 'bg-cyan-100 text-cyan-800';
      case 'training':
        return 'bg-pink-100 text-pink-800';
      case 'general':
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  // 우선순위 텍스트
  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'low': return '낮음';
      case 'medium': return '중간';
      case 'high': return '높음';
      case 'urgent': return '긴급';
    }
  };
  
  // 상태 텍스트
  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'in-progress': return '진행중';
      case 'completed': return '완료됨';
      case 'cancelled': return '취소됨';
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
  
  // 관리자이거나 담당자인 경우만 편집 가능
  const canEdit = user?.id === task.assignedBy || user?.id === task.assignedTo || user?.role === 'admin';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <span className={clsx(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              task.priority === 'urgent' && "bg-red-100 text-red-700",
              task.priority === 'high' && "bg-orange-100 text-orange-700",
              task.priority === 'medium' && "bg-blue-100 text-blue-700",
              task.priority === 'low' && "bg-green-100 text-green-700"
            )}>
              {task.priority === 'urgent' && <AlertTriangle size={24} />}
              {task.priority === 'high' && <AlertTriangle size={24} />}
              {task.priority === 'medium' && <AlertTriangle size={24} />}
              {task.priority === 'low' && <AlertTriangle size={24} />}
            </span>
            <h2 className="text-xl font-semibold text-slate-900">
              업무 상세 정보
            </h2>
          </div>
          
          <div className="flex items-center space-x-2">
            {canEdit && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit();
                  }}
                  className="text-blue-500 hover:text-blue-600:text-blue-400"
                  title="편집"
                >
                  <Edit size={20} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="text-red-500 hover:text-red-600:text-red-400"
                  title="삭제"
                >
                  <Trash size={20} />
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600:text-slate-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={clsx(
              "px-2 py-1 rounded-full text-xs font-medium",
              getStatusBadgeStyle(task.status)
            )}>
              {getStatusText(task.status)}
            </span>
            
            <span className={clsx(
              "px-2 py-1 rounded-full text-xs font-medium",
              getPriorityBadgeStyle(task.priority)
            )}>
              {getPriorityText(task.priority)}
            </span>
            
            <span className={clsx(
              "px-2 py-1 rounded-full text-xs font-medium",
              getCategoryBadgeStyle(task.category)
            )}>
              {getCategoryText(task.category)}
            </span>
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-4">{task.title}</h3>
          
          {task.description && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-slate-700">
              <User size={18} className="mr-2 text-primary flex-shrink-0" />
              <div>
                <span className="block text-sm font-medium text-slate-500">담당자</span>
                <span>{Array.isArray(task.assignedToName) ? task.assignedToName.join(', ') : task.assignedToName}</span>
              </div>
            </div>
            
            <div className="flex items-center text-slate-700">
              <User size={18} className="mr-2 text-primary flex-shrink-0" />
              <div>
                <span className="block text-sm font-medium text-slate-500">배정자</span>
                <span>{task.assignedByName}</span>
              </div>
            </div>
            
            <div className="flex items-center text-slate-700">
              <Calendar size={18} className="mr-2 text-primary flex-shrink-0" />
              <div>
                <span className="block text-sm font-medium text-slate-500">마감일</span>
                <span className={clsx(
                  isPast(parseISO(task.dueDate)) && task.status !== 'completed' && task.status !== 'cancelled' 
                    ? 'text-red-600' 
                    : ''
                )}>
                  {format(parseISO(task.dueDate), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                  {isPast(parseISO(task.dueDate)) && task.status !== 'completed' && task.status !== 'cancelled' && ' (지남)'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center text-slate-700">
              <Clock size={18} className="mr-2 text-primary flex-shrink-0" />
              <div>
                <span className="block text-sm font-medium text-slate-500">생성일</span>
                <span>{format(parseISO(task.createdAt), 'yyyy년 M월 d일', { locale: ko })}</span>
              </div>
            </div>
          </div>
          
          {canEdit && task.status !== 'completed' && task.status !== 'cancelled' && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-medium text-slate-900 mb-3">업무 상태 변경</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('pending')}
                  className={clsx(
                    "px-3 py-1.5 rounded text-sm font-medium",
                    task.status === 'pending' 
                      ? "bg-yellow-100 text-yellow-800" 
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200:bg-slate-600"
                  )}
                >
                  대기중
                </button>
                
                <button
                  onClick={() => handleStatusChange('in-progress')}
                  className={clsx(
                    "px-3 py-1.5 rounded text-sm font-medium",
                    task.status === 'in-progress' 
                      ? "bg-blue-100 text-blue-800" 
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200:bg-slate-600"
                  )}
                >
                  진행중
                </button>
                
                <button
                  onClick={() => handleStatusChange('completed')}
                  className={clsx(
                    "px-3 py-1.5 rounded text-sm font-medium flex items-center",
                    "bg-slate-100 text-slate-700 hover:bg-green-100 hover:text-green-800:bg-green-900/30:text-green-300"
                  )}
                >
                  <Check size={16} className="mr-1" />
                  완료로 표시
                </button>
                
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  className="px-3 py-1.5 rounded text-sm font-medium bg-slate-100 text-slate-700 hover:bg-red-100 hover:text-red-800:bg-red-900/30:text-red-300"
                >
                  취소
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-6 border-t border-slate-200 pt-6">
            <TaskComments taskId={task.id} comments={task.comments || []} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default TaskDetails; 