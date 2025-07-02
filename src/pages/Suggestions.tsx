import React, { useState, useEffect } from 'react';
import {
  Bell,
  Megaphone,
  Eye,
  User,
  Users,
  UserCheck,
  MessageSquare,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Send
} from 'lucide-react';
import { useSuggestion, DraftSuggestion } from '../contexts/SuggestionContext';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'answered':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusDisplayName = (status: string) => {
  switch (status) {
    case 'pending': return '답변 대기중';
    case 'answered': return '답변 완료';
    case 'rejected': return '반려됨';
    default: return status;
  }
};

const Suggestions = () => {
  const { 
    suggestions, 
    draftSuggestion, 
    addSuggestion, 
    saveDraft, 
    clearDraft, 
    getUserSuggestions 
  } = useSuggestion();
  const { user } = useAuth();

  const [newSuggestionTitle, setNewSuggestionTitle] = useState('');
  const [newSuggestionContent, setNewSuggestionContent] = useState('');
  const [newSuggestionType, setNewSuggestionType] = useState<'staff' | 'customer'>('staff');
  const [newSuggestionCategory, setNewSuggestionCategory] = useState('시설');
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'create'>('all');
  const [viewMode, setViewMode] = useState<'staff' | 'customer' | 'all'>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [lastSaved, setLastSaved] = useState<string>('');

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${
    ['일', '월', '화', '수', '목', '금', '토'][today.getDay()]
  }요일`;

  // 임시저장 데이터 복원
  useEffect(() => {
    if (draftSuggestion && activeTab === 'create') {
      setNewSuggestionTitle(draftSuggestion.title);
      setNewSuggestionContent(draftSuggestion.content);
      setNewSuggestionType(draftSuggestion.type);
      setNewSuggestionCategory(draftSuggestion.category || '시설');
      setLastSaved(draftSuggestion.lastSaved);
    }
  }, [draftSuggestion, activeTab]);

  // 자동 임시저장 (5초마다)
  useEffect(() => {
    if (activeTab === 'create' && (newSuggestionTitle || newSuggestionContent)) {
      const timer = setInterval(() => {
        const draft: DraftSuggestion = {
          title: newSuggestionTitle,
          content: newSuggestionContent,
          type: newSuggestionType,
          category: newSuggestionCategory,
          lastSaved: new Date().toISOString()
        };
        saveDraft(draft);
        setLastSaved(draft.lastSaved);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [newSuggestionTitle, newSuggestionContent, newSuggestionType, newSuggestionCategory, activeTab, saveDraft]);

  // 필터링된 건의사항
  const filteredSuggestions = suggestions.filter(suggestion => {
    if (activeTab === 'my' && user) {
      return suggestion.createdBy?.id === user.id;
    }
    if (viewMode === 'all') return true;
    return suggestion.type === viewMode;
  });
  
  // 통계 계산
  const staffSuggestions = suggestions.filter(s => s.type === 'staff');
  const customerSuggestions = suggestions.filter(s => s.type === 'customer');
  const mySuggestions = user ? getUserSuggestions(user.id) : [];

  const handleNewSuggestionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuggestionTitle.trim() || !newSuggestionContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }

    addSuggestion(
      newSuggestionTitle,
      newSuggestionContent,
      user,
      newSuggestionType,
      newSuggestionCategory
    );

    // 폼 초기화 및 임시저장 삭제
    setNewSuggestionTitle('');
    setNewSuggestionContent('');
    setNewSuggestionCategory('시설');
    clearDraft();
    setLastSaved('');
    
    alert(`새 ${newSuggestionType === 'staff' ? '직원' : '고객'} 건의사항이 제출되었습니다.`);
    setActiveTab('all');
  };

  const handleViewDetail = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSuggestion(null);
  };

  const categories = ['시설', '서비스', '업무개선', '기타'];

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">건의사항</h1>
          <p className="text-slate-600 mt-1">건의사항을 작성하고 답변을 확인하세요</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">{formattedDate}</span>
        </div>
      </header>

      {/* Notice Banner */}
      <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center space-x-3 mb-6 shadow-md">
        <Megaphone size={24} className="flex-shrink-0" />
        <p className="text-sm font-medium">건의사항은 관리자가 검토 후 답변드립니다. 답변은 이 페이지에서 확인하실 수 있습니다.</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 건의사항</p>
              <p className="text-2xl font-bold text-gray-900">{suggestions.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">직원 건의사항</p>
              <p className="text-2xl font-bold text-blue-600">{staffSuggestions.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCheck className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">고객 건의사항</p>
              <p className="text-2xl font-bold text-green-600">{customerSuggestions.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">내 건의사항</p>
              <p className="text-2xl font-bold text-purple-600">{mySuggestions.length}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="text-purple-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white p-1 rounded-lg shadow mb-6 inline-flex">
              <button
          onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
          <Users size={16} />
          전체 건의사항
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'my'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare size={16} />
          내 건의사항
              </button>
              <button
          onClick={() => setActiveTab('create')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
            activeTab === 'create'
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
          <Send size={16} />
          새 건의사항 작성
              </button>
          </div>

      {/* 메인 컨텐츠 */}
      {activeTab === 'create' ? (
        /* 새 건의사항 작성 폼 */
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-slate-700">새 건의사항 작성</h2>
            {lastSaved && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Save size={16} />
                <span>마지막 저장: {format(parseISO(lastSaved), 'HH:mm:ss')}</span>
                      </div>
            )}
          </div>

          <form onSubmit={handleNewSuggestionSubmit}>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
              <label className="block mb-2 text-sm font-medium text-slate-700">건의사항 유형</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="suggestionType" 
                    value="staff" 
                    checked={newSuggestionType === 'staff'}
                    onChange={(e) => setNewSuggestionType(e.target.value as 'staff' | 'customer')}
                      className="form-radio h-4 w-4 text-blue-600"
                  />
                  <UserCheck size={16} className="text-blue-500" />
                    <span className="text-sm text-slate-700">직원</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="suggestionType" 
                    value="customer" 
                    checked={newSuggestionType === 'customer'}
                    onChange={(e) => setNewSuggestionType(e.target.value as 'staff' | 'customer')}
                      className="form-radio h-4 w-4 text-green-600"
                  />
                  <User size={16} className="text-green-500" />
                    <span className="text-sm text-slate-700">고객</span>
                </label>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-slate-700">카테고리</label>
                <select
                  value={newSuggestionCategory}
                  onChange={(e) => setNewSuggestionCategory(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="suggestionTitle" className="block mb-2 text-sm font-medium text-slate-700">제목</label>
              <input 
                type="text" 
                id="suggestionTitle" 
                value={newSuggestionTitle}
                onChange={(e) => setNewSuggestionTitle(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="건의사항 제목을 입력하세요"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="suggestionContent" className="block mb-2 text-sm font-medium text-slate-700">내용</label>
              <textarea 
                id="suggestionContent" 
                rows={8} 
                value={newSuggestionContent}
                onChange={(e) => setNewSuggestionContent(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder="건의사항 내용을 상세히 작성하세요..."
                required
              />
            </div>

            <div className="flex gap-3">
            <button 
              type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Send size={16} />
                건의사항 제출
              </button>
              <button 
                type="button"
                onClick={() => {
                  setNewSuggestionTitle('');
                  setNewSuggestionContent('');
                  clearDraft();
                  setLastSaved('');
                }}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                초기화
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* 건의사항 목록 */
        <div className="bg-white p-6 rounded-xl shadow-lg">
          {/* 필터 */}
          {activeTab === 'all' && (
            <div className="flex items-center gap-2 mb-6">
              <span className="text-sm font-medium text-slate-700">필터:</span>
              <div className="flex gap-1">
                {['all', 'staff', 'customer'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode as any)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      viewMode === mode
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {mode === 'all' ? '전체' : mode === 'staff' ? '직원' : '고객'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">제목</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">작성자</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">카테고리</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">작성일</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuggestions.map((suggestion) => (
                  <tr key={suggestion.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-3">
                      <button 
                        onClick={() => handleViewDetail(suggestion)}
                        className="flex items-center gap-2 text-left hover:bg-slate-100 p-1 rounded transition-colors w-full"
                        title="상세보기"
                      >
                        {suggestion.type === 'staff' ? (
                          <UserCheck size={14} className="text-blue-500" />
                        ) : (
                          <User size={14} className="text-green-500" />
                        )}
                        <span className="font-medium text-slate-800 hover:text-blue-600 transition-colors">{suggestion.title}</span>
                      </button>
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700">{suggestion.createdByName}</td>
                    <td className="py-3 pr-3 text-sm text-slate-700">{suggestion.category}</td>
                    <td className="py-3 pr-3 text-sm text-slate-700">
                      {format(parseISO(suggestion.createdAt), 'yyyy-MM-dd')}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(suggestion.status)}`}>
                        {getStatusDisplayName(suggestion.status)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <button 
                        onClick={() => handleViewDetail(suggestion)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="상세보기"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredSuggestions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      {activeTab === 'my' ? '작성한 건의사항이 없습니다.' : '등록된 건의사항이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 상세보기 모달 */}
      {isDetailModalOpen && selectedSuggestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-2xl font-semibold text-slate-800">건의사항 상세</h3>
              <button 
                onClick={handleCloseDetailModal}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {selectedSuggestion.type === 'staff' ? (
                    <UserCheck size={16} className="text-blue-500" />
              ) : (
                    <User size={16} className="text-green-500" />
              )}
                  <span className="text-sm font-medium text-slate-600">
                    {selectedSuggestion.type === 'staff' ? '직원' : '고객'} 건의사항
                  </span>
                  <span className="text-sm text-slate-500">|</span>
                  <span className="text-sm text-slate-500">{selectedSuggestion.category}</span>
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">{selectedSuggestion.title}</h4>
                <p className="text-slate-700 whitespace-pre-wrap">{selectedSuggestion.content}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span>작성자: {selectedSuggestion.createdByName}</span>
                  <span>작성일: {format(parseISO(selectedSuggestion.createdAt), 'yyyy-MM-dd HH:mm')}</span>
                  <span className={`px-2 py-1 rounded-full ${getStatusBadgeClass(selectedSuggestion.status)}`}>
                    {getStatusDisplayName(selectedSuggestion.status)}
                  </span>
                </div>
              </div>

              {selectedSuggestion.status === 'answered' && selectedSuggestion.reply && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">관리자 답변</span>
                  </div>
                  <p className="text-green-700 whitespace-pre-wrap">{selectedSuggestion.reply}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-green-600">
                    <span>답변자: {selectedSuggestion.repliedBy?.name}</span>
                    <span>답변일: {format(parseISO(selectedSuggestion.repliedAt), 'yyyy-MM-dd HH:mm')}</span>
                  </div>
                </div>
              )}

              {selectedSuggestion.status === 'pending' && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">답변 대기중</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">관리자가 검토 중입니다. 답변까지 시간이 소요될 수 있습니다.</p>
                </div>
              )}
            </div>
          </div>
      </div>
      )}
    </div>
  );
};

export default Suggestions;
