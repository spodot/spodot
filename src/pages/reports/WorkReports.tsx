import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, FileText, Calendar, Clock, User, Send, CheckCircle, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { format, parseISO, isToday, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';
import { useReport, Report as ReportType, ReportStatus, ReportType as ReportTypeEnum } from '../../contexts/ReportContext';
import { useAuth } from '../../contexts/AuthContext';
import AddReportForm from '../../components/forms/AddReportForm';
import ReportDetails from '../../components/reports/ReportDetails';

const WorkReports = () => {
  const { user } = useAuth();
  const { reports, filteredReports, filterReports } = useReport();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<ReportStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<ReportTypeEnum | 'all'>('all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // 필터링 적용
  useEffect(() => {
    let dateFrom, dateTo;
    
    if (filterDate === 'today') {
      dateFrom = format(new Date(), 'yyyy-MM-dd');
      dateTo = format(new Date(), 'yyyy-MM-dd');
    } else if (filterDate === 'week') {
      dateFrom = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      dateTo = format(new Date(), 'yyyy-MM-dd');
    } else if (filterDate === 'month') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      dateFrom = format(start, 'yyyy-MM-dd');
      dateTo = format(end, 'yyyy-MM-dd');
    }
    
    filterReports({
      status: filterStatus !== 'all' ? filterStatus : undefined,
      type: filterType !== 'all' ? filterType : undefined,
      searchQuery,
      dateFrom,
      dateTo,
      authorId: user?.role !== 'admin' ? user?.id : undefined
    });
  }, [reports, searchQuery, filterStatus, filterType, filterDate, user]);
  
  // 보고서 상태 텍스트
  const getStatusText = (status: ReportStatus) => {
    switch (status) {
      case 'draft': return '작성 중';
      case 'submitted': return '제출됨';
      case 'approved': return '승인됨';
      case 'rejected': return '반려됨';
    }
  };
  
  // 보고서 유형 텍스트
  const getTypeText = (type: ReportTypeEnum) => {
    switch (type) {
      case 'daily': return '일일 보고서';
      case 'weekly': return '주간 보고서';
      case 'monthly': return '월간 보고서';
    }
  };
  
  // 보고서 상태 배지 스타일
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-100 text-slate-800';
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  // 보고서 유형 배지 스타일
  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'daily':
        return 'bg-blue-100 text-blue-800';
      case 'weekly':
        return 'bg-purple-100 text-purple-800';
      case 'monthly':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };
  
  // 보고서 카드 배경색
  const getCardBorderClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200';
      case 'rejected':
        return 'bg-red-50 border-red-200';
      case 'submitted':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-white border-slate-200';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">업무 보고서</h1>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="보고서 제목 또는 작성자 검색"
              className="form-input pl-10 py-2 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline inline-flex items-center"
          >
            <Filter size={16} className="mr-2" />
            필터
            {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus size={16} className="mr-2" />
            보고서 작성
          </button>
        </div>
      </div>
      
      {/* 필터 패널 */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg shadow-sm p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                상태
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReportStatus | 'all')}
                className="form-input w-full"
              >
                <option value="all">모든 상태</option>
                <option value="draft">작성 중</option>
                <option value="submitted">제출됨</option>
                <option value="approved">승인됨</option>
                <option value="rejected">반려됨</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                보고서 유형
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as ReportTypeEnum | 'all')}
                className="form-input w-full"
              >
                <option value="all">모든 유형</option>
                <option value="daily">일일 보고서</option>
                <option value="weekly">주간 보고서</option>
                <option value="monthly">월간 보고서</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                기간
              </label>
              <select
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value as 'all' | 'today' | 'week' | 'month')}
                className="form-input w-full"
              >
                <option value="all">전체 기간</option>
                <option value="today">오늘</option>
                <option value="week">최근 1주일</option>
                <option value="month">이번 달</option>
              </select>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* 보고서 목록 */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length > 0 ? (
          filteredReports.map(report => (
            <div 
              key={report.id}
              className={clsx(
                "border rounded-lg p-4 shadow-sm transition-colors hover:shadow cursor-pointer",
                getCardBorderClass(report.status)
              )}
              onClick={() => {
                setSelectedReport(report);
                setShowDetails(true);
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                <div className="flex items-start space-x-3">
                  {/* 상태 아이콘 */}
                  <div className={clsx(
                    "h-10 w-10 flex-shrink-0 rounded-full flex items-center justify-center",
                    report.status === 'approved' && "bg-green-100 text-green-700",
                    report.status === 'rejected' && "bg-red-100 text-red-700",
                    report.status === 'submitted' && "bg-blue-100 text-blue-700",
                    report.status === 'draft' && "bg-slate-100 text-slate-700"
                  )}>
                    {report.status === 'approved' && <CheckCircle size={20} />}
                    {report.status === 'rejected' && <AlertCircle size={20} />}
                    {report.status === 'submitted' && <Send size={20} />}
                    {report.status === 'draft' && <FileText size={20} />}
                  </div>
                  
                  {/* 보고서 제목과 배지들 */}
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <span className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getStatusBadgeClass(report.status)
                      )}>
                        {getStatusText(report.status)}
                      </span>
                      
                      <span className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getTypeBadgeClass(report.type)
                      )}>
                        {getTypeText(report.type)}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-slate-900">
                      {report.title}
                    </h3>
                  </div>
                </div>
                
                {/* 날짜 및 작성자 정보 */}
                <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col sm:items-end space-y-2">
                  <div className="flex items-center text-slate-600">
                    <Calendar size={16} className="mr-1.5" />
                    <span className="text-sm">
                      {format(parseISO(report.createdAt), 'yyyy년 M월 d일', { locale: ko })}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-slate-600">
                    <User size={16} className="mr-1.5" />
                    <span className="text-sm">{report.authorName}</span>
                  </div>
                </div>
              </div>
              
              {/* 보고서 내용 미리보기 */}
              <div className="mt-3">
                <p className="text-sm text-slate-600 line-clamp-2">
                  {report.content.length > 150 
                    ? `${report.content.substring(0, 150)}...` 
                    : report.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
                <FileText size={32} className="text-slate-400" />
              </div>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">보고서가 없습니다</h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || filterStatus !== 'all' || filterType !== 'all' || filterDate !== 'all'
                ? '필터 조건에 맞는 보고서가 없습니다. 필터를 변경해보세요.'
                : '새 보고서를 작성하여 시작해보세요.'}
            </p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="btn btn-primary inline-flex items-center"
            >
              <Plus size={16} className="mr-2" />
              보고서 작성
            </button>
          </div>
        )}
      </div>
      
      {/* 보고서 작성 폼 */}
      {showAddForm && (
        <AddReportForm onClose={() => setShowAddForm(false)} />
      )}
      
      {/* 보고서 상세 정보 */}
      {showDetails && selectedReport && (
        <ReportDetails 
          report={selectedReport} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </motion.div>
  );
};

export default WorkReports;
