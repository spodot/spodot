import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useOT, OTMember } from '../contexts/OTContext';
import { useUser } from '../contexts/UserContext';
import { Eye, UserCheck, Clock, Phone, Calendar, Edit, Save, X, Plus, CheckCircle, AlertCircle, UserPlus, UserX } from 'lucide-react';

const DAYS_OF_WEEK = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일', '평일', '주말'];
const TIME_SLOTS = [
  '오전 9시-11시', '오전 10시-12시', '오전 11시-1시',
  '오후 1시-3시', '오후 2시-4시', '오후 3시-5시',
  '저녁 6시-8시', '저녁 7시-9시', '저녁 8시-10시'
];

// OT 회원 추가 모달 컴포넌트
interface AddOTMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddOTMemberModal = ({ isOpen, onClose }: AddOTMemberModalProps) => {
  const { addOTMember } = useOT();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    otCount: 1,
    preferredDays: [] as string[],
    preferredTimes: [] as string[],
    notes: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('이름과 연락처는 필수입니다.');
      return;
    }

    addOTMember({
      name: formData.name,
      phone: formData.phone,
      email: formData.email,
      otCount: formData.otCount,
      totalSessions: formData.otCount,
      preferredDays: formData.preferredDays,
      preferredTimes: formData.preferredTimes,
      notes: formData.notes,
      status: 'pending'
    });

    // 폼 초기화
    setFormData({
      name: '',
      phone: '',
      email: '',
      otCount: 1,
      preferredDays: [],
      preferredTimes: [],
      notes: ''
    });

    onClose();
  };

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      preferredDays: prev.preferredDays.includes(day)
        ? prev.preferredDays.filter(d => d !== day)
        : [...prev.preferredDays, day]
    }));
  };

  const toggleTime = (time: string) => {
    setFormData(prev => ({
      ...prev,
      preferredTimes: prev.preferredTimes.includes(time)
        ? prev.preferredTimes.filter(t => t !== time)
        : [...prev.preferredTimes, time]
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto my-8">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <UserPlus size={20} className="mr-2 text-blue-500" />
            OT 회원 추가
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input w-full"
                placeholder="회원 이름"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input w-full"
                placeholder="010-0000-0000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input w-full"
                placeholder="example@email.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OT 횟수
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value={1}
                    checked={formData.otCount === 1}
                    onChange={(e) => setFormData({ ...formData, otCount: parseInt(e.target.value) })}
                    className="mr-2"
                  />
                  <span>1회</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value={2}
                    checked={formData.otCount === 2}
                    onChange={(e) => setFormData({ ...formData, otCount: parseInt(e.target.value) })}
                    className="mr-2"
                  />
                  <span>2회</span>
                </label>
              </div>
            </div>
          </div>

          {/* 희망 요일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">희망 요일</label>
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1 text-sm rounded ${
                    formData.preferredDays.includes(day)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* 희망 시간대 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">희망 시간대</label>
            <div className="flex flex-wrap gap-2">
              {TIME_SLOTS.map(time => (
                <button
                  key={time}
                  type="button"
                  onClick={() => toggleTime(time)}
                  className={`px-3 py-1 text-sm rounded ${
                    formData.preferredTimes.includes(time)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          {/* 특이사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">특이사항</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-textarea w-full"
              rows={3}
              placeholder="회원의 특이사항, 운동 목표, 주의사항 등을 입력하세요"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <UserPlus size={16} className="mr-2" />
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function OtAssignment() {
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
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<OTMember>>({});
  const [showProgressModal, setShowProgressModal] = useState<string | null>(null);
  const [newSessionData, setNewSessionData] = useState({ date: '', time: '', notes: '' });
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'assigned' | 'completed'>('all');
  const [showStaffDetailModal, setShowStaffDetailModal] = useState<string | null>(null);

  // 권한에 따른 기본 회원 목록 (상태 필터 적용 전)
  const baseMembers = (() => {
    if (!isAdmin && user) {
      // user.id는 string이므로 assignments와 비교할 때 타입 맞춤
      const userStaffId = user.id;
      return otMembers.filter(member => 
        member.assignedStaffId === userStaffId
      );
    }
    return otMembers;
  })();

  // 상태 필터가 적용된 최종 회원 목록
  const filteredMembers = statusFilter === 'all' 
    ? baseMembers 
    : baseMembers.filter(member => member.status === statusFilter);

  // 통계 카드 클릭 핸들러
  const handleStatusFilterClick = (status: 'all' | 'pending' | 'assigned' | 'completed') => {
    setStatusFilter(status);
  };

  const handleAssign = (memberId: number, staffId: string) => {
    if (!isAdmin) {
      setToast('권한이 없습니다. 관리자만 배정할 수 있습니다.');
      setTimeout(() => setToast(null), 2000);
      return;
    }

    // OTMember의 assignedStaffId 직접 업데이트
    updateOTMember(memberId, { 
      assignedStaffId: staffId, 
      status: 'assigned' 
    });
    
    setToast('담당자 배정 완료!');
    setTimeout(() => setToast(null), 1200);
  };

  const handleEditMember = (member: OTMember) => {
    if (!isAdmin) {
      setToast('권한이 없습니다. 관리자만 수정할 수 있습니다.');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    
    setEditingMember(member.id);
    setEditData({
      preferredDays: member.preferredDays || [],
      preferredTimes: member.preferredTimes || [],
      notes: member.notes || ''
    });
  };

  const handleSaveEdit = () => {
    if (editingMember) {
      updateOTMember(editingMember, editData);
      setEditingMember(null);
      setEditData({});
      setToast('회원 정보가 업데이트되었습니다.');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleContactUpdate = (progressKey: string, contactData: { contactMade: boolean; contactDate?: string; contactNotes?: string }) => {
    updateProgress(progressKey, contactData);
    setToast('연락 기록이 업데이트되었습니다.');
    setTimeout(() => setToast(null), 2000);
  };

  const handleAddSession = (progressKey: string) => {
    if (!newSessionData.date || !newSessionData.time) {
      setToast('날짜와 시간을 입력해주세요.');
      setTimeout(() => setToast(null), 2000);
      return;
    }

    addSession(progressKey, {
      date: newSessionData.date,
      time: newSessionData.time,
      completed: false,
      notes: newSessionData.notes
    });

    setNewSessionData({ date: '', time: '', notes: '' });
    setToast('세션이 추가되었습니다.');
    setTimeout(() => setToast(null), 2000);
  };

  const handleSessionComplete = (progressKey: string, sessionId: string, completed: boolean) => {
    updateSession(progressKey, sessionId, { completed });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중';
      case 'assigned': return '배정됨';
      case 'completed': return '완료';
      default: return '알 수 없음';
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">OT 배정 관리</h2>
          <p className="text-gray-600 mt-1">
            {isAdmin ? '회원의 OT 담당자를 배정하고 관리할 수 있습니다.' : '본인에게 배정된 OT 현황을 확인하고 진행 상황을 기록할 수 있습니다.'}
          </p>
          {statusFilter !== 'all' && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm text-gray-500">필터:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                statusFilter === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                statusFilter === 'assigned' ? 'bg-blue-100 text-blue-800' :
                statusFilter === 'completed' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {statusFilter === 'pending' ? '배정 대기' :
                 statusFilter === 'assigned' ? '배정 완료' :
                 statusFilter === 'completed' ? '완료' : '전체'}
              </span>
              <button
                onClick={() => handleStatusFilterClick('all')}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                전체 보기
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus size={16} />
              OT 회원 추가
            </button>
          )}
          
          {!isAdmin && (
            <div className="flex items-center text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              <Eye size={16} className="mr-2" />
              <span className="text-sm font-medium">진행 상황 관리</span>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center">
          <UserCheck size={16} className="mr-2" />
          {toast}
        </div>
      )}

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => handleStatusFilterClick('all')}
          className={`bg-white p-4 rounded-xl shadow border hover:shadow-lg transition-all duration-200 text-left ${
            statusFilter === 'all' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">{isAdmin ? '전체 OT 회원' : '배정받은 OT'}</p>
              <p className="text-2xl font-bold text-gray-900">{baseMembers.length}</p>
            </div>
            <div className={`p-3 rounded-lg ${statusFilter === 'all' ? 'bg-blue-200' : 'bg-blue-100'}`}>
              <UserCheck className="text-blue-600" size={20} />
            </div>
          </div>
          {statusFilter === 'all' && (
            <div className="mt-2 text-xs text-blue-600 font-medium">
              ✓ 선택됨
            </div>
          )}
        </button>
        
        <button
          onClick={() => handleStatusFilterClick('pending')}
          className={`bg-white p-4 rounded-xl shadow border hover:shadow-lg transition-all duration-200 text-left ${
            statusFilter === 'pending' ? 'ring-2 ring-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">배정 대기</p>
              <p className="text-2xl font-bold text-yellow-600">
                {baseMembers.filter(m => m.status === 'pending').length}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${statusFilter === 'pending' ? 'bg-yellow-200' : 'bg-yellow-100'}`}>
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
          {statusFilter === 'pending' && (
            <div className="mt-2 text-xs text-yellow-600 font-medium">
              ✓ 선택됨
            </div>
          )}
        </button>
        
        <button
          onClick={() => handleStatusFilterClick('assigned')}
          className={`bg-white p-4 rounded-xl shadow border hover:shadow-lg transition-all duration-200 text-left ${
            statusFilter === 'assigned' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">배정 완료</p>
              <p className="text-2xl font-bold text-blue-600">
                {baseMembers.filter(m => m.status === 'assigned').length}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${statusFilter === 'assigned' ? 'bg-blue-200' : 'bg-blue-100'}`}>
              <UserCheck className="text-blue-600" size={20} />
            </div>
          </div>
          {statusFilter === 'assigned' && (
            <div className="mt-2 text-xs text-blue-600 font-medium">
              ✓ 선택됨
            </div>
          )}
        </button>
        
        <button
          onClick={() => handleStatusFilterClick('completed')}
          className={`bg-white p-4 rounded-xl shadow border hover:shadow-lg transition-all duration-200 text-left ${
            statusFilter === 'completed' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">완료</p>
              <p className="text-2xl font-bold text-green-600">
                {baseMembers.filter(m => m.status === 'completed').length}
              </p>
            </div>
            <div className={`p-3 rounded-lg ${statusFilter === 'completed' ? 'bg-green-200' : 'bg-green-100'}`}>
              <UserCheck className="text-green-600" size={20} />
            </div>
          </div>
          {statusFilter === 'completed' && (
            <div className="mt-2 text-xs text-green-600 font-medium">
              ✓ 선택됨
            </div>
          )}
        </button>
      </div>

      {/* OT 회원 목록 */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white rounded-xl shadow border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <UserCheck size={48} className="mx-auto" />
          </div>
                     <h3 className="text-lg font-medium text-gray-900 mb-2">
             {isAdmin ? (
               statusFilter === 'all' ? 'OT 회원이 없습니다' : 
               statusFilter === 'pending' ? '배정 대기 중인 회원이 없습니다' :
               statusFilter === 'assigned' ? '배정 완료된 회원이 없습니다' :
               '완료된 회원이 없습니다'
             ) : (
               statusFilter === 'all' ? '배정받은 OT가 없습니다' :
               statusFilter === 'pending' ? '배정 대기 중인 OT가 없습니다' :
               statusFilter === 'assigned' ? '진행 중인 OT가 없습니다' :
               '완료된 OT가 없습니다'
             )}
           </h3>
           <p className="text-gray-500 mb-4">
             {isAdmin 
               ? (statusFilter === 'all' ? 'OT 회원을 추가해보세요.' : '다른 상태의 회원을 확인해보세요.')
               : (statusFilter === 'all' ? '관리자가 OT를 배정할 때까지 기다려주세요.' : '다른 상태의 OT를 확인해보세요.')
             }
           </p>
          {statusFilter !== 'all' && (
            <button
              onClick={() => handleStatusFilterClick('all')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              전체 회원 보기
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredMembers.map(member => {
          const assignedStaff = member.assignedStaffId ? staffList?.find(s => s.id === member.assignedStaffId) : null;
          const progressKey = assignedStaff ? `${member.id}-${assignedStaff.id}` : '';
          const progress = progressKey ? otProgress[progressKey] : null;
          const isEditing = editingMember === member.id;
          
          return (
            <div key={member.id} className="bg-white rounded-xl shadow border hover:shadow-lg transition-shadow">
              <div className="p-6">
                {/* 회원 정보 헤더 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                        {getStatusText(member.status)}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-600 mb-2">
                      <Phone size={14} className="mr-1" />
                      <span className="text-sm">{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>등록일: {member.registeredAt}</span>
                      <span>•</span>
                      <span className="font-medium text-blue-600">
                        {member.otCount === 1 ? '1회 OT' : '2회 OT'}
                      </span>
                    </div>
                  </div>
                  
                  {isAdmin && (
                    <button
                      onClick={() => handleEditMember(member)}
                      className="text-blue-500 hover:text-blue-600 p-1"
                    >
                      <Edit size={16} />
                    </button>
                  )}
                </div>

                {/* 희망 일정 정보 */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">희망 일정</h4>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">희망 요일</label>
                        <div className="flex flex-wrap gap-1">
                          {DAYS_OF_WEEK.map(day => (
                            <button
                              key={day}
                              onClick={() => {
                                const currentDays = editData.preferredDays || [];
                                const newDays = currentDays.includes(day)
                                  ? currentDays.filter(d => d !== day)
                                  : [...currentDays, day];
                                setEditData({ ...editData, preferredDays: newDays });
                              }}
                              className={`px-2 py-1 text-xs rounded ${
                                (editData.preferredDays || []).includes(day)
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">희망 시간대</label>
                        <div className="flex flex-wrap gap-1">
                          {TIME_SLOTS.map(time => (
                            <button
                              key={time}
                              onClick={() => {
                                const currentTimes = editData.preferredTimes || [];
                                const newTimes = currentTimes.includes(time)
                                  ? currentTimes.filter(t => t !== time)
                                  : [...currentTimes, time];
                                setEditData({ ...editData, preferredTimes: newTimes });
                              }}
                              className={`px-2 py-1 text-xs rounded ${
                                (editData.preferredTimes || []).includes(time)
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">특이사항</label>
                        <textarea
                          value={editData.notes || ''}
                          onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                          className="w-full text-xs border rounded px-2 py-1"
                          rows={2}
                          placeholder="특이사항을 입력하세요"
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                        >
                          <Save size={12} />
                          저장
                        </button>
                        <button
                          onClick={() => setEditingMember(null)}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
                        >
                          <X size={12} />
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div>
                        <span className="text-xs text-gray-600">희망 요일: </span>
                        <span className="text-xs text-gray-800">
                          {member.preferredDays?.join(', ') || '미설정'}
                        </span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-600">희망 시간: </span>
                        <span className="text-xs text-gray-800">
                          {member.preferredTimes?.join(', ') || '미설정'}
                        </span>
                      </div>
                      {member.notes && (
                        <div>
                          <span className="text-xs text-gray-600">특이사항: </span>
                          <span className="text-xs text-gray-800">{member.notes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 담당자 배정 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">담당자</label>
                  {isAdmin ? (
                    <div className="space-y-2">
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={member.assignedStaffId || ''}
                        onChange={e => handleAssign(member.id, e.target.value)}
                      >
                        <option value="">담당자 선택</option>
                        {staffList?.map(staff => (
                          <option key={staff.id} value={staff.id}>
                            {staff.name} ({staff.department || '부서 미지정'})
                          </option>
                        ))}
                      </select>
                      {assignedStaff && (
                        <div className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                          <span className="text-sm text-gray-700">현재 배정:</span>
                          <button
                            onClick={() => setShowStaffDetailModal(assignedStaff.id)}
                            className="text-blue-600 hover:text-blue-800 underline font-medium text-sm"
                          >
                            {assignedStaff.name} ({assignedStaff.department}) 상세보기
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                      {assignedStaff ? (
                        <button
                          onClick={() => setShowStaffDetailModal(assignedStaff.id)}
                          className="text-blue-600 hover:text-blue-800 underline font-medium"
                        >
                          {assignedStaff.name} ({assignedStaff.department})
                        </button>
                      ) : (
                        '미배정'
                      )}
                    </div>
                  )}
                </div>

                {/* 진행 상황 */}
                {assignedStaff && progress && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-blue-800">진행 상황</h4>
                      <button
                        onClick={() => setShowProgressModal(progressKey)}
                        className="text-blue-600 hover:text-blue-800 text-xs"
                      >
                        상세보기
                      </button>
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

                {/* 배정 상태 및 액션 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {assignedStaff ? (
                      <div className="flex items-center text-green-600">
                        <UserCheck size={16} className="mr-1" />
                        <span className="text-sm font-medium">배정 완료</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-gray-400">
                        <Clock size={16} className="mr-1" />
                        <span className="text-sm">미배정</span>
                      </div>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <button
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        assignedStaff 
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                          : member.assignedStaffId
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={!!assignedStaff || !member.assignedStaffId}
                      onClick={() => {
                        if (member.assignedStaffId && !assignedStaff) {
                          // 실제 배정 수행
                          updateOTMember(member.id, { 
                            status: 'assigned' 
                          });
                          
                          // 진행상황 초기화 (이미 있지 않다면)
                          const progressKey = `${member.id}-${member.assignedStaffId}`;
                          if (!otProgress[progressKey]) {
                            updateProgress(progressKey, {
                              memberId: member.id,
                              staffId: parseInt(member.assignedStaffId),
                              totalSessions: member.otCount || 1,
                              completedSessions: 0,
                              contactMade: false,
                              sessions: []
                            });
                          }
                          
                          showToast(`${staffList?.find(s => s.id === member.assignedStaffId)?.name} 트레이너에게 배정 완료!`);
                        } else if (!member.assignedStaffId) {
                          showToast('담당자를 먼저 선택해주세요!');
                        }
                      }}
                    >
                      {assignedStaff ? '배정됨' : member.assignedStaffId ? '배정하기' : '담당자 선택 필요'}
                    </button>
                  )}
                </div>
              </div>
            </div>
                      );
          })}
        </div>
      )}

      {/* OT 회원 추가 모달 */}
      <AddOTMemberModal 
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
      />

      {/* 진행 상황 상세 모달 */}
      {showProgressModal && otProgress[showProgressModal] && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">OT 진행 상황</h3>
              <button
                onClick={() => setShowProgressModal(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {(() => {
                const progress = otProgress[showProgressModal];
                const member = otMembers.find(m => m.id === progress.memberId);
                const staff = staffList?.find(s => s.id === member?.assignedStaffId);
                
                return (
                  <>
                    {/* 기본 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">회원 정보</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div><span className="font-medium">이름:</span> {member?.name}</div>
                          <div><span className="font-medium">연락처:</span> {member?.phone}</div>
                          <div><span className="font-medium">담당자:</span> {staff?.name} ({staff?.department})</div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-3">진행 현황</h4>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                          <div><span className="font-medium">총 세션:</span> {progress.totalSessions}회</div>
                          <div><span className="font-medium">완료:</span> {progress.completedSessions}회</div>
                          <div><span className="font-medium">잔여:</span> {progress.totalSessions - progress.completedSessions}회</div>
                          <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                            <div 
                              className="bg-blue-500 h-3 rounded-full"
                              style={{ width: `${(progress.completedSessions / progress.totalSessions) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 연락 기록 */}
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-3">고객 연락 기록</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center gap-4 mb-3">
                          <label className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={progress.contactMade}
                              onChange={(e) => handleContactUpdate(showProgressModal, { 
                                contactMade: e.target.checked,
                                contactDate: e.target.checked ? new Date().toISOString().split('T')[0] : undefined
                              })}
                              className="form-checkbox"
                            />
                            <span>고객 연락 완료</span>
                          </label>
                          
                          {progress.contactMade && (
                            <input
                              type="date"
                              value={progress.contactDate || ''}
                              onChange={(e) => handleContactUpdate(showProgressModal, { 
                                contactMade: progress.contactMade,
                                contactDate: e.target.value 
                              })}
                              className="form-input text-sm"
                            />
                          )}
                        </div>
                        
                        {progress.contactMade && (
                          <textarea
                            value={progress.contactNotes || ''}
                            onChange={(e) => handleContactUpdate(showProgressModal, { 
                              contactMade: progress.contactMade,
                              contactDate: progress.contactDate,
                              contactNotes: e.target.value 
                            })}
                            placeholder="연락 내용을 기록하세요..."
                            className="w-full form-textarea"
                            rows={3}
                          />
                        )}
                      </div>
                    </div>

                    {/* 세션 기록 */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-800">세션 기록</h4>
                        <button
                          onClick={() => setNewSessionData({ date: '', time: '', notes: '' })}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          <Plus size={16} />
                          세션 추가
                        </button>
                      </div>
                      
                      {/* 새 세션 추가 폼 */}
                      <div className="bg-blue-50 p-4 rounded-lg mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <input
                            type="date"
                            value={newSessionData.date}
                            onChange={(e) => setNewSessionData({ ...newSessionData, date: e.target.value })}
                            className="form-input"
                            placeholder="날짜"
                          />
                          <input
                            type="time"
                            value={newSessionData.time}
                            onChange={(e) => setNewSessionData({ ...newSessionData, time: e.target.value })}
                            className="form-input"
                            placeholder="시간"
                          />
                          <input
                            type="text"
                            value={newSessionData.notes}
                            onChange={(e) => setNewSessionData({ ...newSessionData, notes: e.target.value })}
                            className="form-input"
                            placeholder="메모"
                          />
                          <button
                            onClick={() => handleAddSession(showProgressModal)}
                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            추가
                          </button>
                        </div>
                      </div>
                      
                      {/* 세션 목록 */}
                      <div className="space-y-2">
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">진행된 일자 체크</h5>
                          <div className="text-xs text-gray-500 mb-2">
                            완료된 세션: {progress.completedSessions}회 / 총 {progress.totalSessions}회
                          </div>
                        </div>
                        
                        {progress.sessions.map((session, index) => (
                          <div key={session.id} className={`p-3 rounded-lg border ${session.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={session.completed}
                                  onChange={(e) => handleSessionComplete(showProgressModal, session.id, e.target.checked)}
                                  className="form-checkbox text-green-600 focus:ring-green-500"
                                />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">
                                      {session.date} {session.time}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      (세션 {index + 1})
                                    </span>
                                  </div>
                                  {session.notes && (
                                    <div className="text-sm text-gray-600 mt-1">{session.notes}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  session.completed 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {session.completed ? '✓ 완료' : '○ 예정'}
                                </span>
                                {session.completed && (
                                  <span className="text-xs text-green-600">
                                    진행됨
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        
                        {progress.sessions.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            등록된 세션이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* 담당자 세부 정보 모달 */}
      {showStaffDetailModal && (() => {
        const selectedStaff = staffList?.find(s => s.id === showStaffDetailModal);
        const staffAssignedMembers = otMembers.filter(member => 
          member.assignedStaffId === showStaffDetailModal
        );
        
        if (!selectedStaff) return null;

        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[calc(100vh-4rem)] overflow-y-auto my-8">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">담당자 상세 정보</h3>
                <button
                  onClick={() => setShowStaffDetailModal(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">기본 정보</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {selectedStaff.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-lg">{selectedStaff.name}</div>
                          <div className="text-sm text-gray-600">{selectedStaff.department || '부서 미지정'}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">직책:</span>
                          <div className="text-sm text-gray-900">{selectedStaff.position || '직책 미지정'}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">입사일:</span>
                          <div className="text-sm text-gray-900">{selectedStaff.hireDate || '정보 없음'}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">연락처:</span>
                          <div className="text-sm text-gray-900">{selectedStaff.phone || '정보 없음'}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-700">이메일:</span>
                          <div className="text-sm text-gray-900">{selectedStaff.email}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">OT 현황</h4>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">{staffAssignedMembers.length}</div>
                          <div className="text-xs text-gray-600">총 배정</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">
                            {staffAssignedMembers.filter(m => m.status === 'assigned').length}
                          </div>
                          <div className="text-xs text-gray-600">진행중</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {staffAssignedMembers.filter(m => m.status === 'completed').length}
                          </div>
                          <div className="text-xs text-gray-600">완료</div>
                        </div>
                      </div>
                      
                      {staffAssignedMembers.length > 0 && (
                        <div className="pt-3 border-t border-gray-200">
                          <div className="text-sm font-medium text-gray-700 mb-2">완료율</div>
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div 
                              className="bg-green-500 h-3 rounded-full transition-all"
                              style={{ 
                                width: `${(staffAssignedMembers.filter(m => m.status === 'completed').length / staffAssignedMembers.length) * 100}%` 
                              }}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {Math.round((staffAssignedMembers.filter(m => m.status === 'completed').length / staffAssignedMembers.length) * 100)}% 완료
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 배정된 회원 목록 */}
                {staffAssignedMembers.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">
                      배정된 회원 목록 ({staffAssignedMembers.length}명)
                    </h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="max-h-60 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 sticky top-0">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">회원명</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">상태</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">진행도</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {staffAssignedMembers.map(member => {
                              const progressKey = `${member.id}-${selectedStaff.id}`;
                              const progress = otProgress[progressKey];
                              
                              return (
                                <tr key={member.id} className="hover:bg-gray-100">
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                                    <div className="text-xs text-gray-500">
                                      {member.otCount === 1 ? '1회 OT' : '2회 OT'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm text-gray-900">{member.phone}</div>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}>
                                      {getStatusText(member.status)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    {progress ? (
                                      <div className="flex flex-col items-center gap-1">
                                        <div className="text-xs text-gray-600">
                                          {progress.completedSessions}/{progress.totalSessions}
                                        </div>
                                        <div className="w-16 bg-gray-200 rounded-full h-2">
                                          <div 
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(progress.completedSessions / progress.totalSessions) * 100}%` }}
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-400">-</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* 배정된 회원이 없는 경우 */}
                {staffAssignedMembers.length === 0 && (
                  <div className="text-center py-8">
                    <UserX size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 font-medium">배정된 OT 회원이 없습니다</p>
                    <p className="text-sm text-gray-400 mt-1">회원 배정 시 이곳에 정보가 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 담당자 목록 (관리자만) */}
      {isAdmin && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">담당자 목록</h3>
          <div className="bg-white rounded-xl shadow border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      담당자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부서
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      배정 회원수
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      진행 회원수
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      완료 회원수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      배정된 회원
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {staffList && staffList.length > 0 ? staffList.map(staff => {
                    const assignedMembers = otMembers.filter(member => 
                      member.assignedStaffId === staff.id
                    );
                    
                    // 상태별 회원수 계산
                    const assignedCount = assignedMembers.filter(member => member.status === 'assigned').length;
                    const completedCount = assignedMembers.filter(member => member.status === 'completed').length;
                    const totalAssignedCount = assignedMembers.length;

                    return (
                      <tr key={staff.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => setShowStaffDetailModal(staff.id)}
                            className="text-blue-600 hover:text-blue-800 underline font-medium"
                          >
                            {staff.name}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{staff.department || '부서 미지정'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {totalAssignedCount}명
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            {assignedCount}명
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {completedCount}명
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {assignedMembers.length > 0 
                              ? assignedMembers.map(m => m?.name).join(', ')
                              : '배정된 회원 없음'
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        등록된 직원이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 