import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOT, OTMember } from '../contexts/OTContext';
import { useUser } from '../contexts/UserContext';
import { 
  Eye, UserCheck, Clock, Phone, Calendar, Edit, Save, X, Plus, 
  CheckCircle, AlertCircle, UserPlus, UserX, MessageSquare, 
  PhoneCall, FileText, Zap 
} from 'lucide-react';
import QuickActionModal from '../components/ot/QuickActionModal';
import OTMemberDetailModal from '../components/ot/OTMemberDetailModal';
import { 
  checkAllAutomationNotifications, 
  calculateMemberPriority, 
  calculateTrainerWorkload 
} from '../utils/otAutomation';

// 새로운 5단계 상태 시스템
type OTStatus = 'new' | 'contacted' | 'scheduled' | 'progress' | 'completed';

const DAYS_OF_WEEK = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '평일', '주말'];
const TIME_SLOTS = [
  '오전 9시-11시', '오전 10시-12시', '오전 11시-1시',
  '오후 1시-3시', '오후 2시-4시', '오후 3시-5시',
  '저녁 6시-8시', '저녁 7시-9시', '저녁 8시-10시'
];

export default function OtDashboard() {
  const { user, isAdmin } = useAuth();
  const { staff: staffList } = useUser();
  const { 
    otMembers, 
    otProgress, 
    updateOTMember, 
    updateProgress, 
    addSession, 
    updateSession 
  } = useOT();

  const [toast, setToast] = useState<string|null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | OTStatus>('all');
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'list'>('dashboard');
  const [quickActionModal, setQuickActionModal] = useState<{
    isOpen: boolean;
    member: OTMember | null;
    actionType: 'sms' | 'call' | 'note' | null;
  }>({ isOpen: false, member: null, actionType: null });
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    member: OTMember | null;
  }>({ isOpen: false, member: null });

  // 권한에 따른 기본 회원 목록
  const baseMembers = (() => {
    if (!isAdmin && user) {
      const userStaffId = user.id;
      return otMembers.filter(member => member.assignedStaffId === userStaffId);
    }
    return otMembers;
  })();

  // 새로운 5단계 상태 시스템으로 분류
  const getMemberStatus = (member: OTMember): OTStatus => {
    const assignedStaff = member.assignedStaffId ? staffList?.find(s => s.id === member.assignedStaffId) : null;
    const progressKey = assignedStaff ? `${member.id}-${assignedStaff.id}` : '';
    const progress = progressKey ? otProgress[progressKey] : null;
    
    if (member.status === 'completed') return 'completed';
    if (progress && progress.completedSessions > 0) return 'progress';
    if (progress && progress.contactMade) return 'scheduled';
    if (member.assignedStaffId) return 'contacted';
    return 'new';
  };

  // 상태별 정보 (색상, 텍스트, 이모지)
  const getStatusInfo = (status: OTStatus) => {
    switch (status) {
      case 'new': return { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: '🔴 신규등록', 
        emoji: '🔴',
        description: '연락 필요'
      };
      case 'contacted': return { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: '🟡 연락완료', 
        emoji: '🟡',
        description: '일정 조율중'
      };
      case 'scheduled': return { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: '🟢 OT예약완료', 
        emoji: '🟢',
        description: 'OT 예약 완료'
      };
      case 'progress': return { 
        color: 'bg-blue-100 text-blue-800 border-blue-200', 
        text: '🔵 진행중', 
        emoji: '🔵',
        description: '1차/2차 완료'
      };
      case 'completed': return { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: '⚫ 완료', 
        emoji: '⚫',
        description: '완료'
      };
      default: return { 
        color: 'bg-gray-100 text-gray-800 border-gray-200', 
        text: '상태미정', 
        emoji: '⚪',
        description: '상태 미정'
      };
    }
  };

  // 상태 필터가 적용된 최종 회원 목록 (우선순위 정렬 포함)
  const filteredMembers = (statusFilter === 'all' 
    ? baseMembers 
    : baseMembers.filter(member => getMemberStatus(member) === statusFilter)
  ).sort((a, b) => {
    const aProgress = otProgress[`${a.id}-${a.assignedStaffId}`];
    const bProgress = otProgress[`${b.id}-${b.assignedStaffId}`];
    const aPriority = calculateMemberPriority(a, aProgress);
    const bPriority = calculateMemberPriority(b, bProgress);
    return bPriority - aPriority; // 높은 우선순위부터
  });

  // 통계 계산
  const statusCounts = {
    new: baseMembers.filter(m => getMemberStatus(m) === 'new').length,
    contacted: baseMembers.filter(m => getMemberStatus(m) === 'contacted').length,
    scheduled: baseMembers.filter(m => getMemberStatus(m) === 'scheduled').length,
    progress: baseMembers.filter(m => getMemberStatus(m) === 'progress').length,
    completed: baseMembers.filter(m => getMemberStatus(m) === 'completed').length,
  };

  // 오늘과 이번주 일정 계산
  const today = new Date();
  const thisWeekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
  const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const todayScheduled = Object.values(otProgress).filter(progress => 
    progress.sessions.some(session => 
      session.date === today.toISOString().split('T')[0] && !session.completed
    )
  ).length;

  const thisWeekScheduled = Object.values(otProgress).filter(progress => 
    progress.sessions.some(session => {
      const sessionDate = new Date(session.date);
      return sessionDate >= thisWeekStart && sessionDate < thisWeekEnd && !session.completed;
    })
  ).length;

  // 연락 대기 회원 계산 (배정됐지만 연락 안된 회원)
  const needContactMembers = baseMembers.filter(member => {
    const assignedStaff = member.assignedStaffId ? staffList?.find(s => s.id === member.assignedStaffId) : null;
    const progressKey = assignedStaff ? `${member.id}-${assignedStaff.id}` : '';
    const progress = progressKey ? otProgress[progressKey] : null;
    return member.assignedStaffId && (!progress || !progress.contactMade);
  }).length;

  // 자동화 알림 체크
  const automationNotifications = checkAllAutomationNotifications(baseMembers, otProgress, staffList || []);
  const totalNotifications = automationNotifications.reminders.length + 
                            automationNotifications.followUps.length + 
                            automationNotifications.conflicts.length;

  // 빠른 액션 함수들
  const handleQuickAction = (memberId: number, actionType: 'sms' | 'call' | 'note') => {
    const member = baseMembers.find(m => m.id === memberId);
    if (member) {
      setQuickActionModal({
        isOpen: true,
        member,
        actionType
      });
    }
  };

  const closeQuickActionModal = () => {
    setQuickActionModal({ isOpen: false, member: null, actionType: null });
  };

  const openDetailModal = (member: OTMember) => {
    setDetailModal({ isOpen: true, member });
  };

  const closeDetailModal = () => {
    setDetailModal({ isOpen: false, member: null });
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">OT 배정 대시보드</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin ? '회원의 OT 진행상황을 한눈에 보고 관리할 수 있습니다.' : '배정받은 OT 현황을 확인하고 진행상황을 기록할 수 있습니다.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 뷰 모드 전환 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'dashboard' 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📊 대시보드
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 목록
            </button>
          </div>

          {isAdmin && (
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <UserPlus size={16} />
              OT 회원 추가
            </button>
          )}
        </div>
      </div>

      {/* 토스트 알림 */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <CheckCircle size={16} className="mr-2" />
          {toast}
        </div>
      )}

      {viewMode === 'dashboard' ? (
        <>
          {/* 메인 대시보드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 진행 상황 카드 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">진행 상황별 현황</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { key: 'new' as OTStatus, label: '신규등록', count: statusCounts.new },
                    { key: 'contacted' as OTStatus, label: '연락완료', count: statusCounts.contacted },
                    { key: 'scheduled' as OTStatus, label: '예약완료', count: statusCounts.scheduled },
                    { key: 'progress' as OTStatus, label: '진행중', count: statusCounts.progress },
                    { key: 'completed' as OTStatus, label: '완료', count: statusCounts.completed }
                  ].map(status => {
                    const statusInfo = getStatusInfo(status.key);
                    return (
                      <button
                        key={status.key}
                        onClick={() => setStatusFilter(status.key)}
                        className={`p-4 rounded-lg border-2 text-center transition-all hover:shadow-md ${
                          statusFilter === status.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-2xl mb-2">{statusInfo.emoji}</div>
                        <div className="text-2xl font-bold text-gray-900 mb-1">{status.count}</div>
                        <div className="text-xs text-gray-600">{status.label}</div>
                      </button>
                    );
                  })}
                </div>
                
                {/* 진행 상황 설명 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">상태 설명</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span>🔴</span>
                      <span className="text-gray-600">신규 등록 (연락 필요)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🟡</span>
                      <span className="text-gray-600">연락 완료 (일정 조율중)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🟢</span>
                      <span className="text-gray-600">OT 예약 완료</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🔵</span>
                      <span className="text-gray-600">진행중 (1차/2차 완료)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>⚫</span>
                      <span className="text-gray-600">완료</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 알림 및 일정 카드 */}
            <div className="space-y-4">
              {/* 연락 대기 알림 */}
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="text-red-500" size={20} />
                  <h4 className="font-semibold text-red-800">연락 대기중인 회원</h4>
                </div>
                <div className="text-2xl font-bold text-red-600 mb-1">{needContactMembers}</div>
                <p className="text-sm text-red-600">명의 회원이 연락을 기다리고 있습니다</p>
                {needContactMembers > 0 && (
                  <button 
                    onClick={() => setStatusFilter('new')}
                    className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                  >
                    바로 확인
                  </button>
                )}
              </div>

              {/* 오늘 일정 */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="text-blue-500" size={20} />
                  <h4 className="font-semibold text-blue-800">오늘 예정 OT</h4>
                </div>
                <div className="text-2xl font-bold text-blue-600 mb-1">{todayScheduled}</div>
                <p className="text-sm text-blue-600">건의 OT가 예정되어 있습니다</p>
                {todayScheduled > 0 && (
                  <button 
                    onClick={() => setStatusFilter('scheduled')}
                    className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    오늘 일정 보기
                  </button>
                )}
              </div>

              {/* 이번주 일정 */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="text-green-500" size={20} />
                  <h4 className="font-semibold text-green-800">이번주 예정</h4>
                </div>
                <div className="text-2xl font-bold text-green-600 mb-1">{thisWeekScheduled}</div>
                <p className="text-sm text-green-600">건의 OT가 예정되어 있습니다</p>
                {thisWeekScheduled > 0 && (
                  <button 
                    onClick={() => setStatusFilter('scheduled')}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                  >
                    주간 일정 보기
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 트레이너별 담당 현황 */}
          {isAdmin && (
            <div className="bg-white rounded-xl shadow border p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">트레이너별 담당 현황</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staffList?.map(staff => {
                  const assignedMembers = otMembers.filter(m => m.assignedStaffId === staff.id);
                  const completedCount = assignedMembers.filter(m => getMemberStatus(m) === 'completed').length;
                  const progressCount = assignedMembers.filter(m => getMemberStatus(m) === 'progress').length;
                  const newCount = assignedMembers.filter(m => getMemberStatus(m) === 'new').length;
                  const workload = calculateTrainerWorkload(staff.id, otMembers, otProgress);
                  
                  return (
                    <div key={staff.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {staff.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                          <p className="text-sm text-gray-600">{staff.department}</p>
                          <div className="mt-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-500">워크로드</span>
                              <span className={`font-medium ${
                                workload.workloadPercentage > 80 ? 'text-red-600' :
                                workload.workloadPercentage > 60 ? 'text-yellow-600' : 
                                'text-green-600'
                              }`}>
                                {workload.workloadPercentage.toFixed(0)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className={`h-1.5 rounded-full transition-all ${
                                  workload.workloadPercentage > 80 ? 'bg-red-500' :
                                  workload.workloadPercentage > 60 ? 'bg-yellow-500' : 
                                  'bg-green-500'
                                }`}
                                style={{ width: `${workload.workloadPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-gray-900">{assignedMembers.length}</div>
                          <div className="text-xs text-gray-600">총 배정</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-blue-600">{progressCount}</div>
                          <div className="text-xs text-gray-600">진행중</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{completedCount}</div>
                          <div className="text-xs text-gray-600">완료</div>
                        </div>
                      </div>
                      {newCount > 0 && (
                        <div className="mt-2 px-2 py-1 bg-red-100 text-red-800 rounded text-xs text-center">
                          신규 {newCount}명 연락 필요
                        </div>
                      )}
                    </div>
                  );
                }) || []}
              </div>
            </div>
          )}

          {/* 자동화 알림 패널 */}
          {totalNotifications > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="text-yellow-600" size={20} />
                <h3 className="text-lg font-bold text-yellow-800">자동화 알림</h3>
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-medium">
                  {totalNotifications}개
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 리마인더 알림 */}
                {automationNotifications.reminders.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="text-blue-500" size={16} />
                      <h4 className="font-semibold text-blue-800">OT 리마인더</h4>
                      <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {automationNotifications.reminders.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {automationNotifications.reminders.slice(0, 3).map((reminder, index) => (
                        <p key={index} className="text-xs text-gray-600">{reminder}</p>
                      ))}
                      {automationNotifications.reminders.length > 3 && (
                        <p className="text-xs text-blue-600">외 {automationNotifications.reminders.length - 3}건 더...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 재연락 알림 */}
                {automationNotifications.followUps.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="text-red-500" size={16} />
                      <h4 className="font-semibold text-red-800">재연락 필요</h4>
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                        {automationNotifications.followUps.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {automationNotifications.followUps.slice(0, 3).map((followUp, index) => (
                        <p key={index} className="text-xs text-gray-600">{followUp}</p>
                      ))}
                      {automationNotifications.followUps.length > 3 && (
                        <p className="text-xs text-red-600">외 {automationNotifications.followUps.length - 3}건 더...</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 스케줄 충돌 알림 */}
                {automationNotifications.conflicts.length > 0 && (
                  <div className="bg-white rounded-lg p-4 border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="text-orange-500" size={16} />
                      <h4 className="font-semibold text-orange-800">스케줄 충돌</h4>
                      <span className="px-1.5 py-0.5 bg-orange-100 text-orange-800 rounded-full text-xs">
                        {automationNotifications.conflicts.length}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {automationNotifications.conflicts.slice(0, 3).map((conflict, index) => (
                        <p key={index} className="text-xs text-gray-600">{conflict}</p>
                      ))}
                      {automationNotifications.conflicts.length > 3 && (
                        <p className="text-xs text-orange-600">외 {automationNotifications.conflicts.length - 3}건 더...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* 목록 뷰 - 기존 통계 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
            <button
              onClick={() => setStatusFilter('all')}
              className={`bg-white p-4 rounded-xl shadow border hover:shadow-lg transition-all duration-200 text-left ${
                statusFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{isAdmin ? '전체' : '배정받은'}</p>
                  <p className="text-2xl font-bold text-gray-900">{baseMembers.length}</p>
                </div>
                <div className={`p-3 rounded-lg ${statusFilter === 'all' ? 'bg-blue-200' : 'bg-blue-100'}`}>
                  <UserCheck className="text-blue-600" size={20} />
                </div>
              </div>
            </button>
            
            {[
              { key: 'new' as OTStatus, label: '신규', color: 'red', icon: AlertCircle },
              { key: 'contacted' as OTStatus, label: '연락완료', color: 'yellow', icon: Phone },
              { key: 'scheduled' as OTStatus, label: '예약완료', color: 'green', icon: Calendar },
              { key: 'progress' as OTStatus, label: '진행중', color: 'blue', icon: Clock },
              { key: 'completed' as OTStatus, label: '완료', color: 'gray', icon: CheckCircle }
            ].map(status => {
              const count = statusCounts[status.key];
              const IconComponent = status.icon;
              const colorClasses = {
                red: { bg: 'bg-red-100', text: 'text-red-600', ring: 'ring-red-500', bgSelected: 'bg-red-50' },
                yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', ring: 'ring-yellow-500', bgSelected: 'bg-yellow-50' },
                green: { bg: 'bg-green-100', text: 'text-green-600', ring: 'ring-green-500', bgSelected: 'bg-green-50' },
                blue: { bg: 'bg-blue-100', text: 'text-blue-600', ring: 'ring-blue-500', bgSelected: 'bg-blue-50' },
                gray: { bg: 'bg-gray-100', text: 'text-gray-600', ring: 'ring-gray-500', bgSelected: 'bg-gray-50' }
              }[status.color];
              
              return (
                <button
                  key={status.key}
                  onClick={() => setStatusFilter(status.key)}
                  className={`bg-white p-4 rounded-xl shadow border hover:shadow-lg transition-all duration-200 text-left ${
                    statusFilter === status.key ? `ring-2 ${colorClasses.ring} ${colorClasses.bgSelected}` : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{status.label}</p>
                      <p className={`text-2xl font-bold ${colorClasses.text}`}>{count}</p>
                    </div>
                    <div className={`p-3 rounded-lg ${statusFilter === status.key ? colorClasses.bg : 'bg-gray-100'}`}>
                      <IconComponent className={colorClasses.text} size={20} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 회원 목록/카드 */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl shadow border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <UserCheck size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {statusFilter === 'all' ? (isAdmin ? 'OT 회원이 없습니다' : '배정받은 OT가 없습니다') :
             `${getStatusInfo(statusFilter as OTStatus).text.replace(/[🔴🟡🟢🔵⚫]/g, '').trim()} 상태의 회원이 없습니다`}
          </h3>
          <p className="text-gray-500 mb-4">
            {statusFilter === 'all' ? 
              (isAdmin ? 'OT 회원을 추가해보세요.' : '관리자가 OT를 배정할 때까지 기다려주세요.') :
              '다른 상태의 회원을 확인해보세요.'
            }
          </p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              전체 회원 보기
            </button>
          )}
        </div>
      ) : viewMode === 'list' ? (
        /* 리스트 뷰 */
        <div className="bg-white rounded-xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">회원정보</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OT 1차</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">OT 2차</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">진행률</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member, index) => {
                  const assignedStaff = member.assignedStaffId ? staffList?.find(s => s.id === member.assignedStaffId) : null;
                  const progressKey = assignedStaff ? `${member.id}-${assignedStaff.id}` : '';
                  const progress = progressKey ? otProgress[progressKey] : null;
                  const memberStatus = getMemberStatus(member);
                  const statusInfo = getStatusInfo(memberStatus);
                  const priority = calculateMemberPriority(member, progress);
                  const isHighPriority = priority > 15;
                  const completedSessions = progress ? progress.completedSessions : 0;
                  const totalSessions = member.otCount || 2;
                  const progressPercentage = (completedSessions / totalSessions) * 100;
                  
                  return (
                    <tr key={member.id} className={`hover:bg-gray-50 transition-colors ${isHighPriority ? 'bg-red-50' : ''}`}>
                      {/* 회원정보 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                              {member.name.charAt(0)}
                            </div>
                          </div>
                          <div className="ml-3">
                            <button
                              onClick={() => openDetailModal(member)}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {member.name}
                            </button>
                            <div className="text-xs text-gray-500">{member.phone}</div>
                            {member.membershipType && (
                              <div className="text-xs text-blue-600">{member.membershipType}</div>
                            )}
                          </div>
                          {isHighPriority && (
                            <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                              🔥
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 상태 */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                      </td>

                      {/* OT 1차 */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {member.ot1Status === 'completed' ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : member.ot1Status === 'scheduled' ? (
                            <Clock size={16} className="text-blue-500" />
                          ) : (
                            <AlertCircle size={16} className="text-gray-400" />
                          )}
                          <span className={`text-sm ${
                            member.ot1Status === 'completed' ? 'text-green-600' :
                            member.ot1Status === 'scheduled' ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {member.ot1Status === 'completed' ? '완료' :
                             member.ot1Status === 'scheduled' ? '예약' : '대기'}
                          </span>
                        </div>
                        {member.ot1ScheduledDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(member.ot1ScheduledDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* OT 2차 */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {member.ot2Status === 'completed' ? (
                            <CheckCircle size={16} className="text-green-500" />
                          ) : member.ot2Status === 'scheduled' ? (
                            <Clock size={16} className="text-blue-500" />
                          ) : (
                            <AlertCircle size={16} className="text-gray-400" />
                          )}
                          <span className={`text-sm ${
                            member.ot2Status === 'completed' ? 'text-green-600' :
                            member.ot2Status === 'scheduled' ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {member.ot2Status === 'completed' ? '완료' :
                             member.ot2Status === 'scheduled' ? '예약' : '대기'}
                          </span>
                        </div>
                        {member.ot2ScheduledDate && (
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(member.ot2ScheduledDate).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* 담당자 */}
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {assignedStaff && (
                            <div className="text-gray-900">{assignedStaff.name}</div>
                          )}
                          {member.fcStaffId && (
                            <div className="text-xs text-gray-500">
                              FC: {staffList?.find(s => s.id === member.fcStaffId)?.name || '정보 없음'}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 진행률 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          <div className="w-full max-w-[100px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">{completedSessions}/{totalSessions}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all ${
                                  progressPercentage === 100 ? 'bg-green-500' :
                                  progressPercentage > 0 ? 'bg-blue-500' : 'bg-gray-300'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 액션 */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickAction(member.id, 'sms')}
                            className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title="문자"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            onClick={() => handleQuickAction(member.id, 'call')}
                            className="p-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                            title="통화"
                          >
                            <PhoneCall size={14} />
                          </button>
                          <button
                            onClick={() => handleQuickAction(member.id, 'note')}
                            className="p-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                            title="메모"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => openDetailModal(member)}
                            className="p-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                            title="상세"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 카드 뷰 */
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredMembers.map(member => {
            const assignedStaff = member.assignedStaffId ? staffList?.find(s => s.id === member.assignedStaffId) : null;
            const progressKey = assignedStaff ? `${member.id}-${assignedStaff.id}` : '';
            const progress = progressKey ? otProgress[progressKey] : null;
            const memberStatus = getMemberStatus(member);
            const statusInfo = getStatusInfo(memberStatus);
            const priority = calculateMemberPriority(member, progress);
            const isHighPriority = priority > 15;
            
            return (
              <div key={member.id} className={`bg-white rounded-xl shadow border hover:shadow-lg transition-shadow ${
                isHighPriority ? 'ring-2 ring-red-200 bg-red-50' : ''
              }`}>
                <div className="p-6">
                  {/* 회원 정보 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 cursor-pointer" onClick={() => openDetailModal(member)}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {member.name}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.text}
                        </span>
                        {isHighPriority && (
                          <span className="px-2 py-1 bg-red-500 text-white rounded-full text-xs font-medium">
                            🔥 우선순위
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-gray-600 mb-2">
                        <Phone size={14} className="mr-1" />
                        <span className="text-sm">{member.phone}</span>
                        {member.gender && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="text-sm">{member.gender === 'male' ? '남성' : '여성'}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>등록일: {member.registeredAt}</span>
                        {member.startDate && (
                          <>
                            <span>•</span>
                            <span>시작일: {member.startDate}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="font-medium text-blue-600">
                          {member.membershipType || '회원권 미설정'}
                        </span>
                      </div>
                      {member.exerciseGoal && (
                        <div className="mt-1 text-xs text-purple-600 font-medium">
                          목표: {member.exerciseGoal}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openDetailModal(member)}
                      className="text-blue-500 hover:text-blue-600 p-1 ml-2"
                      title="상세 정보 보기"
                    >
                      <Eye size={16} />
                    </button>
                  </div>

                  {/* 빠른 액션 버튼 */}
                  <div className="flex items-center gap-2 mb-4">
                    <button
                      onClick={() => handleQuickAction(member.id, 'sms')}
                      className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                      title="원클릭 문자 발송"
                    >
                      <MessageSquare size={14} />
                      문자
                    </button>
                    <button
                      onClick={() => handleQuickAction(member.id, 'call')}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                      title="통화 기록"
                    >
                      <PhoneCall size={14} />
                      통화
                    </button>
                    <button
                      onClick={() => handleQuickAction(member.id, 'note')}
                      className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors text-sm"
                      title="메모 추가"
                    >
                      <FileText size={14} />
                      메모
                    </button>
                    {memberStatus === 'new' && (
                      <button
                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                        title="우선 처리"
                      >
                        <Zap size={14} />
                        긴급
                      </button>
                    )}
                  </div>

                  {/* OT 진행 상황 - 개선된 버전 */}
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                        <span>OT 진행 상황</span>
                        <span className="text-xs font-normal text-gray-600">
                          ({(member.ot1Status === 'completed' ? 1 : 0) + (member.ot2Status === 'completed' ? 1 : 0)}/2 완료)
                        </span>
                      </h4>
                      <div className="flex items-center gap-1">
                        {member.ot1Status === 'completed' && member.ot2Status === 'completed' && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                            ✅ 모두 완료
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {/* OT 1차 */}
                      <div className={`relative p-3 bg-white rounded-lg border-2 transition-all ${
                        member.ot1Status === 'completed' ? 'border-green-300 bg-green-50' :
                        member.ot1Status === 'scheduled' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              member.ot1Status === 'completed' ? 'bg-green-500' :
                              member.ot1Status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                              <span className="text-white font-bold text-sm">1</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">OT 1차</span>
                                {member.ot1Status === 'completed' && (
                                  <CheckCircle size={16} className="text-green-500" />
                                )}
                                {member.ot1Status === 'scheduled' && (
                                  <Clock size={16} className="text-blue-500" />
                                )}
                              </div>
                              {member.ot1ScheduledDate && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {member.ot1Status === 'completed' ? '완료일' : '예약일'}: {new Date(member.ot1ScheduledDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              member.ot1Status === 'completed' ? 'bg-green-100 text-green-700' :
                              member.ot1Status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {member.ot1Status === 'completed' ? '완료' :
                               member.ot1Status === 'scheduled' ? '예약됨' : '대기중'}
                            </span>
                            {member.ot1Status === 'scheduled' && (
                              <button
                                onClick={() => {
                                  updateOTMember(member.id, { 
                                    ot1Status: 'completed',
                                    ot1CompletedDate: new Date().toISOString()
                                  });
                                  showToast('OT 1차가 완료 처리되었습니다.');
                                }}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              >
                                완료 체크
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* OT 2차 */}
                      <div className={`relative p-3 bg-white rounded-lg border-2 transition-all ${
                        member.ot2Status === 'completed' ? 'border-green-300 bg-green-50' :
                        member.ot2Status === 'scheduled' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                      } ${member.ot1Status !== 'completed' ? 'opacity-60' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              member.ot2Status === 'completed' ? 'bg-green-500' :
                              member.ot2Status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-300'
                            }`}>
                              <span className="text-white font-bold text-sm">2</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">OT 2차</span>
                                {member.ot2Status === 'completed' && (
                                  <CheckCircle size={16} className="text-green-500" />
                                )}
                                {member.ot2Status === 'scheduled' && (
                                  <Clock size={16} className="text-blue-500" />
                                )}
                              </div>
                              {member.ot2ScheduledDate && (
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {member.ot2Status === 'completed' ? '완료일' : '예약일'}: {new Date(member.ot2ScheduledDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              member.ot2Status === 'completed' ? 'bg-green-100 text-green-700' :
                              member.ot2Status === 'scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {member.ot2Status === 'completed' ? '완료' :
                               member.ot2Status === 'scheduled' ? '예약됨' : '대기중'}
                            </span>
                            {member.ot2Status === 'scheduled' && member.ot1Status === 'completed' && (
                              <button
                                onClick={() => {
                                  updateOTMember(member.id, { 
                                    ot2Status: 'completed',
                                    ot2CompletedDate: new Date().toISOString()
                                  });
                                  showToast('OT 2차가 완료 처리되었습니다.');
                                }}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              >
                                완료 체크
                              </button>
                            )}
                          </div>
                        </div>
                        {member.ot1Status !== 'completed' && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
                              1차 완료 후 진행 가능
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 진행률 표시 */}
                    <div className="mt-3 pt-3 border-t border-blue-100">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>전체 진행률</span>
                        <span className="font-medium">
                          {Math.round(((member.ot1Status === 'completed' ? 1 : 0) + (member.ot2Status === 'completed' ? 1 : 0)) / 2 * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${((member.ot1Status === 'completed' ? 1 : 0) + (member.ot2Status === 'completed' ? 1 : 0)) / 2 * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 담당자 정보 */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="space-y-2">
                      {assignedStaff && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">담당 트레이너</span>
                          <span className="text-sm font-medium text-gray-900">
                            {assignedStaff.name} ({assignedStaff.department})
                          </span>
                        </div>
                      )}
                      {member.fcStaffId && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">담당 FC</span>
                          <span className="text-sm font-medium text-gray-900">
                            {staffList?.find(s => s.id === member.fcStaffId)?.name || '정보 없음'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 진행 상황 */}
                  {progress && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-800">진행 상황</h4>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {progress.contactMade ? (
                            <CheckCircle size={14} className="text-green-500" />
                          ) : (
                            <AlertCircle size={14} className="text-red-500" />
                          )}
                          <span className="text-xs text-gray-700">
                            고객 연락: {progress.contactMade ? '완료' : '미완료'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-700">
                          진행: {progress.completedSessions}/{progress.totalSessions} 회 
                          {progress.totalSessions === 1 ? ' (1회 OT)' : ' (2회 OT)'}
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(progress.completedSessions / progress.totalSessions) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 상태별 액션 */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {statusInfo.description}
                    </div>
                    
                    {memberStatus === 'new' && (
                      <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">
                        연락하기
                      </button>
                    )}
                    {memberStatus === 'contacted' && (
                      <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700">
                        일정 잡기
                      </button>
                    )}
                    {memberStatus === 'scheduled' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">
                        OT 시작
                      </button>
                    )}
                    {memberStatus === 'progress' && (
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                        진행 기록
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 빠른 액션 모달 */}
      <QuickActionModal
        isOpen={quickActionModal.isOpen}
        onClose={closeQuickActionModal}
        member={quickActionModal.member}
        actionType={quickActionModal.actionType}
      />

      {/* 회원 상세 정보 모달 */}
      <OTMemberDetailModal
        isOpen={detailModal.isOpen}
        onClose={closeDetailModal}
        member={detailModal.member}
        onUpdateMember={(updates) => {
          if (detailModal.member) {
            updateOTMember(detailModal.member.id, updates);
            showToast('회원 정보가 업데이트되었습니다.');
          }
        }}
      />
    </div>
  );
}