import React, { useState, useEffect } from 'react';
import { useSuggestion, Suggestion, SuggestionStatus } from '../../contexts/SuggestionContext';
import { useAuth } from '../../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { 
  Eye, 
  MessageSquare, 
  X, 
  Users, 
  UserCheck, 
  User, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  Search,
  Trash2
} from 'lucide-react';

const getStatusDisplayName = (status: SuggestionStatus) => {
  switch (status) {
    case 'pending': return '답변 대기중';
    case 'answered': return '답변 완료';
    case 'rejected': return '반려됨';
    default: return status;
  }
};

const getStatusBadgeClass = (status: SuggestionStatus) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'answered': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const AdminSuggestionsManagement: React.FC = () => {
  const { suggestions, updateSuggestionReply, deleteSuggestion } = useSuggestion();
  const { user: currentUser } = useAuth();

  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [suggestionToDelete, setSuggestionToDelete] = useState<Suggestion | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | SuggestionStatus>('all');
  const [filterType, setFilterType] = useState<'all' | 'staff' | 'customer'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 필터링된 건의사항
  const filteredSuggestions = suggestions.filter(suggestion => {
    const matchesStatus = filterStatus === 'all' || suggestion.status === filterStatus;
    const matchesType = filterType === 'all' || suggestion.type === filterType;
    const matchesSearch = searchTerm === '' || 
      suggestion.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      suggestion.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (suggestion.createdByName && suggestion.createdByName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // 통계 계산
  const stats = {
    total: suggestions.length,
    pending: suggestions.filter(s => s.status === 'pending').length,
    answered: suggestions.filter(s => s.status === 'answered').length,
    staff: suggestions.filter(s => s.type === 'staff').length,
    customer: suggestions.filter(s => s.type === 'customer').length
  };

  const handleOpenReplyModal = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setReplyContent(suggestion.reply || '');
    setIsReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    setIsReplyModalOpen(false);
    setSelectedSuggestion(null);
    setReplyContent('');
  };

  const handleSaveReply = () => {
    if (selectedSuggestion && currentUser) {
      if (!replyContent.trim()) {
        alert('답변 내용을 입력해주세요.');
        return;
      }
      updateSuggestionReply(selectedSuggestion.id, replyContent, currentUser);
      handleCloseReplyModal();
      alert('답변이 저장되었습니다.');
    } else {
      alert('선택된 건의사항이 없거나 사용자 정보가 없습니다.');
    }
  };

  const handleOpenDeleteModal = (suggestion: Suggestion) => {
    setSuggestionToDelete(suggestion);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setSuggestionToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (suggestionToDelete) {
      const success = await deleteSuggestion(suggestionToDelete.id);
      if (success) {
        alert('건의사항이 삭제되었습니다.');
        handleCloseDeleteModal();
      } else {
        alert('건의사항 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  // 모달 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isReplyModalOpen && event.target instanceof HTMLElement && event.target.id === 'reply-modal-overlay') {
        handleCloseReplyModal();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isReplyModalOpen]);

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">건의사항 관리</h1>
        <p className="text-slate-600 mt-1">접수된 건의사항을 관리하고 답변을 작성하세요</p>
      </header>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 건의사항</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">답변 대기중</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">답변 완료</p>
              <p className="text-2xl font-bold text-green-600">{stats.answered}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-xl shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">직원 건의사항</p>
              <p className="text-2xl font-bold text-blue-600">{stats.staff}</p>
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
              <p className="text-2xl font-bold text-green-600">{stats.customer}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <User className="text-green-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white p-6 rounded-xl shadow-lg">
        {/* 필터 및 검색 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 상태</option>
              <option value="pending">답변 대기중</option>
              <option value="answered">답변 완료</option>
              <option value="rejected">반려됨</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-500" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">모든 유형</option>
              <option value="staff">직원</option>
              <option value="customer">고객</option>
            </select>
          </div>
          
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="제목, 내용, 작성자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-slate-700 mb-4">
          접수된 건의사항 목록 ({filteredSuggestions.length}건)
        </h2>
        
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-slate-500">조건에 맞는 건의사항이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[25%]">제목</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[12%]">유형</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[12%]">작성자</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[10%]">카테고리</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[12%]">작성일</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider w-[12%]">상태</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider w-[17%]">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuggestions.map((suggestion: Suggestion) => ( 
                  <tr key={suggestion.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-4 pr-3">
                      <button 
                        onClick={() => handleOpenReplyModal(suggestion)}
                        className="text-left hover:bg-slate-100 p-1 rounded transition-colors w-full"
                        title="상세보기"
                      >
                        <p className="font-semibold text-slate-800 hover:text-blue-600 transition-colors truncate">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-xs">
                          {suggestion.content}
                        </p>
                      </button>
                    </td>
                    <td className="py-4 pr-3">
                      <div className="flex items-center gap-1">
                        {suggestion.type === 'staff' ? (
                          <>
                            <UserCheck size={14} className="text-blue-500" />
                            <span className="text-sm text-blue-700">직원</span>
                          </>
                        ) : (
                          <>
                            <User size={14} className="text-green-500" />
                            <span className="text-sm text-green-700">고객</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 pr-3 text-sm text-slate-700">
                      {suggestion.createdByName || (suggestion.createdBy && suggestion.createdBy.name) || '익명'}
                    </td>
                    <td className="py-4 pr-3 text-sm text-slate-700">
                      {suggestion.category || '기타'}
                    </td>
                    <td className="py-4 pr-3 text-sm text-slate-700">
                      {suggestion.createdAt ? format(parseISO(suggestion.createdAt), 'MM-dd HH:mm') : 'N/A'}
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(suggestion.status)}`}>
                        {getStatusDisplayName(suggestion.status)}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button 
                          onClick={() => handleOpenReplyModal(suggestion)} 
                          className={`inline-flex items-center px-3 py-1 text-sm rounded-md transition-colors ${
                            suggestion.status === 'answered' 
                              ? 'text-green-700 bg-green-100 hover:bg-green-200' 
                              : 'text-blue-700 bg-blue-100 hover:bg-blue-200'
                          }`}
                          title={suggestion.status === 'answered' ? "답변 보기/수정" : "답변하기"}
                        >
                          {suggestion.status === 'answered' ? (
                            <>
                              <Eye size={14} className="mr-1"/>
                              답변 보기
                            </>
                          ) : (
                            <>
                              <MessageSquare size={14} className="mr-1"/>
                              답변하기
                            </>
                          )}
                        </button>
                        
                        <button
                          onClick={() => handleOpenDeleteModal(suggestion)}
                          className="inline-flex items-center px-2 py-1 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                          title="건의사항 삭제"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Reply Modal */}
      {isReplyModalOpen && selectedSuggestion && (
        <div 
          id="reply-modal-overlay"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 transition-opacity duration-300 ease-in-out overflow-y-auto"
        >
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[calc(100vh-4rem)] overflow-y-auto relative transform transition-all duration-300 ease-in-out scale-100 my-8">
            <button 
              onClick={handleCloseReplyModal} 
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Close modal"
            >
              <X size={24} />
            </button>
            
            <h3 className="text-2xl font-semibold text-slate-800 mb-6">
              {selectedSuggestion.status === 'answered' ? '답변 보기/수정' : '답변 작성'}
            </h3>
            
            {/* 건의사항 정보 */}
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
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
                <span className={`ml-auto px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(selectedSuggestion.status)}`}>
                  {getStatusDisplayName(selectedSuggestion.status)}
                </span>
              </div>
              
              <h4 className="text-lg font-semibold text-slate-800 mb-2">{selectedSuggestion.title}</h4>
              <p className="text-slate-700 whitespace-pre-wrap mb-3">{selectedSuggestion.content}</p>
              
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>작성자: {selectedSuggestion.createdByName || (selectedSuggestion.createdBy && selectedSuggestion.createdBy.name) || '익명'}</span>
                <span>작성일: {selectedSuggestion.createdAt ? format(parseISO(selectedSuggestion.createdAt), 'yyyy-MM-dd HH:mm') : 'N/A'}</span>
              </div>
            </div>

            {/* 기존 답변 표시 (있는 경우) */}
            {selectedSuggestion.status === 'answered' && selectedSuggestion.reply && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <span className="text-sm font-medium text-green-800">현재 답변</span>
                </div>
                <p className="text-green-700 whitespace-pre-wrap mb-2">{selectedSuggestion.reply}</p>
                <div className="flex items-center gap-4 text-xs text-green-600">
                  <span>답변자: {selectedSuggestion.repliedBy?.name}</span>
                  <span>답변일: {selectedSuggestion.repliedAt ? format(parseISO(selectedSuggestion.repliedAt), 'yyyy-MM-dd HH:mm') : 'N/A'}</span>
                </div>
              </div>
            )}

            {/* 답변 작성/수정 폼 */}
            <div>
              <label htmlFor="replyContent" className="block text-sm font-medium text-slate-700 mb-2">
                {selectedSuggestion.status === 'answered' ? '답변 수정' : '답변 작성'}
              </label>
              <textarea
                id="replyContent"
                name="replyContent"
                rows={8}
                className="w-full px-3 py-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 transition-colors"
                placeholder="건의사항에 대한 답변을 입력하세요..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCloseReplyModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSaveReply}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                답변 저장
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && suggestionToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        >
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">건의사항 삭제</h3>
                <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900 mb-1">{suggestionToDelete.title}</p>
              <p className="text-xs text-gray-600 line-clamp-2">{suggestionToDelete.content}</p>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              정말로 이 건의사항을 삭제하시겠습니까?
            </p>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleCloseDeleteModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSuggestionsManagement;
