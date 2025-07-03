import {
  Bell,
  Megaphone,
  CalendarDays,
  PlusSquare,
  Edit3,
  Trash2,
  GripVertical,
  Save,
  AlertCircle,
  Check,
  X,
  Edit,
  Clock,
  User,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useTask, Task, TaskStatus, TaskPriority } from '../contexts/TaskContext';
import { useAuth } from '../contexts/AuthContext';
import { useHandover } from '../contexts/HandoverContext';
import AddTaskModal from '../components/tasks/AddTaskModal';
import { format, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks, isSameDay, isSameMonth, getDate, getDaysInMonth, getDay } from 'date-fns';
import { parse as dateFnsParse } from 'date-fns/parse'; 
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar';
import { ko, Locale } from 'date-fns/locale'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css'; // Import custom calendar styles
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { logger, showSuccess, showError, confirmDelete } from '../utils/notifications';

const locales = {
  'ko': ko,
};

const localizer = dateFnsLocalizer({
  format,
  parse: (dateStr: string, formatStr: string, locale?: Locale) => dateFnsParse(dateStr, formatStr, new Date(), { locale }), 
  startOfWeek: (date: Date, options?: {locale?: Locale} ) => startOfWeek(date, { locale: options?.locale || (locales.ko as Locale) }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
  originalTask: Task;
}

const getPriorityClass = (priority: TaskPriority) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'urgent': return 'bg-purple-600';
    case 'medium': return 'bg-orange-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getStatusDisplayName = (status: TaskStatus) => {
  switch (status) {
    case 'pending': return '대기중';
    case 'in-progress': return '진행중';
    case 'completed': return '완료';
    case 'cancelled': return '취소됨';
    default: return status;
  }
};

const taskStatusOptions: TaskStatus[] = ['pending', 'in-progress', 'completed', 'cancelled'];

type MyTaskView = 'list' | 'month' | 'week' | 'day';

const MyTasks = () => {
  const { tasks: contextTasks, updateTask, deleteTask } = useTask();
  const { user, hasPermission } = useAuth();
  const { handovers, loading: handoversLoading, error: handoversError, addHandover } = useHandover();
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<MyTaskView>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDateForNewTask, setSelectedDateForNewTask] = useState<string | undefined>(undefined); // For storing date from calendar click

  const [currentHandover, setCurrentHandover] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // 캘린더 네비게이션 함수들
  const handlePrevious = () => {
    if (currentView === 'day') {
      setCalendarDate(addDays(calendarDate, -1));
    } else if (currentView === 'week') {
      setCalendarDate(subWeeks(calendarDate, 1));
    } else if (currentView === 'month') {
      setCalendarDate(subMonths(calendarDate, 1));
    }
  };
  
  const handleNext = () => {
    if (currentView === 'day') {
      setCalendarDate(addDays(calendarDate, 1));
    } else if (currentView === 'week') {
      setCalendarDate(addWeeks(calendarDate, 1));
    } else if (currentView === 'month') {
      setCalendarDate(addMonths(calendarDate, 1));
    }
  };
  
  const handleToday = () => {
    setCalendarDate(new Date());
  };

  // 주간 업무 그룹화
  const getWeekTasks = () => {
    const startDate = startOfWeek(calendarDate, { locale: ko });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    
    return weekDays.map(day => {
      const dayTasks = myTasks.filter(task => 
        isSameDay(parseISO(task.dueDate), day)
      );
      
      return {
        date: day,
        tasks: dayTasks.sort((a, b) => a.title.localeCompare(b.title))
      };
    });
  };
  
  // 월간 업무 그룹화
  const getMonthTasks = () => {
    const monthStart = startOfMonth(calendarDate);
    const monthEnd = endOfMonth(calendarDate);
    const startDate = startOfWeek(monthStart, { locale: ko });
    const endDate = endOfWeek(monthEnd, { locale: ko });
    
    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days.map(day => {
      const dayTasks = myTasks.filter(task => 
        isSameDay(parseISO(task.dueDate), day)
      );
      
      return {
        date: day,
        isCurrentMonth: isSameMonth(day, calendarDate),
        tasks: dayTasks.sort((a, b) => a.title.localeCompare(b.title))
      };
    });
  };

  // 디버깅을 위한 로그
  useEffect(() => {
    logger.debug('editingTask 상태 변경:', editingTask);
  }, [editingTask]);

  // 현재 사용자에게 배정된 업무 또는 자신이 생성한 업무 필터링
  const myTasks = useMemo(() => {
    if (!user) return [];
    
    return contextTasks.filter(task => {
      // assignedTo 배열에 현재 사용자 ID가 포함되어 있거나, 자신이 생성한 업무인지 확인
      const isAssignedToMe = task.assignedTo && task.assignedTo.includes(user.id);
      const isCreatedByMe = task.assignedBy === user.id;
      
      return isAssignedToMe || isCreatedByMe;
    });
  }, [contextTasks, user]);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][today.getDay()]}요일`;
  
  const calendarEvents = useMemo(() => myTasks.map(task => ({
    id: task.id,
    title: task.title,
    start: parseISO(task.dueDate),
    end: parseISO(task.dueDate),
    allDay: true,
    originalTask: task,
  })), [myTasks]);

  const handleSaveHandover = async () => {
    if (!currentHandover.trim() || !user) return;
    
    try {
      setSaving(true);
      
      const result = await addHandover(currentHandover.trim());
      
      if (result) {
        // 성공 시 폼 초기화
      setCurrentHandover('');
      setSuccess('인계사항이 성공적으로 저장되었습니다.');
      
      // 성공 메시지 자동 제거
      setTimeout(() => setSuccess(null), 3000);
      } else {
        setError('인계사항 저장에 실패했습니다.');
        setTimeout(() => setError(null), 5000);
      }
    } catch (err) {
      logger.error('인계사항 저장 오류', err);
      setError('인계사항 저장에 실패했습니다.');
      
      // 에러 메시지 자동 제거
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  };

  // 오늘 인계사항과 이전 인계사항 분리
  const todayDate = new Date().toISOString().split('T')[0];
  const todayHandovers = handovers.filter(h => h.date === todayDate);
  const previousHandovers = handovers.filter(h => h.date !== todayDate);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const handleTaskStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (!hasPermission('tasks.update')) {
      setError('권한이 없습니다. 업무 상태를 변경할 권한이 없습니다.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    const taskToUpdate = myTasks.find(t => t.id === taskId);
    if (taskToUpdate) {
      updateTask(taskId, { ...taskToUpdate, status: newStatus, updatedAt: new Date().toISOString() });
      setSuccess('업무 상태가 변경되었습니다.');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleTaskDelete = (taskId: string) => {
    if (!hasPermission('tasks.delete')) {
      setError('권한이 없습니다. 업무 삭제 권한이 없습니다.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    confirmDelete('업무').then((confirmed) => {
      if (confirmed) {
        deleteTask(taskId);
        showSuccess('업무가 삭제되었습니다.');
      }
    });
  };

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (!hasPermission('tasks.create')) {
      setError('권한이 없습니다. 업무 생성 권한이 없습니다.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    
    const selectedDateStr = slotInfo.start.toISOString().split('T')[0];
    setSelectedDateForNewTask(selectedDateStr);
    setIsAddTaskModalOpen(true);
  };

  const CustomMonthDateCell = ({ children, value: date, className }: { children: React.ReactNode, value: Date, className?: string }) => {
    const dayEvents = calendarEvents.filter(event => {
      const eventStartDate = new Date(event.start);
      return (
        eventStartDate.getFullYear() === date.getFullYear() &&
        eventStartDate.getMonth() === date.getMonth() &&
        eventStartDate.getDate() === date.getDate()
      );
    });

    // Extract the date number node from children
    // The children prop typically contains the date number wrapped in some elements
    
    return (
      <div className={`${className} h-full`}>
        {/* Date number container - positioned absolutely in the top right corner */}
        <div className="absolute top-1 right-2 z-10 font-medium">
          {children}
        </div>
        
        {/* Task list container - starts with enough top padding to avoid the date */}
        <div className="h-full pt-7 px-1 pb-1 relative">
          {dayEvents.length > 0 && (
            <div className="h-full overflow-y-auto task-list-container">
              {dayEvents.map(event => (
                <div 
                  key={event.id} 
                  className="bg-blue-100 text-blue-800 rounded-sm p-1 mb-1 text-xs truncate w-full"
                  title={event.title}
                >
                  {event.title}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const calendarComponents = useMemo(() => {
    if (currentView === 'month') {
      return {
        dateCellWrapper: CustomMonthDateCell,
      };
    }
    return undefined; // Or an empty object {}, undefined should be fine for RBC components prop
  }, [currentView, calendarEvents]); // CustomMonthDateCell implicitly depends on calendarEvents

  // 일간 보기용 타임테이블 데이터 생성
  const getDailyTimetable = () => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const selectedDate = format(calendarDate, 'yyyy-MM-dd');
    
    // 선택된 날짜의 업무만 필터링
    const dayTasks = myTasks.filter(task => {
      const taskDate = format(parseISO(task.dueDate), 'yyyy-MM-dd');
      return taskDate === selectedDate;
    });

    return hours.map(hour => {
      const hourString = hour.toString().padStart(2, '0');
      const hourTasks = dayTasks.filter(task => {
        if (!task.startTime) return false;
        const taskHour = parseInt(task.startTime.split(':')[0]);
        return taskHour === hour;
      });

      return {
        hour,
        hourString: `${hourString}:00`,
        tasks: hourTasks
      };
    });
  };

  const timetableData = getDailyTimetable();

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">내 업무</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-slate-600">
              {user?.name || '사용자'}님
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              hasPermission('admin.dashboard') 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {hasPermission('admin.dashboard') ? '관리자' : '일반 사용자'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">{formattedDate}</span>
        </div>
      </header>

      <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center space-x-3 mb-6 shadow-md">
        <Megaphone size={24} className="flex-shrink-0" />
        <p className="text-sm font-medium">공지사항: 이번 주 금요일 오후 3시에 전체 회의가 있습니다. 모든 직원은 참석해주세요.</p>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <h2 className="text-xl font-semibold text-slate-700 mb-3 sm:mb-0">내 업무 목록</h2>
          <div className="flex items-center space-x-3">
            <div className="flex items-center p-1 bg-slate-200 rounded-lg">
              {(['list', 'month', 'week', 'day'] as MyTaskView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors 
                              ${currentView === view 
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'text-slate-600 hover:bg-slate-300'}`}
                >
                  {view === 'list' ? '목록' : view === 'month' ? '월간' : view === 'week' ? '주간' : '일간'}
                </button>
              ))}
            </div>
            <div className="relative">
              <input 
                type="date" 
                defaultValue={new Date().toISOString().split('T')[0]} 
                onChange={(e) => setCalendarDate(parseISO(e.target.value))} 
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10"
              />
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
            {currentView !== 'list' && (
              <button 
                onClick={() => setCalendarDate(new Date())} 
                className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors text-slate-600 hover:bg-slate-300 border border-slate-300">
                오늘
              </button>
            )}
            {/* 업무 추가 버튼 - 권한 체크 완화 */}
            {(hasPermission('tasks.create') || !user) && (
              <button 
                onClick={() => {
                  logger.debug('업무추가 버튼 클릭됨');
                  logger.debug('현재 사용자:', user);
                  logger.debug('tasks.create 권한:', hasPermission('tasks.create'));
                  setSelectedDateForNewTask(undefined); // Clear any previously selected date for general add
                  setIsAddTaskModalOpen(true);
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors">
                <PlusSquare size={18} />
                <span>업무 추가</span>
              </button>
            )}
            
            {/* 권한이 없는 경우 안내 메시지 */}
            {user && !hasPermission('tasks.create') && (
              <div className="text-sm text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
                업무 추가 권한이 없습니다 (현재 역할: {user.role})
              </div>
            )}
          </div>
        </div>

        {/* 캘린더 네비게이션 헤더 - 월간/주간 보기에만 표시 */}
        {(currentView === 'month' || currentView === 'week') && (
          <div className="flex items-center justify-between mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevious}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"
                title="이전"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h3 className="text-lg font-semibold text-slate-800">
                {currentView === 'month' 
                  ? format(calendarDate, 'yyyy년 M월', { locale: ko })
                  : `${format(startOfWeek(calendarDate, { locale: ko }), 'yyyy년 M월 d일', { locale: ko })} - ${format(endOfWeek(calendarDate, { locale: ko }), 'M월 d일', { locale: ko })}`
                }
              </h3>
              
              <button
                onClick={handleNext}
                className="p-2 text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition-colors"
                title="다음"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              <button
                onClick={handleToday}
                className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-300 hover:border-blue-600 rounded-lg transition-all"
              >
                오늘
              </button>
            </div>
          </div>
        )}

        {currentView === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[35%]">업무</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">담당자</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">마감일</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">중요도</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">카테고리</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody>
                {myTasks.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500">표시할 업무가 없습니다.</td></tr>
                ) : (
                  myTasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="py-3 pr-3">
                        <div className="flex items-center">
                          <GripVertical className="w-5 h-5 text-slate-400 mr-2 opacity-0 group-hover:opacity-100 cursor-grab" />
                          <div className="flex-1">
                            <p 
                              className="font-semibold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors"
                              onClick={() => {
                                logger.debug('업무 클릭됨:', task.title, task);
                                setEditingTask(task);
                              }}
                              title="클릭하여 상세 보기"
                            >
                              {task.title}
                            </p>
                            {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-700">{Array.isArray(task.assignedToName) ? task.assignedToName.join(', ') : task.assignedToName}</td>
                      <td className="py-3 pr-3">
                        <select 
                          value={task.status}
                          onChange={(e) => handleTaskStatusChange(task.id, e.target.value as TaskStatus)}
                          disabled={!hasPermission('tasks.update')}
                          className={`text-sm p-1.5 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 ${
                            !hasPermission('tasks.update') ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'bg-white'
                          }`}
                          title={!hasPermission('tasks.update') ? '업무 수정 권한이 없습니다' : ''}
                        >
                          {taskStatusOptions.map(statusValue => (
                              <option key={statusValue} value={statusValue}>{getStatusDisplayName(statusValue)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-700">
                        {format(parseISO(task.dueDate), 'yyyy-MM-dd')}
                      </td>
                      <td className="py-3 text-center">
                        <span className={`inline-block h-3 w-3 rounded-full ${getPriorityClass(task.priority)}`} title={task.priority}></span>
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-700 text-center">{task.category}</td>
                      <td className="py-3 text-center">
                        {hasPermission('tasks.update') || hasPermission('tasks.delete') ? (
                          <div className="flex justify-center space-x-2">
                            {hasPermission('tasks.update') && (
                              <button 
                                onClick={() => {
                                  setEditingTask(task);
                                }} 
                                className="text-slate-500 hover:text-blue-600 transition-colors" 
                                title="수정"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {hasPermission('tasks.delete') && (
                              <button 
                                onClick={() => {
                                  confirmDelete('업무').then((confirmed) => {
                                    if (confirmed) {
                                      handleTaskDelete(task.id);
                                    }
                                  });
                                }} 
                                className="text-slate-500 hover:text-red-600 transition-colors" 
                                title="삭제"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex justify-center">
                            <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
                              읽기 전용
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : currentView === 'day' ? (
          // 일간 타임테이블 보기
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-lg font-semibold text-slate-800">
                {format(calendarDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko })} 업무 일정
              </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {timetableData.map(({ hour, hourString, tasks }) => (
                <div key={hour} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="flex">
                    {/* 시간 표시 */}
                    <div className="w-20 p-4 bg-slate-50 border-r border-slate-200 text-center">
                      <span className="text-sm font-medium text-slate-600">{hourString}</span>
                    </div>
                    
                    {/* 업무 표시 */}
                    <div className="flex-1 p-4">
                      {tasks.length === 0 ? (
                        <div className="text-slate-400 text-sm italic">업무 없음</div>
                      ) : (
                        <div className="space-y-2">
                          {tasks.map(task => (
                            <div 
                              key={task.id} 
                              className={`p-3 rounded-lg border-l-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                                task.priority === 'urgent' ? 'border-red-500 bg-red-50' :
                                task.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                                task.priority === 'medium' ? 'border-blue-500 bg-blue-50' :
                                'border-green-500 bg-green-50'
                              }`}
                              onClick={() => setEditingTask(task)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-slate-800 mb-1">{task.title}</h4>
                                  {task.description && (
                                    <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                                  )}
                                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                                    {task.startTime && task.endTime && (
                                      <span className="flex items-center">
                                        <Clock size={12} className="mr-1" />
                                        {task.startTime} - {task.endTime}
                                      </span>
                                    )}
                                    <span className="flex items-center">
                                      <User size={12} className="mr-1" />
                                      {Array.isArray(task.assignedToName) ? task.assignedToName.join(', ') : task.assignedToName}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {getStatusDisplayName(task.status)}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* 우선순위 표시 */}
                                <div className="ml-3">
                                  <span className={`inline-block h-3 w-3 rounded-full ${getPriorityClass(task.priority)}`} title={task.priority}></span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentView === 'week' ? (
          // 주간 보기
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div key={index} className="py-3 text-center font-semibold text-slate-700 border-r last:border-r-0 border-slate-200">
                  {day}요일
                </div>
              ))}
            </div>
            
            {/* 주간 그리드 */}
            <div className="grid grid-cols-7 auto-rows-[200px] border-l border-slate-200">
              {getWeekTasks().map((day, index) => (
                <div 
                  key={index} 
                  className={clsx(
                    "border-r border-b border-slate-200 p-2 overflow-hidden relative flex flex-col h-[200px]",
                    isSameDay(day.date, new Date()) && "bg-blue-50 ring-1 ring-blue-200"
                  )}
                >
                  {/* 날짜와 업무 추가 버튼 */}
                  <div className="flex justify-between items-center mb-2 shrink-0">
                    <span 
                      className={clsx(
                        "flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium cursor-pointer transition-colors",
                        isSameDay(day.date, new Date()) 
                          ? "bg-blue-600 text-white" 
                          : "text-slate-900 hover:bg-slate-100"
                      )}
                      title={day.tasks.length > 0 ? `${day.tasks.length}개 업무` : "업무 추가"}
                    >
                      {format(day.date, 'd')}
                    </span>
                    
                    {hasPermission('tasks.create') && (
                      <button 
                        className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-300 hover:border-blue-600 p-1 rounded transition-all"
                        onClick={() => {
                          setSelectedDateForNewTask(format(day.date, 'yyyy-MM-dd'));
                          setIsAddTaskModalOpen(true);
                        }}
                        title="업무 추가"
                      >
                        <PlusSquare size={14} />
                      </button>
                    )}
                  </div>
                  
                  {/* 업무 목록 */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {day.tasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id}
                        className={clsx(
                          "px-2 py-1 text-xs rounded cursor-pointer text-white font-medium transition-opacity hover:opacity-80 w-full",
                          task.priority === 'urgent' && "bg-purple-600",
                          task.priority === 'high' && "bg-red-500",
                          task.priority === 'medium' && "bg-orange-500",
                          task.priority === 'low' && "bg-green-500",
                          task.status === 'completed' && "opacity-60"
                        )}
                        onClick={() => setEditingTask(task)}
                        title={`${task.title} - ${getStatusDisplayName(task.status)}`}
                      >
                        <div className="truncate font-semibold">
                          {task.title}
                        </div>
                        <div className="text-xs opacity-90 truncate">
                          {getStatusDisplayName(task.status)}
                        </div>
                      </div>
                    ))}
                    
                    {day.tasks.length > 3 && (
                      <div className="text-xs text-slate-600 text-center py-1 cursor-pointer hover:bg-slate-100 rounded">
                        +{day.tasks.length - 3}개 더
                      </div>
                    )}
                    
                    {day.tasks.length === 0 && (
                      <div 
                        className="h-24 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        onClick={() => {
                          if (hasPermission('tasks.create')) {
                            setSelectedDateForNewTask(format(day.date, 'yyyy-MM-dd'));
                            setIsAddTaskModalOpen(true);
                          }
                        }}
                      >
                        <PlusSquare size={20} className="text-blue-500 mb-1 group-hover:text-blue-600" />
                        <span className="text-blue-600 text-xs font-medium text-center group-hover:text-blue-700">
                          업무 추가
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : currentView === 'month' ? (
          // 월간 보기
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div key={index} className="py-3 text-center font-semibold text-slate-700 border-r last:border-r-0 border-slate-200">
                  {day}요일
                </div>
              ))}
            </div>
            
            {/* 달력 그리드 */}
            <div className="grid grid-cols-7 auto-rows-[120px] border-l border-slate-200">
              {getMonthTasks().map((day, index) => (
                <div 
                  key={index} 
                  className={clsx(
                    "border-r border-b border-slate-200 p-1 overflow-hidden relative flex flex-col h-[120px]",
                    !day.isCurrentMonth && "bg-slate-50",
                    isSameDay(day.date, new Date()) && "bg-blue-50 ring-1 ring-blue-200"
                  )}
                >
                  {/* 날짜와 업무 추가 버튼 */}
                  <div className="flex justify-between items-center mb-1 shrink-0">
                    <div className="flex items-center space-x-1">
                      <span 
                        className={clsx(
                          "flex items-center justify-center w-6 h-6 rounded-full text-sm font-medium cursor-pointer transition-colors",
                          isSameDay(day.date, new Date()) 
                            ? "bg-blue-600 text-white" 
                            : day.isCurrentMonth 
                              ? "text-slate-900 hover:bg-slate-100" 
                              : "text-slate-400"
                        )}
                        title={day.tasks.length > 0 ? `${day.tasks.length}개 업무` : "업무 추가"}
                      >
                        {format(day.date, 'd')}
                      </span>
                      {day.tasks.length > 2 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full font-medium">
                          +{day.tasks.length - 2}
                        </span>
                      )}
                    </div>
                    
                    {day.isCurrentMonth && hasPermission('tasks.create') && (
                      <button 
                        className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-300 hover:border-blue-600 p-1 rounded transition-all"
                        onClick={() => {
                          setSelectedDateForNewTask(format(day.date, 'yyyy-MM-dd'));
                          setIsAddTaskModalOpen(true);
                        }}
                        title="업무 추가"
                      >
                        <PlusSquare size={12} />
                      </button>
                    )}
                  </div>
                  
                  {/* 업무 목록 - 최대 2개만 표시 */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {day.tasks.slice(0, 2).map(task => (
                      <div 
                        key={task.id}
                        className={clsx(
                          "px-1.5 py-1 text-xs rounded cursor-pointer text-white font-medium transition-opacity hover:opacity-80 w-full",
                          task.priority === 'urgent' && "bg-purple-600",
                          task.priority === 'high' && "bg-red-500",
                          task.priority === 'medium' && "bg-orange-500",
                          task.priority === 'low' && "bg-green-500",
                          task.status === 'completed' && "opacity-60"
                        )}
                        onClick={() => setEditingTask(task)}
                        title={`${task.title} - ${getStatusDisplayName(task.status)}`}
                      >
                        <div className="text-xs font-medium leading-tight truncate">
                          {task.title}
                        </div>
                      </div>
                    ))}
                    
                    {/* 더 많은 업무가 있을 때 클릭 가능한 영역 */}
                    {day.tasks.length > 2 && (
                      <div className="text-xs text-slate-600 text-center py-1 cursor-pointer hover:bg-slate-100 rounded">
                        {day.tasks.length - 2}개 더 보기
                      </div>
                    )}
                    
                    {day.tasks.length === 0 && (
                      <div className="text-xs text-center text-slate-400 py-2">
                        업무 없음
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg" style={{ height: 'calc(100vh - 280px)' }}>
            <Calendar<CalendarEvent>
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              titleAccessor="title"
              style={{ height: '100%' }}
              date={calendarDate}
              onNavigate={(newDate) => setCalendarDate(newDate)}
              onView={(newView) => setCurrentView(newView as MyTaskView)}
              view={currentView as Exclude<MyTaskView, 'list'>}
              messages={{
                allDay: '하루 종일',
                previous: '이전',
                next: '다음',
                today: '오늘',
                month: '월',
                week: '주',
                day: '일',
                agenda: '목록',
                date: '날짜',
                time: '시간',
                event: '이벤트',
                noEventsInRange: '이 범위에는 업무가 없습니다.',
                showMore: total => `+${total} 더보기`,
              }}
              selectable 
              onSelectSlot={handleSelectSlot} 
              components={calendarComponents} 
              className="rbc-calendar-main"
            />
          </div>
        )}
      </section>

      {/* 에러 및 성공 메시지 */}
      <AnimatePresence>
        {(error || handoversError) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center"
          >
            <AlertCircle className="text-red-500 mr-3" size={20} />
            <span className="text-red-700">{error || handoversError}</span>
            <button
              onClick={() => {
                setError(null);
                // handoversError는 HandoverContext에서 관리되므로 여기서는 초기화할 수 없음
              }}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center"
          >
            <Check className="text-green-500 mr-3" size={20} />
            <span className="text-green-700">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-500 hover:text-green-700"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 금일 인계사항 작성 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
            <Edit3 className="mr-2 text-blue-600" size={20} />
            금일 인계사항 작성
          </h2>
          
          {/* 오늘 작성된 인계사항이 있으면 표시 */}
          {todayHandovers.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-800 mb-2">오늘 작성된 인계사항:</p>
              {todayHandovers.map((handover) => (
                <div key={handover.id} className="mb-2 last:mb-0">
                  <p className="text-sm text-blue-700">{handover.content}</p>
                  <p className="text-xs text-blue-500 mt-1">
                    {handover.author_name} - {new Date(handover.created_at || '').toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <textarea
            value={currentHandover}
            onChange={(e) => {
              if (e.target.value.length <= 500) {
                setCurrentHandover(e.target.value);
              }
            }}
            rows={5}
            placeholder="오늘 처리해야 할 인계사항을 입력하세요..."
            className={clsx(
              "w-full p-3 border rounded-lg text-sm resize-none transition-colors",
              currentHandover.length > 450 
                ? "border-orange-300 focus:ring-orange-500 focus:border-orange-500" 
                : "border-slate-300 focus:ring-blue-500 focus:border-blue-500"
            )}
            disabled={saving}
          />
          <div className="mt-4 flex justify-between items-center">
            <span className={clsx(
              "text-xs",
              currentHandover.length > 450 
                ? "text-orange-600 font-medium" 
                : currentHandover.length > 400 
                  ? "text-yellow-600" 
                  : "text-slate-500"
            )}>
              {currentHandover.length}/500자
              {currentHandover.length > 450 && (
                <span className="ml-1 text-orange-500">
                  ({500 - currentHandover.length}자 남음)
                </span>
              )}
            </span>
            <button
              onClick={handleSaveHandover}
              disabled={!currentHandover.trim() || saving || currentHandover.length > 500}
              className={clsx(
                'font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center space-x-2',
                !currentHandover.trim() || saving || currentHandover.length > 500
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
              )}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>저장중...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>저장</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* 이전 인계사항 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-lg"
        >
          <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
            <CalendarDays className="mr-2 text-purple-600" size={20} />
            이전 인계사항
          </h2>
          
          {handoversLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : previousHandovers.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <AnimatePresence>
                {previousHandovers.map((handover, index) => (
                  <motion.div
                    key={handover.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors"
                  >
                    <p className="text-sm text-slate-800 leading-relaxed">{handover.content}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-slate-500">
                        {handover.author_name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDate(handover.date)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8">
              <CalendarDays size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">이전 인계사항이 없습니다.</p>
            </div>
          )}
        </motion.div>
      </section>

      {isAddTaskModalOpen && (
        <AddTaskModal 
          isOpen={isAddTaskModalOpen} 
          onClose={() => setIsAddTaskModalOpen(false)}
          initialDueDate={selectedDateForNewTask} // Pass selected date to modal
        />
      )}

      {/* 업무 수정 모달 */}
      {editingTask && (
        <EditTaskModal 
          task={editingTask}
          isOpen={!!editingTask} 
          onClose={() => {
            logger.debug('모달 닫기 클릭됨');
            setEditingTask(null);
          }}
          onSave={(updates: Partial<Task>) => {
            logger.debug('업무 저장:', updates);
            updateTask(editingTask.id, updates);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

// 업무 상세보기/수정 모달 컴포넌트
const EditTaskModal = ({ task, isOpen, onClose, onSave }: {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [startTime, setStartTime] = useState(task.startTime || '');
  const [endTime, setEndTime] = useState(task.endTime || '');
  const { hasPermission } = useAuth();

  if (!isOpen) {
    logger.debug('EditTaskModal: isOpen이 false라서 렌더링하지 않음');
    return null;
  }
  
  logger.debug('EditTaskModal: 렌더링 중, task:', task.title);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      updatedAt: new Date().toISOString()
    });
    setIsEditMode(false);
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    // 현재 task 값들로 form 필드 초기화
    setTitle(task.title);
    setDescription(task.description || '');
    setStartTime(task.startTime || '');
    setEndTime(task.endTime || '');
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return '긴급';
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return priority;
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isEditMode ? (
          // 수정 모드
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Edit size={24} className="mr-2 text-blue-600" />
                업무 수정
              </h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
          <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">제목</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>
              
          <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                  rows={4}
                  placeholder="업무에 대한 상세 설명을 입력하세요"
            />
          </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">시작 시간</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">종료 시간</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
                  onClick={() => setIsEditMode(false)}
                  className="px-6 py-2.5 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
            >
                  <Save size={18} />
                  <span>저장</span>
            </button>
          </div>
        </form>
      </div>
        ) : (
          // 상세보기 모드
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <AlertCircle size={24} className="mr-2 text-blue-600" />
                업무 상세정보
              </h2>
              <div className="flex items-center space-x-2">
                {hasPermission('tasks.update') && (
                  <button
                    onClick={handleEditClick}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                  >
                    <Edit size={16} />
                    <span>수정</span>
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X size={24} />
                </button>
    </div>
            </div>

            <div className="space-y-6">
              {/* 기본 정보 */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-800 mb-4">{task.title}</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 font-medium">상태:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusDisplayName(task.status)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-slate-500 font-medium">우선순위:</span>
                    <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                      {getPriorityText(task.priority)}
                    </span>
                  </div>
                  
                  <div>
                    <span className="text-slate-500 font-medium">마감일:</span>
                    <span className="ml-2 text-slate-800">{format(parseISO(task.dueDate), 'yyyy년 MM월 dd일')}</span>
                  </div>
                  
                  <div>
                    <span className="text-slate-500 font-medium">카테고리:</span>
                    <span className="ml-2 text-slate-800">{task.category}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className="text-slate-500 font-medium">담당자:</span>
                    <span className="ml-2 text-slate-800">
                      {Array.isArray(task.assignedToName) ? task.assignedToName.join(', ') : task.assignedToName}
                    </span>
                  </div>
                </div>
              </div>

              {/* 시간 정보 */}
              {(task.startTime || task.endTime) && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-slate-800 mb-3 flex items-center">
                    <Clock size={18} className="mr-2 text-blue-600" />
                    시간 정보
                  </h4>
                  <div className="flex items-center space-x-4 text-sm">
                    {task.startTime && (
                      <div>
                        <span className="text-slate-500 font-medium">시작:</span>
                        <span className="ml-2 text-slate-800">{task.startTime}</span>
                      </div>
                    )}
                    {task.endTime && (
                      <div>
                        <span className="text-slate-500 font-medium">종료:</span>
                        <span className="ml-2 text-slate-800">{task.endTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 설명 */}
              {task.description && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-md font-semibold text-slate-800 mb-3">상세 설명</h4>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              {/* 생성/수정 정보 */}
              <div className="bg-slate-100 rounded-lg p-4 text-xs text-slate-500">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">생성일:</span>
                    <span className="ml-2">{format(parseISO(task.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                  <div>
                    <span className="font-medium">수정일:</span>
                    <span className="ml-2">{format(parseISO(task.updatedAt), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default MyTasks;
