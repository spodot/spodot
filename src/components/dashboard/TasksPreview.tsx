import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckSquare, AlertTriangle, Clock } from 'lucide-react';
import clsx from 'clsx';

type TaskStatus = 'pending' | 'in-progress' | 'completed';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

interface Task {
  id: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  assignedTo: string;
}

// 임시 업무 데이터
const tasksData: Task[] = [
  {
    id: 1,
    title: '회원 상담 - 이철수',
    status: 'pending',
    priority: 'high',
    dueDate: '오늘',
    assignedTo: '김철수'
  },
  {
    id: 2,
    title: '장비 점검 - 런닝머신',
    status: 'in-progress',
    priority: 'medium',
    dueDate: '오늘',
    assignedTo: '박영희'
  },
  {
    id: 3,
    title: '신규 회원 등록 처리',
    status: 'completed',
    priority: 'low',
    dueDate: '어제',
    assignedTo: '이영희'
  },
  {
    id: 4,
    title: '월간 보고서 작성',
    status: 'pending',
    priority: 'urgent',
    dueDate: '내일',
    assignedTo: '김철수'
  }
];

// 우선순위별 색상 및 아이콘
const getPriorityStyles = (priority: TaskPriority) => {
  switch (priority) {
    case 'urgent':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-200',
        icon: <AlertTriangle size={16} className="text-red-500" />
      };
    case 'high':
      return {
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        icon: <Clock size={16} className="text-orange-500" />
      };
    case 'medium':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: <Clock size={16} className="text-yellow-500" />
      };
    case 'low':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: <CheckSquare size={16} className="text-green-500" />
      };
  }
};

// 상태별 텍스트와 색상
const getStatusStyles = (status: TaskStatus) => {
  switch (status) {
    case 'pending':
      return {
        text: '대기 중',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-700'
      };
    case 'in-progress':
      return {
        text: '진행 중',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800'
      };
    case 'completed':
      return {
        text: '완료됨',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800'
      };
  }
};

const TasksPreview = () => {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'all'>('all');
  
  // 필터링된 업무
  const filteredTasks = selectedStatus === 'all' 
    ? tasksData 
    : tasksData.filter(task => task.status === selectedStatus);

  return (
    <div>
      {/* 필터 탭 */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setSelectedStatus('all')}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
            selectedStatus === 'all'
              ? 'bg-primary text-white'
              : 'bg-slate-100 text-slate-700'
          )}
        >
          전체
        </button>
        <button
          onClick={() => setSelectedStatus('pending')}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
            selectedStatus === 'pending'
              ? 'bg-primary text-white'
              : 'bg-slate-100 text-slate-700'
          )}
        >
          대기 중
        </button>
        <button
          onClick={() => setSelectedStatus('in-progress')}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
            selectedStatus === 'in-progress'
              ? 'bg-primary text-white'
              : 'bg-slate-100 text-slate-700'
          )}
        >
          진행 중
        </button>
        <button
          onClick={() => setSelectedStatus('completed')}
          className={clsx(
            'px-3 py-1 text-xs font-medium rounded-lg transition-colors',
            selectedStatus === 'completed'
              ? 'bg-primary text-white'
              : 'bg-slate-100 text-slate-700'
          )}
        >
          완료
        </button>
      </div>

      {/* 업무 목록 */}
      <div className="space-y-3">
        {filteredTasks.map((task, index) => {
          const priorityStyles = getPriorityStyles(task.priority);
          const statusStyles = getStatusStyles(task.status);
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className={`p-3 rounded-lg border ${priorityStyles.borderColor}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {priorityStyles.icon}
                  <span className={`font-medium ${
                    task.status === 'completed' 
                      ? 'line-through text-slate-500' 
                      : 'text-slate-900'
                  }`}>
                    {task.title}
                  </span>
                </div>
                <div>
                  <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusStyles.bgColor} ${statusStyles.textColor}`}>
                    {statusStyles.text}
                  </span>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <div className="text-slate-500">
                  담당: {task.assignedTo}
                </div>
                <div className={`${
                  task.dueDate === '오늘' ? 'text-orange-500' :
                  task.dueDate === '내일' ? 'text-red-500' :
                  'text-slate-500'
                }`}>
                  마감: {task.dueDate}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default TasksPreview;