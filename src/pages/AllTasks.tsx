import {
  Bell,
  Megaphone,
  CalendarDays,
  ChevronDown,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { useTask, Task, TaskStatus, TaskPriority } from '../contexts/TaskContext';
import { useUser } from '../contexts/UserContext';
import { format, parseISO } from 'date-fns';
import { parse as dateFnsParse } from 'date-fns/parse'; 
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { ko, Locale } from 'date-fns/locale';
import { startOfWeek, getDay } from 'date-fns'; 
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../styles/calendar.css';
import TaskDetails from '../components/tasks/TaskDetails';

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

const getPriorityClass = (priority: TaskPriority | undefined) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'urgent': return 'bg-purple-600';
    case 'medium': return 'bg-orange-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getStatusDisplayName = (status: TaskStatus | undefined) => {
  switch (status) {
    case 'pending': return '대기중';
    case 'in-progress': return '진행중';
    case 'completed': return '완료';
    case 'cancelled': return '취소됨';
    default: return status || 'N/A';
  }
};

const getStatusBadgeClass = (status: TaskStatus | undefined) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

type AllTaskView = 'list' | 'month' | 'week' | 'day';

const AllTasks = () => {
  const { tasks: contextTasks } = useTask();
  const { staff: staffList, loadingStaff } = useUser();
  const [currentView, setCurrentView] = useState<AllTaskView>('list');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${
    ['일', '월', '화', '수', '목', '금', '토'][today.getDay()]
  }요일`;

  const staffOptions = useMemo(() => {
    const options = [{ id: 'all', name: '모든 직원' }];
    
    if (staffList && staffList.length > 0) {
      const activeStaff = staffList.filter(staff => staff.status === 'active');
      options.push(...activeStaff.map(staff => ({ id: staff.id, name: staff.name })));
    }
    
    return options;
  }, [staffList]);

  const filteredTasks = useMemo(() => {
    if (selectedStaffId === 'all') {
      return contextTasks;
    }
    
    return contextTasks.filter(task => 
      task.assignedTo && task.assignedTo.includes(selectedStaffId)
    );
  }, [contextTasks, selectedStaffId]);

  const getAssignedToDisplay = (task: Task) => {
    if (!staffList) return 'N/A';
    
    if (task.assignedTo && task.assignedTo.length > 0) {
      const assignedStaff = task.assignedTo
        .map(staffId => staffList.find(staff => staff.id === staffId))
        .filter(Boolean)
        .map(staff => staff!.name);
      
      return assignedStaff.length > 0 ? assignedStaff.join(', ') : '미배정';
    }
    
    return '미배정';
  };

  const calendarEvents: CalendarEvent[] = useMemo(() => filteredTasks.map(task => ({
    id: task.id,
    title: task.title,
    start: parseISO(task.dueDate),
    end: parseISO(task.dueDate),
    allDay: true,
    originalTask: task,
  })), [filteredTasks]);

  // 업무 선택 핸들러
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  // 캘린더 이벤트 클릭 핸들러
  const handleEventSelect = (event: CalendarEvent) => {
    handleTaskSelect(event.originalTask);
  };

  if (loadingStaff) {
    return (
      <div className="p-6 bg-slate-100 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-slate-600">직원 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">전체 업무 목록</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">{formattedDate}</span>
        </div>
      </header>

      <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center space-x-3 mb-6 shadow-md">
        <Megaphone size={24} className="flex-shrink-0" />
        <p className="text-sm font-medium">공지사항: 이번 주 금요일 오후 3시에 전체 회의가 있습니다. 모든 직원은 참석해주세요.</p>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-3 sm:mb-0">팀 업무 보기</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <select 
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="appearance-none bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8"
              >
                {staffOptions.map(staff => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <div className="flex items-center p-1 bg-slate-200 rounded-lg">
              {(['list', 'month', 'week', 'day'] as AllTaskView[]).map((view) => (
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
                value={format(calendarDate, 'yyyy-MM-dd')} 
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
          </div>
        </div>

        {currentView === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[15%]">담당자</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[35%]">업무</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">마감일</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">중요도</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                   <tr><td colSpan={5} className="text-center py-10 text-slate-500">표시할 업무가 없습니다.</td></tr>
                ) : (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-3 font-medium text-slate-800">{getAssignedToDisplay(task)}</td>
                      <td className="py-3 pr-3">
                        <p 
                          className="font-semibold text-slate-800 hover:text-blue-600 cursor-pointer transition-colors"
                          onClick={() => handleTaskSelect(task)}
                          title="클릭하여 상세 보기"
                        >
                          {task.title}
                        </p>
                        {task.description && <p className="text-xs text-slate-500 mt-1">{task.description}</p>}
                        {task.startTime && task.endTime && (
                          <p className="text-xs text-blue-600 mt-1">
                            {task.startTime} - {task.endTime}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(task.status)}`}>
                          {getStatusDisplayName(task.status)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 text-sm text-slate-700">{format(parseISO(task.dueDate), 'yyyy-MM-dd')}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block h-3 w-3 rounded-full ${getPriorityClass(task.priority)}`}></span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer}
              events={calendarEvents}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day']}
              view={currentView === 'month' ? 'month' : currentView === 'week' ? 'week' : 'day'}
              onView={(view) => setCurrentView(view as AllTaskView)}
              date={calendarDate}
              onNavigate={(date) => setCalendarDate(date)}
              onSelectEvent={handleEventSelect}
              culture="ko"
              messages={{
                next: '다음',
                previous: '이전',
                today: '오늘',
                month: '월',
                week: '주',
                day: '일',
                agenda: '일정',
                date: '날짜',
                time: '시간',
                event: '이벤트',
                noEventsInRange: '이 기간에는 이벤트가 없습니다.',
                showMore: (total) => `+${total} 더보기`
              }}
              eventPropGetter={(event) => ({
                style: {
                  backgroundColor: (() => {
                    switch (event.originalTask.priority) {
                      case 'urgent': return '#7c3aed';
                      case 'high': return '#ef4444';
                      case 'medium': return '#f97316';
                      case 'low': return '#22c55e';
                      default: return '#6b7280';
                    }
                  })(),
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }
              })}
              components={{
                event: ({ event }) => (
                  <div className="text-xs cursor-pointer">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-xs opacity-90">
                      {getAssignedToDisplay(event.originalTask)}
                    </div>
                  </div>
                )
              }}
            />
          </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-slate-500 mb-2">전체 업무</h3>
          <p className="text-2xl font-bold text-slate-800">{filteredTasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-slate-500 mb-2">진행중</h3>
          <p className="text-2xl font-bold text-blue-600">
            {filteredTasks.filter(task => task.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-slate-500 mb-2">완료</h3>
          <p className="text-2xl font-bold text-green-600">
            {filteredTasks.filter(task => task.status === 'completed').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-slate-500 mb-2">대기중</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {filteredTasks.filter(task => task.status === 'pending').length}
          </p>
        </div>
      </section>

      {showTaskDetails && selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

export default AllTasks;
