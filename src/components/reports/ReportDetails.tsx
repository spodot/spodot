import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Edit, Trash2, Calendar, Clock, User, CheckCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useReport, Report, ReportStatus, ReportType } from '../../contexts/ReportContext';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface ReportDetailsProps {
  report: Report;
  onClose: () => void;
  onEdit?: () => void;
}

const ReportDetails = ({ report, onClose, onEdit }: ReportDetailsProps) => {
  const { submitReport, approveReport, rejectReport, addComment, deleteReport } = useReport();
  const { user } = useAuth();
  const [reviewNote, setReviewNote] = useState('');
  const [newComment, setNewComment] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const isAuthor = user?.id === report.authorId;
  const isAdmin = user?.role === 'admin';
  const canReview = isAdmin && report.status === 'submitted';
  
  // 보고서 제출
  const handleSubmit = () => {
    if (window.confirm('보고서를 제출하시겠습니까? 제출 후에는 수정이 불가능합니다.')) {
      submitReport(report.id);
    }
  };
  
  // 보고서 승인
  const handleApprove = () => {
    if (!user) return;
    
    approveReport(report.id, user.id, user.name, reviewNote);
    setReviewNote('');
    setShowReviewForm(false);
  };
  
  // 보고서 반려
  const handleReject = () => {
    if (!user || !reviewNote.trim()) return;
    
    rejectReport(report.id, user.id, user.name, reviewNote);
    setReviewNote('');
    setShowReviewForm(false);
  };
  
  // 댓글 추가
  const handleAddComment = () => {
    if (!newComment.trim() || !user) return;
    
    addComment(report.id, newComment, user.id, user.name);
    setNewComment('');
  };
  
  // 보고서 삭제
  const handleDelete = () => {
    if (window.confirm('이 보고서를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteReport(report.id);
      onClose();
    }
  };
  
  // 보고서 유형 텍스트
  const getReportTypeText = (type: ReportType) => {
    switch (type) {
      case 'daily': return '일일 보고서';
      case 'weekly': return '주간 보고서';
      case 'monthly': return '월간 보고서';
    }
  };
  
  // 보고서 상태 텍스트
  const getStatusText = (status: ReportStatus) => {
    switch (status) {
      case 'draft': return '작성 중';
      case 'submitted': return '제출됨';
      case 'approved': return '승인됨';
      case 'rejected': return '반려됨';
    }
  };
  
  // 보고서 상태 배지 스타일
  const getStatusBadgeStyle = (status: ReportStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
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
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center">
            <span className={clsx(
              "h-10 w-10 rounded-full flex items-center justify-center mr-3",
              report.status === 'approved' && "bg-green-100 text-green-700",
              report.status === 'rejected' && "bg-red-100 text-red-700",
              report.status === 'submitted' && "bg-blue-100 text-blue-700",
              report.status === 'draft' && "bg-slate-100 text-slate-700"
            )}>
              {report.status === 'approved' && <CheckCircle size={24} />}
              {report.status === 'rejected' && <AlertCircle size={24} />}
              {report.status === 'submitted' && <Send size={24} />}
              {report.status === 'draft' && <Edit size={24} />}
            </span>
            <div>
              <span className={clsx(
                "px-2 py-1 rounded-full text-xs font-medium",
                getStatusBadgeStyle(report.status)
              )}>
                {getStatusText(report.status)}
              </span>
              <h2 className="text-xl font-semibold text-slate-900 mt-1">
                {getReportTypeText(report.type)}
              </h2>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAuthor && report.status === 'draft' && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEdit) onEdit();
                  }}
                  className="text-blue-500 hover:text-blue-600"
                  title="편집"
                >
                  <Edit size={20} />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="text-red-500 hover:text-red-600"
                  title="삭제"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-2xl font-bold text-slate-900">{report.title}</h3>
          
          <div className="flex flex-wrap gap-6 mt-4 mb-6">
            <div className="flex items-center text-slate-700">
              <User size={18} className="mr-2 text-primary flex-shrink-0" />
              <div>
                <span className="block text-sm font-medium text-slate-500">작성자</span>
                <span>{report.authorName || '작성자'}</span>
              </div>
            </div>
            
            <div className="flex items-center text-slate-700">
              <Calendar size={18} className="mr-2 text-primary flex-shrink-0" />
              <div>
                <span className="block text-sm font-medium text-slate-500">작성일</span>
                <span>{format(parseISO(report.createdAt), 'yyyy년 M월 d일', { locale: ko })}</span>
              </div>
            </div>
            
            <div className="flex items-center text-slate-700">
              <Clock size={18} className="mr-2 text-primary flex-shrink-0" />
              <div>
                <span className="block text-sm font-medium text-slate-500">마지막 수정</span>
                <span>{format(parseISO(report.updatedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}</span>
              </div>
            </div>
          </div>
          
          {(report.status === 'approved' || report.status === 'rejected') && report.reviewerName && (
            <div className={clsx(
              "mb-6 p-4 rounded-lg",
              report.status === 'approved' ? "bg-green-50" : "bg-red-50"
            )}>
              <div className="flex items-center mb-2">
                <span className={clsx(
                  "p-2 rounded-full mr-2",
                  report.status === 'approved' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                )}>
                  {report.status === 'approved' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                </span>
                <div>
                  <span className="font-medium text-slate-900">{report.reviewerName}</span>
                  <span className="text-sm text-slate-500 ml-2">
                    {report.reviewedAt && format(parseISO(report.reviewedAt), 'yyyy년 M월 d일 HH:mm', { locale: ko })}
                  </span>
                </div>
              </div>
              
              {report.reviewNote && (
                <p className="text-slate-700 pl-8">{report.reviewNote}</p>
              )}
            </div>
          )}
          
          <div className="mb-6 p-6 bg-slate-50 rounded-lg">
            <p className="text-slate-700 whitespace-pre-wrap">{report.content}</p>
          </div>
          
          {/* 작성자이고 초안 상태일 때만 제출 버튼 표시 */}
          {isAuthor && report.status === 'draft' && (
            <div className="mb-6 mt-4 flex justify-end">
              <button
                onClick={handleSubmit}
                className="btn btn-primary inline-flex items-center"
              >
                <Send size={16} className="mr-2" />
                보고서 제출
              </button>
            </div>
          )}
          
          {/* 관리자이고 제출된 상태일 때만 검토 버튼 표시 */}
          {canReview && (
            <div className="mb-6 mt-4">
              {!showReviewForm ? (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="btn btn-primary"
                  >
                    보고서 검토
                  </button>
                </div>
              ) : (
                <div className="bg-slate-100 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">검토 의견</h4>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    className="form-input h-24 w-full mb-4"
                    placeholder="검토 의견을 입력하세요"
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="btn btn-outline"
                    >
                      취소
                    </button>
                    <button
                      onClick={handleReject}
                      className="btn btn-danger"
                      disabled={!reviewNote.trim()}
                    >
                      반려
                    </button>
                    <button
                      onClick={handleApprove}
                      className="btn btn-success"
                    >
                      승인
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* 댓글 섹션 */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
              <MessageSquare size={18} className="mr-2" />
              댓글
            </h3>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
              {report.comments && report.comments.length > 0 ? (
                report.comments.map(comment => (
                  <div key={comment.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium">
                          {comment.authorName.charAt(0)}
                        </div>
                        <div className="ml-2">
                          <span className="font-medium text-slate-900">{comment.authorName}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {format(parseISO(comment.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-slate-700 text-sm whitespace-pre-wrap">
                      {comment.content}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400">
                  <p>아직 댓글이 없습니다.</p>
                </div>
              )}
            </div>
            
            {user && (
              <div className="mt-4 relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="form-input pr-12 w-full min-h-[80px]"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="absolute right-2 bottom-2 p-2 rounded-full bg-primary text-white disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Send size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ReportDetails; 