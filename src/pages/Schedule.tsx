import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Calendar, Clock, User, CheckSquare, MoreHorizontal, X, Edit, Trash, Dumbbell, Users as GroupIcon, UserCheck, MessageCircle, Shield, FileText, Loader } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths, addWeeks, subWeeks, parseISO, isSameDay, isSameMonth, getDate, getDaysInMonth, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import AddScheduleForm from '../components/forms/AddScheduleForm';
import EditScheduleForm from '../components/forms/EditScheduleForm';
import { useSchedule, Schedule as ScheduleType, SessionType } from '../contexts/ScheduleContext';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

// ... (기존 타입 정의 유지)

// 모달 ESC 닫기용 커스텀 훅
function useEscClose(closeFn: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeFn();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeFn, enabled]);
}

const Schedule = () => {
  const { user, isAdmin } = useAuth();
  const { schedules, filteredSchedules, filterSchedules, markScheduleComplete, deleteSchedule } = useSchedule();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month'>('week');
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduleType | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<SessionType | 'all'>('all');
  const [filterTrainer, setFilterTrainer] = useState<string>('all');
  const [showEditForm, setShowEditForm] = useState(false);
  // 날짜 확장 보기를 위한 상태 추가
  const [expandedDay, setExpandedDay] = useState<Date | null>(null);
  const [daySchedules, setDaySchedules] = useState<ScheduleType[]>([]);
  const [scheduleToDelete, setScheduleToDelete] = useState<ScheduleType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [completingSchedules, setCompletingSchedules] = useState<Set<string>>(new Set());
  
  // ESC 키 모달 닫기
  useEscClose(() => setShowDetails(false), showDetails);
  useEscClose(() => setExpandedDay(null), !!expandedDay);
  
  // 날짜에 맞는 일정 필터링
  useEffect(() => {
    let dateStr = format(currentDate, 'yyyy-MM-dd');
    
    if (currentView === 'month') {
      // 월간 보기에서는 날짜 필터를 적용하지 않음
      filterSchedules({
        searchQuery,
        type: filterType !== 'all' ? filterType : undefined,
        trainerId: filterTrainer !== 'all' ? filterTrainer : undefined
      });
    } else {
      filterSchedules({
        date: currentView === 'day' ? dateStr : undefined,
        searchQuery,
          type: filterType !== 'all' ? filterType : undefined,
          trainerId: filterTrainer !== 'all' ? filterTrainer : undefined
      });
    }
  }, [currentDate, currentView, searchQuery, filterType, filterTrainer, schedules]);
  
  // 이전 날짜로 이동
  const handlePrevious = () => {
    if (currentView === 'day') {
      setCurrentDate(addDays(currentDate, -1));
    } else if (currentView === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (currentView === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };
  
  // 다음 날짜로 이동
  const handleNext = () => {
    if (currentView === 'day') {
      setCurrentDate(addDays(currentDate, 1));
    } else if (currentView === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (currentView === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };
  
  // 오늘로 이동
  const handleToday = () => {
    setCurrentDate(new Date());
  };
  
  // 고유 트레이너 목록 생성
  const getUniqueTrainers = () => {
    const trainers = schedules.reduce((acc, schedule) => {
      if (!acc.find(t => t.id === schedule.trainerId)) {
        acc.push({
          id: schedule.trainerId,
          name: schedule.trainerName
        });
      }
      return acc;
    }, [] as { id: string; name: string }[]);
    
    return trainers.sort((a, b) => a.name.localeCompare(b.name));
  };
  
  // 요일별 일정 그룹화
  const getWeekSchedules = () => {
    const startDate = startOfWeek(currentDate, { locale: ko });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
    
    return weekDays.map(day => {
      const daySchedules = filteredSchedules.filter(schedule => 
        isSameDay(parseISO(schedule.date), day)
      );
      
      return {
        date: day,
        schedules: daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime))
      };
    });
  };
  
  // 월간 일정 그룹화를 위한 함수
  const getMonthSchedules = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { locale: ko });
    const endDate = endOfWeek(monthEnd, { locale: ko });
    
    const days = [];
    let day = startDate;
    
    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days.map(day => {
      const daySchedules = filteredSchedules.filter(schedule => 
        isSameDay(parseISO(schedule.date), day)
      );
      
      return {
        date: day,
        isCurrentMonth: isSameMonth(day, currentDate),
        schedules: daySchedules.sort((a, b) => a.startTime.localeCompare(b.startTime))
      };
    });
  };
  
  // 세션 유형에 따른 배지 색상
  const getSessionTypeColor = (type: SessionType) => {
    switch (type) {
      case 'PT':
        return 'bg-blue-600 text-white shadow-sm';
      case 'OT':
        return 'bg-green-600 text-white shadow-sm';
      case 'GROUP':
        return 'bg-purple-600 text-white shadow-sm';
      case 'CONSULT':
        return 'bg-orange-600 text-white shadow-sm';
    }
  };
  
  // 세션 유형 텍스트
  const getSessionTypeText = (type: SessionType) => {
    switch (type) {
      case 'PT': return 'PT 세션';
      case 'OT': return 'OT 세션';
      case 'GROUP': return '그룹 수업';
      case 'CONSULT': return '상담';
    }
  };
  
  // 일정 완료 상태 변경
  const handleCompleteToggle = async (id: string, isCompleted: boolean) => {
    console.log('완료 상태 변경 시도:', { id, isCompleted, newStatus: !isCompleted });
    
    // 로딩 상태 시작
    setCompletingSchedules(prev => new Set(prev).add(id));
    
    try {
      const result = await markScheduleComplete(id, !isCompleted);
      if (result) {
        console.log('완료 상태 변경 성공');
        // 선택된 일정이 있고 같은 ID라면 상태 업데이트
        if (selectedSchedule && selectedSchedule.id === id) {
          setSelectedSchedule({
            ...selectedSchedule,
            isCompleted: !isCompleted
          });
        }
      } else {
        console.error('완료 상태 변경 실패');
        alert('일정 완료 상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('완료 상태 변경 중 오류:', error);
      alert('일정 완료 상태 변경 중 오류가 발생했습니다.');
    } finally {
      // 로딩 상태 끝
      setCompletingSchedules(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };
  
  // 일정 삭제
  const handleDeleteSchedule = (id: string) => {
    const scheduleToDelete = schedules.find(s => s.id === id);
    
    if (!scheduleToDelete) return;
    
    // OT 세션 삭제는 관리자만 가능
    if (scheduleToDelete.type === 'OT' && !isAdmin) {
      alert('OT 세션은 관리자만 삭제할 수 있습니다.');
      return;
    }
    
    // 커스텀 확인 모달 표시
    setScheduleToDelete(scheduleToDelete);
    setShowDeleteConfirm(true);
  };

  // 삭제 확인 처리
  const confirmDelete = () => {
    if (scheduleToDelete) {
      deleteSchedule(scheduleToDelete.id);
      if (selectedSchedule?.id === scheduleToDelete.id) {
        setSelectedSchedule(null);
        setShowDetails(false);
      }
      setScheduleToDelete(null);
      setShowDeleteConfirm(false);
      
      // 성공 메시지 표시
      alert(`${scheduleToDelete.clientName}님의 ${getSessionTypeText(scheduleToDelete.type)} 일정이 삭제되었습니다.`);
    }
  };

  // 날짜 확장 보기 열기 함수
  const handleExpandDay = (day: Date, schedules: ScheduleType[]) => {
    setExpandedDay(day);
    setDaySchedules(schedules);
  };

  // 일정 유형별 아이콘/색상
  const getSessionTypeIcon = (type: SessionType) => {
    switch (type) {
      case 'PT': return <Dumbbell size={14} className="text-blue-500 mr-1" />;
      case 'OT': return <UserCheck size={14} className="text-green-500 mr-1" />;
      case 'GROUP': return <GroupIcon size={14} className="text-purple-500 mr-1" />;
      case 'CONSULT': return <MessageCircle size={14} className="text-orange-500 mr-1" />;
      default: return null;
    }
  };

  // ESC 키로 모달 닫기
  useEscClose(() => {
    if (showDetails) setShowDetails(false);
    if (showEditForm) setShowEditForm(false);
    if (showAddForm) setShowAddForm(false);
    if (showDeleteConfirm) setShowDeleteConfirm(false);
    if (expandedDay) setExpandedDay(null);
  }, showDetails || showEditForm || showAddForm || showDeleteConfirm || !!expandedDay);

  // 키보드 단축키 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 모달이 열려있을 때만 단축키 작동
      if (!selectedSchedule || !showDetails) return;
      
      // 입력 필드에 포커스가 있을 때는 단축키 비활성화
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch (e.key.toLowerCase()) {
        case 'e':
          if (selectedSchedule.type !== 'OT' || isAdmin) {
            e.preventDefault();
            setShowEditForm(true);
            setShowDetails(false);
          }
          break;
        case 'd':
          if (selectedSchedule.type !== 'OT' || isAdmin) {
            e.preventDefault();
            handleDeleteSchedule(selectedSchedule.id);
          }
          break;
        case ' ':
        case 'c':
          e.preventDefault();
          handleCompleteToggle(selectedSchedule.id, selectedSchedule.isCompleted);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedSchedule, showDetails, isAdmin]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 섹션 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center">
                <Calendar className="mr-3 text-blue-600" size={32} />
                일정 관리
              </h1>
              <p className="text-slate-600 mt-2">트레이너 스케줄과 회원 예약을 관리하세요</p>
            </div>
            
            {/* 검색 및 필터 */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="고객 또는 트레이너 검색"
                  className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as SessionType | 'all')}
              >
                <option value="all">모든 유형</option>
                <option value="PT">PT 세션</option>
                <option value="OT">OT 세션</option>
                <option value="GROUP">그룹 수업</option>
                <option value="CONSULT">상담</option>
              </select>
              
              <select
                className="px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filterTrainer}
                onChange={(e) => setFilterTrainer(e.target.value)}
              >
                <option value="all">모든 트레이너</option>
                {getUniqueTrainers().map(trainer => (
                  <option key={trainer.id} value={trainer.id}>
                    {trainer.name}
                  </option>
                ))}
              </select>
              
              {/* 필터 초기화 버튼 */}
              {(searchQuery !== '' || filterType !== 'all' || filterTrainer !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterTrainer('all');
                  }}
                  className="px-4 py-2.5 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-colors flex items-center space-x-2"
                  title="필터 초기화"
                >
                  <X size={18} />
                  <span>초기화</span>
                </button>
              )}
              
              <button 
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-all hover:scale-105 shadow-md hover:shadow-lg"
              >
                <Plus size={20} />
                <span>일정 추가</span>
              </button>
              
              {/* 개발용: 샘플 데이터 리셋 버튼 */}
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    localStorage.removeItem('schedules');
                    window.location.reload();
                  }}
                  className="px-4 py-2.5 border border-orange-300 rounded-lg text-orange-600 hover:text-orange-800 hover:bg-orange-50 transition-colors flex items-center space-x-2"
                  title="샘플 데이터로 리셋"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                    <path d="M21 3v5h-5"/>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                    <path d="M3 21v-5h5"/>
                  </svg>
                  <span>리셋</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 일정 보기 컨트롤 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* 뷰 모드 선택 */}
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setCurrentView('day')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  currentView === 'day' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                )}
              >
                일간
              </button>
              <button
                onClick={() => setCurrentView('week')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  currentView === 'week' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                )}
              >
                주간
              </button>
              <button
                onClick={() => setCurrentView('month')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-all',
                  currentView === 'month' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-white'
                )}
              >
                월간
              </button>
            </div>
            
            {/* 날짜 네비게이션 */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handlePrevious}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                
                <button
                  onClick={handleToday}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                  오늘
                </button>
                
                <button 
                  onClick={handleNext}
                  className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>
              
              {/* 현재 날짜 표시 */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900">
                  {currentView === 'day' 
                    ? format(currentDate, 'yyyy년 M월 d일 (EEEE)', { locale: ko }) 
                    : currentView === 'week'
                      ? `${format(startOfWeek(currentDate, { locale: ko }), 'yyyy년 M월 d일')} ~ ${format(addDays(startOfWeek(currentDate, { locale: ko }), 6), 'M월 d일')}`
                      : format(currentDate, 'yyyy년 M월', { locale: ko })
                  }
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        {/* 일정 내용 - 일간 보기 */}
        {currentView === 'day' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center">
                <Calendar className="mr-2 text-blue-600" size={20} />
                {format(currentDate, 'M월 d일 (EEEE)', { locale: ko })}의 일정
              </h3>
                
                {/* 활성 필터 배지 */}
                <div className="flex items-center space-x-2">
                  {filterTrainer !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <User size={12} className="mr-1" />
                      {getUniqueTrainers().find(t => t.id === filterTrainer)?.name}
                    </span>
                  )}
                  {filterType !== 'all' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {getSessionTypeText(filterType as SessionType)}
                    </span>
                  )}
                  {searchQuery !== '' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Search size={12} className="mr-1" />
                      "{searchQuery}"
                    </span>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                {filteredSchedules.filter(schedule => 
                  isSameDay(parseISO(schedule.date), currentDate)
                ).sort((a, b) => a.startTime.localeCompare(b.startTime)).map(schedule => (
                  <div 
                    key={schedule.id}
                    className={clsx(
                      "p-4 rounded-lg border transition-colors cursor-pointer hover:shadow-sm",
                      schedule.isCompleted 
                        ? "border-green-200 bg-green-50" 
                        : "border-slate-200 bg-white hover:border-slate-300",
                      // 선택된 트레이너 하이라이트
                      filterTrainer !== 'all' && schedule.trainerId === filterTrainer
                        ? "ring-2 ring-blue-300 border-blue-300 bg-blue-50"
                        : ""
                    )}
                    onClick={() => {
                      setSelectedSchedule(schedule);
                      setShowDetails(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(schedule.type)}`}>
                            {getSessionTypeText(schedule.type)}
                          </span>
                          {schedule.isCompleted && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckSquare size={12} className="mr-1" />
                              완료
                            </span>
                          )}
                          </div>
                          
                        <h4 className="text-lg font-semibold text-slate-900 mb-1">
                          {schedule.clientName}
                        </h4>
                        
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Clock size={14} className="mr-2" />
                            <span>{schedule.startTime} - {schedule.endTime}</span>
                          </div>
                          <div className="flex items-center">
                            <User size={14} className="mr-2" />
                            <span>{schedule.trainerName}</span>
                          </div>
                          {schedule.notes && (
                            <div className="flex items-start">
                              <FileText size={14} className="mr-2 mt-0.5" />
                              <span className="line-clamp-2">{schedule.notes}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 빠른 액션 버튼 */}
                      <div className="flex items-center space-x-1 ml-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCompleteToggle(schedule.id, schedule.isCompleted);
                          }}
                          disabled={completingSchedules.has(schedule.id)}
                          className={clsx(
                            "p-2 rounded-lg border-2 transition-all hover:scale-105",
                            completingSchedules.has(schedule.id) && "opacity-50 cursor-not-allowed",
                            schedule.isCompleted 
                              ? "text-green-700 bg-green-100 border-green-300 hover:bg-green-200 shadow-sm" 
                              : "text-slate-600 bg-white border-slate-300 hover:text-green-600 hover:border-green-300 hover:bg-green-50 shadow-sm"
                          )}
                          title={completingSchedules.has(schedule.id) ? "처리 중..." : (schedule.isCompleted ? "완료됨" : "완료로 표시")}
                        >
                          {completingSchedules.has(schedule.id) ? (
                            <Loader size={18} className="animate-spin" />
                          ) : (
                            <CheckSquare size={18} />
                          )}
                        </button>
                        
                        {(schedule.type !== 'OT' || isAdmin) && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSchedule(schedule);
                                setShowEditForm(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="수정"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSchedule(schedule.id);
                              }}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              title="삭제"
                            >
                              <Trash size={18} />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchedule(schedule);
                            setShowDetails(true);
                          }}
                          className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
                          title="상세 보기"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredSchedules.filter(schedule => 
                  isSameDay(parseISO(schedule.date), currentDate)
                ).length === 0 && (
                  <div className="py-12 text-center">
                    {(searchQuery !== '' || filterType !== 'all' || filterTrainer !== 'all') ? (
                      <>
                        <Filter className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <h4 className="text-lg font-medium text-slate-900 mb-2">검색 결과가 없습니다</h4>
                        <p className="text-slate-500 mb-4">
                          {filterTrainer !== 'all' && `"${getUniqueTrainers().find(t => t.id === filterTrainer)?.name}" 트레이너의 `}
                          {filterType !== 'all' && `"${getSessionTypeText(filterType as SessionType)}" `}
                          {searchQuery !== '' && `"${searchQuery}" 검색어에 대한 `}
                          일정이 이 날짜에 없습니다.
                        </p>
                        <div className="space-x-2">
                          <button 
                            onClick={() => {
                              setSearchQuery('');
                              setFilterType('all');
                              setFilterTrainer('all');
                            }}
                            className="inline-flex items-center px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            <X size={16} className="mr-1.5" />
                            필터 초기화
                          </button>
                          <button 
                            onClick={() => setShowAddForm(true)}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Plus size={16} className="mr-1.5" />
                            일정 추가하기
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                    <Calendar className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                    <h4 className="text-lg font-medium text-slate-900 mb-2">일정이 없습니다</h4>
                    <p className="text-slate-500 mb-4">이 날짜에 예정된 일정이 없습니다.</p>
                    <button 
                      onClick={() => setShowAddForm(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus size={16} className="mr-1.5" />
                      일정 추가하기
                    </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* 일정 내용 - 주간 보기 */}
        {currentView === 'week' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* 주간 헤더 */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
              {getWeekSchedules().map((day, index) => (
                <div 
                  key={index} 
                  className={clsx(
                    "py-4 px-2 text-center font-medium border-r last:border-r-0 border-slate-200",
                    isSameDay(day.date, new Date()) && "bg-blue-50 border-blue-200"
                  )}
                >
                  <p className="text-sm text-slate-500 mb-1">
                    {format(day.date, 'EEEE', { locale: ko })}
                  </p>
                  <p className={clsx(
                    "text-lg font-semibold",
                    isSameDay(day.date, new Date()) 
                      ? "text-blue-600" 
                      : "text-slate-900"
                  )}>
                    {format(day.date, 'd')}
                  </p>
                </div>
              ))}
            </div>
            
            {/* 주간 캘린더 그리드 */}
            <div className="grid grid-cols-7 min-h-[500px]" style={{ height: 'calc(100vh - 400px)' }}>
              {getWeekSchedules().map((day, index) => (
                <div 
                  key={index} 
                  className={clsx(
                    "border-r last:border-r-0 border-slate-200 p-3 overflow-y-auto",
                    isSameDay(day.date, new Date()) && "bg-blue-50/30"
                  )}
                >
                  <div className="space-y-2">
                    {day.schedules.map(schedule => (
                      <div 
                        key={schedule.id}
                        className={clsx(
                          "p-3 mb-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm group min-h-[80px]",
                          schedule.isCompleted 
                            ? "border-green-200 bg-green-50" 
                            : "border-slate-200 bg-white hover:border-slate-300",
                          // 선택된 트레이너 하이라이트
                          filterTrainer !== 'all' && schedule.trainerId === filterTrainer
                            ? "ring-2 ring-blue-300 border-blue-300 bg-blue-50"
                            : ""
                        )}
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowDetails(true);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-1 mb-1">
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getSessionTypeColor(schedule.type)}`}>
                                {schedule.type}
                          </span>
                              {schedule.isCompleted && (
                                <CheckSquare size={12} className="text-green-600" />
                              )}
                            </div>
                            
                            <h5 className="font-medium text-slate-900 text-sm mb-1 leading-tight">
                              {schedule.clientName}
                            </h5>
                            
                            <div className="text-xs text-slate-600 space-y-0.5">
                              <div className="flex items-center">
                                <Clock size={10} className="mr-1" />
                                <span>{schedule.startTime}-{schedule.endTime}</span>
                              </div>
                              <div className="flex items-center">
                                <User size={10} className="mr-1" />
                                <span className="text-xs">{schedule.trainerName}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* 빠른 액션 버튼 - 호버 시에만 표시 */}
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCompleteToggle(schedule.id, schedule.isCompleted);
                            }}
                            disabled={completingSchedules.has(schedule.id)}
                            className={clsx(
                                "p-1 rounded transition-colors",
                              completingSchedules.has(schedule.id) && "opacity-50 cursor-not-allowed",
                              schedule.isCompleted 
                                  ? "text-green-600 hover:bg-green-100"
                                  : "text-slate-400 hover:bg-slate-100 hover:text-green-600"
                            )}
                              title={completingSchedules.has(schedule.id) ? "처리 중..." : (schedule.isCompleted ? "완료 취소" : "완료 표시")}
                          >
                              {completingSchedules.has(schedule.id) ? (
                                <Loader size={14} className="animate-spin" />
                              ) : (
                                <CheckSquare size={14} />
                              )}
                          </button>
                            
                            {(schedule.type !== 'OT' || isAdmin) && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSchedule(schedule);
                                    setShowEditForm(true);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                  title="수정"
                                >
                                  <Edit size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSchedule(schedule.id);
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                                  title="삭제"
                                >
                                  <Trash size={14} />
                                </button>
                              </>
                            )}
                        </div>
                        </div>
                      </div>
                    ))}
                    
                    {day.schedules.length === 0 && (
                      <div 
                        className="h-32 flex flex-col items-center justify-center border-2 border-dashed border-blue-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all hover:scale-105 group"
                        onClick={() => {
                          setCurrentDate(day.date);
                          setShowAddForm(true);
                        }}
                      >
                        <Plus size={24} className="text-blue-500 mb-2 group-hover:text-blue-600" />
                        <span className="text-blue-600 text-sm font-medium text-center group-hover:text-blue-700">
                          일정 추가
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 일정 내용 - 월간 보기 */}
        {currentView === 'month' && (
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
              {getMonthSchedules().map((day, index) => (
                <div 
                  key={index} 
                  className={clsx(
                    "border-r border-b border-slate-200 p-1 overflow-hidden relative flex flex-col h-[120px]",
                    !day.isCurrentMonth && "bg-slate-50",
                    isSameDay(day.date, new Date()) && "bg-blue-50 ring-1 ring-blue-200"
                  )}
                >
                  {/* 날짜와 일정 추가 버튼 */}
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
                        onClick={() => handleExpandDay(day.date, day.schedules)}
                        title={day.schedules.length > 0 ? `${day.schedules.length}개 일정 보기` : "일정 추가"}
                    >
                      {format(day.date, 'd')}
                    </span>
                      {day.schedules.length > 2 && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-1 py-0.5 rounded-full font-medium">
                          +{day.schedules.length - 2}
                        </span>
                      )}
                    </div>
                    
                    {day.isCurrentMonth && (
                      <button 
                        className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-300 hover:border-blue-600 p-1 rounded transition-all"
                        onClick={() => {
                          setCurrentDate(day.date);
                          setShowAddForm(true);
                        }}
                        title="일정 추가"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                  </div>
                  
                  {/* 일정 목록 - 최대 2개만 표시 */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {day.schedules.slice(0, 2).map(schedule => (
                      <div 
                        key={schedule.id}
                        className={clsx(
                          "px-1.5 py-1 text-xs rounded cursor-pointer text-white font-medium transition-opacity hover:opacity-80 w-full",
                          schedule.type === 'PT' && "bg-blue-500",
                          schedule.type === 'OT' && "bg-green-500",
                          schedule.type === 'GROUP' && "bg-purple-500",
                          schedule.type === 'CONSULT' && "bg-orange-500",
                          schedule.isCompleted && "opacity-60",
                          // 선택된 트레이너 하이라이트
                          filterTrainer !== 'all' && schedule.trainerId === filterTrainer
                            ? "ring-1 ring-yellow-300"
                            : ""
                        )}
                        onClick={() => {
                          setSelectedSchedule(schedule);
                          setShowDetails(true);
                        }}
                        title={`${schedule.startTime} ${schedule.clientName} (${schedule.trainerName})`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center min-w-0 flex-1">
                          {getSessionTypeIcon(schedule.type)}
                            <span className="ml-1 text-xs font-semibold">
                              {schedule.startTime.slice(0, 5)}
                        </span>
                          </div>
                        </div>
                        <div className="text-xs font-medium leading-tight truncate">
                          {schedule.clientName}
                        </div>
                      </div>
                    ))}
                    
                    {/* 더 많은 일정이 있을 때 클릭 가능한 영역 */}
                    {day.schedules.length > 2 && (
                      <div 
                        className="text-xs text-slate-600 text-center py-1 cursor-pointer hover:bg-slate-100 rounded"
                        onClick={() => handleExpandDay(day.date, day.schedules)}
                      >
                        {day.schedules.length - 2}개 더 보기
                      </div>
                    )}
                    
                    {day.schedules.length === 0 && (
                      <div className="text-xs text-center text-slate-400 py-2">
                        일정 없음
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 일정 추가 폼 */}
        {showAddForm && (
          <AddScheduleForm 
            initialDate={format(currentDate, 'yyyy-MM-dd')} 
            onClose={() => setShowAddForm(false)} 
          />
        )}
        
        {/* 일정 수정 폼 */}
        {showEditForm && selectedSchedule && (
          <EditScheduleForm 
            schedule={selectedSchedule} 
            onClose={() => {
              setShowEditForm(false);
              setSelectedSchedule(null);
            }} 
            onSuccess={(updatedSchedule) => {
              setShowEditForm(false);
              setSelectedSchedule(null);
              alert(`${updatedSchedule.clientName}님의 ${getSessionTypeText(updatedSchedule.type)} 일정이 수정되었습니다.`);
            }}
          />
        )}
        
        {/* 일정 상세 보기 */}
        {showDetails && selectedSchedule && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowDetails(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  일정 상세 정보
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCompleteToggle(selectedSchedule.id, selectedSchedule.isCompleted)}
                    disabled={completingSchedules.has(selectedSchedule.id)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center",
                      completingSchedules.has(selectedSchedule.id) && "opacity-50 cursor-not-allowed",
                      selectedSchedule.isCompleted
                        ? "bg-green-100 text-green-800 hover:bg-green-200"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                    title={completingSchedules.has(selectedSchedule.id) ? "처리 중..." : (selectedSchedule.isCompleted ? "완료 취소" : "완료 표시")}
                  >
                    {completingSchedules.has(selectedSchedule.id) ? (
                      <Loader size={16} className="mr-1.5 animate-spin" />
                    ) : (
                      <CheckSquare size={16} className="mr-1.5" />
                    )}
                    {selectedSchedule.isCompleted ? "완료됨" : "완료 표시"}
                  </button>
                  
                  {(selectedSchedule.type !== 'OT' || isAdmin) && (
                    <>
                      <button
                        onClick={() => {
                          setShowEditForm(true);
                          setShowDetails(false);
                        }}
                        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="수정"
                      >
                        <Edit size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(selectedSchedule.id)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash size={20} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium",
                      getSessionTypeColor(selectedSchedule.type)
                    )}>
                      {getSessionTypeText(selectedSchedule.type)}
                    </span>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">{selectedSchedule.clientName}</h3>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center text-slate-700">
                    <Calendar size={18} className="mr-3 text-blue-600" />
                    <span>{format(parseISO(selectedSchedule.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}</span>
                  </div>
                  
                  <div className="flex items-center text-slate-700">
                    <Clock size={18} className="mr-3 text-blue-600" />
                    <span>{selectedSchedule.startTime} - {selectedSchedule.endTime}</span>
                  </div>
                  
                  <div className="flex items-center text-slate-700">
                    <User size={18} className="mr-3 text-blue-600" />
                    <span>담당 트레이너: {selectedSchedule.trainerName}</span>
                  </div>
                </div>
                
                {selectedSchedule.notes && (
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <h4 className="text-sm font-medium text-slate-900 mb-2">메모</h4>
                    <p className="text-slate-700">{selectedSchedule.notes}</p>
                  </div>
                )}
                
                {/* 키보드 단축키 안내 */}
                <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">키보드 단축키</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                    <div className="flex items-center">
                      <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-blue-800 font-mono mr-2">ESC</kbd>
                      <span>닫기</span>
                    </div>
                    <div className="flex items-center">
                      <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-blue-800 font-mono mr-2">C</kbd>
                      <span>완료 토글</span>
                    </div>
                    {(selectedSchedule.type !== 'OT' || isAdmin) && (
                      <>
                        <div className="flex items-center">
                          <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-blue-800 font-mono mr-2">E</kbd>
                          <span>수정</span>
                        </div>
                        <div className="flex items-center">
                          <kbd className="px-1.5 py-0.5 bg-white rounded border border-blue-300 text-blue-800 font-mono mr-2">D</kbd>
                          <span>삭제</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* 날짜별 일정 확장 보기 모달 */}
        {expandedDay && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setExpandedDay(null)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-slate-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                  {format(expandedDay, 'yyyy년 M월 d일 (EEEE)', { locale: ko })}의 일정
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setCurrentDate(expandedDay);
                      setShowAddForm(true);
                      setExpandedDay(null);
                    }}
                    className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    title="일정 추가"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    onClick={() => setExpandedDay(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              <div className="p-4 overflow-y-auto flex-grow schedule-scrollbar">
                <div className="space-y-3">
                  {daySchedules.length > 0 ? (
                    daySchedules
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                      .map(schedule => (
                        <div 
                          key={schedule.id}
                          className={clsx(
                            "p-3 rounded-lg border transition-colors cursor-pointer hover:shadow-sm",
                            schedule.isCompleted 
                              ? "border-green-200 bg-green-50" 
                              : "border-slate-200 bg-white hover:border-slate-300"
                          )}
                          onClick={() => {
                            setSelectedSchedule(schedule);
                            setShowDetails(true);
                            setExpandedDay(null);
                          }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              <div className="mt-0.5">
                                <span className={clsx(
                                  "px-2 py-1 rounded-full text-xs font-medium",
                                  getSessionTypeColor(schedule.type)
                                )}>
                                  {getSessionTypeText(schedule.type)}
                                </span>
                              </div>
                              
                              <div>
                                <h4 className="font-medium text-slate-900">{schedule.clientName}</h4>
                                <div className="flex items-center space-x-3 mt-1 text-sm">
                                  <span className="flex items-center text-slate-600">
                                    <Clock size={14} className="mr-1.5" />
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                  <span className="flex items-center text-slate-600">
                                    <User size={14} className="mr-1.5" />
                                    {schedule.trainerName}
                                  </span>
                                </div>
                                
                                {schedule.notes && (
                                  <p className="mt-2 text-sm text-slate-500">{schedule.notes}</p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCompleteToggle(schedule.id, schedule.isCompleted);
                                }}
                                disabled={completingSchedules.has(schedule.id)}
                                className={clsx(
                                  "p-2 rounded-lg border-2 transition-all hover:scale-105",
                                  completingSchedules.has(schedule.id) && "opacity-50 cursor-not-allowed",
                                  schedule.isCompleted 
                                    ? "text-green-700 bg-green-100 border-green-300 hover:bg-green-200 shadow-sm" 
                                    : "text-slate-600 bg-white border-slate-300 hover:text-green-600 hover:border-green-300 hover:bg-green-50 shadow-sm"
                                )}
                                title={completingSchedules.has(schedule.id) ? "처리 중..." : (schedule.isCompleted ? "완료됨" : "완료로 표시")}
                              >
                                {completingSchedules.has(schedule.id) ? (
                                  <Loader size={18} className="animate-spin" />
                                ) : (
                                  <CheckSquare size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-slate-500">이 날짜에 예정된 일정이 없습니다.</p>
                      <button 
                        onClick={() => {
                          setCurrentDate(expandedDay);
                          setShowAddForm(true);
                          setExpandedDay(null);
                        }}
                        className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Plus size={16} className="mr-1.5" />
                        일정 추가하기
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-200 text-center">
                <button
                  onClick={() => {
                    setCurrentDate(expandedDay);
                    setCurrentView('day');
                    setExpandedDay(null);
                  }}
                  className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg font-medium text-sm transition-colors"
                >
                  일간 보기로 전환
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 삭제 확인 모달 */}
        {showDeleteConfirm && scheduleToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div 
              className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Trash size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">일정 삭제</h3>
                    <p className="text-slate-600 text-sm">이 작업은 되돌릴 수 없습니다.</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSessionTypeColor(scheduleToDelete.type)}`}>
                        {getSessionTypeText(scheduleToDelete.type)}
                      </span>
                      <span className="ml-2 font-medium text-slate-900">{scheduleToDelete.clientName}</span>
                    </div>
                    <div className="text-sm text-slate-600">
                      📅 {format(parseISO(scheduleToDelete.date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
                    </div>
                    <div className="text-sm text-slate-600">
                      🕐 {scheduleToDelete.startTime} - {scheduleToDelete.endTime}
                    </div>
                    <div className="text-sm text-slate-600">
                      👨‍💼 {scheduleToDelete.trainerName}
                    </div>
                  </div>
                </div>
                
                <p className="text-slate-700 mb-6">
                  정말로 이 일정을 삭제하시겠습니까?
                </p>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                  >
                    <Trash size={16} className="mr-2" />
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Schedule;