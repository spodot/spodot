import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookTemplate, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useReport, Report } from '../../contexts/ReportContext';
import ReportsList from '../../components/reports/ReportsList';
import ReportDetails from '../../components/reports/ReportDetails';
import ReportForm from '../../components/forms/ReportForm';
import ReportTemplates from '../../components/reports/ReportTemplates';

const ReportManagement = () => {
  const { reports, filteredReports, filterReports } = useReport();
  
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDailyReports, setShowDailyReports] = useState(false);
  
  // 일일 보고서 관련 상태
  const [dailyReportFilter, setDailyReportFilter] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    author: 'all'
  });

  // 일일 보고서 데이터 (실제 수파베이스 데이터에서 가져오기)
  const getDailyReports = () => {
    return reports
      .filter(report => 
        report.type === 'daily' && 
        (!dailyReportFilter.date || 
         new Date(report.createdAt).toISOString().split('T')[0] === dailyReportFilter.date)
      )
      .map(report => {
        try {
          const parsedContent = JSON.parse(report.content);
          return {
            id: report.id,
            date: new Date(report.createdAt).toISOString().split('T')[0],
            title: report.title,
            completed: parsedContent.완료한업무 || '',
            inProgress: parsedContent.진행중인업무 || '',
            planned: parsedContent.예정된업무 || '',
            issues: parsedContent.특이사항및건의사항 || '',
            lastSaved: report.updatedAt,
            author: report.createdByName
          };
        } catch (error) {
          console.error('보고서 파싱 오류:', error);
          return {
            id: report.id,
            date: new Date(report.createdAt).toISOString().split('T')[0],
            title: report.title,
            completed: report.content,
            inProgress: '',
            planned: '',
            issues: '',
            lastSaved: report.updatedAt,
            author: report.createdByName
          };
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportDetails(true);
  };
  
  const handleCreateReport = () => {
    setSelectedReport(null);
    setSelectedTemplate(null);
    setShowCreateForm(true);
  };
  
  const handleCreateFromTemplate = (template: any) => {
    setSelectedTemplate(template);
    setShowCreateForm(true);
    setShowTemplates(false);
  };
  
  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setShowEditForm(true);
    setShowReportDetails(false);
  };
  
  const handleCloseDetails = () => {
    setShowReportDetails(false);
    setSelectedReport(null);
  };
  
  const handleCloseForm = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
    setSelectedReport(null);
    setSelectedTemplate(null);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">보고서 관리</h1>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowDailyReports(!showDailyReports)}
            className={`btn ${showDailyReports ? 'btn-primary' : 'btn-outline'} inline-flex items-center`}
          >
            <Calendar size={16} className="mr-2" />
            일일 보고서
          </button>
          
          <button
            onClick={() => setShowTemplates(true)}
            className="btn btn-outline inline-flex items-center"
          >
            <BookTemplate size={16} className="mr-2" />
            템플릿
          </button>
          
          <button
            onClick={handleCreateReport}
            className="btn btn-primary inline-flex items-center"
          >
            <Plus size={16} className="mr-2" />
            보고서 작성
          </button>
        </div>
      </div>
      
      {/* 일일 보고서 조회 */}
      {showDailyReports ? (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-semibold text-slate-900">직원 일일 업무 보고</h2>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Calendar size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    value={dailyReportFilter.date}
                    onChange={(e) => setDailyReportFilter({ ...dailyReportFilter, date: e.target.value })}
                    className="form-input pl-10"
                  />
                </div>
              </div>
            </div>
            
            {/* 일일 보고서 목록 */}
            <div className="space-y-4">
              {getDailyReports().map((report) => (
                <div key={report.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-900">{report.title}</h3>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {report.date}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {report.completed && (
                          <div>
                            <span className="font-medium text-slate-700">완료 업무:</span>
                            <p className="text-slate-600 mt-1 line-clamp-2">{report.completed}</p>
                          </div>
                        )}
                        {report.inProgress && (
                          <div>
                            <span className="font-medium text-slate-700">진행 업무:</span>
                            <p className="text-slate-600 mt-1 line-clamp-2">{report.inProgress}</p>
                          </div>
                        )}
                        {report.planned && (
                          <div>
                            <span className="font-medium text-slate-700">예정 업무:</span>
                            <p className="text-slate-600 mt-1 line-clamp-2">{report.planned}</p>
                          </div>
                        )}
                        {report.issues && (
                          <div>
                            <span className="font-medium text-slate-700">특이사항:</span>
                            <p className="text-slate-600 mt-1 line-clamp-2">{report.issues}</p>
                          </div>
                        )}
                      </div>
                      
                      {report.lastSaved && (
                        <div className="mt-3 text-xs text-slate-500">
                          마지막 저장: {new Date(report.lastSaved).toLocaleString('ko-KR')}
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => {
                        // 실제 보고서 찾아서 상세 모달 열기
                        const actualReport = reports.find(r => r.id === report.id);
                        if (actualReport) {
                          handleSelectReport(actualReport);
                        }
                      }}
                      className="btn btn-outline btn-sm inline-flex items-center"
                    >
                      <Eye size={14} className="mr-1" />
                      상세보기
                    </button>
                  </div>
                </div>
              ))}
              
              {getDailyReports().length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  선택한 날짜에 작성된 일일 보고서가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* Reports list */}
      <ReportsList 
        onSelectReport={handleSelectReport}
        onCreateReport={handleCreateReport}
      />
        </>
      )}
      
      {/* Report details modal */}
      {showReportDetails && selectedReport && (
        <ReportDetails
          report={selectedReport}
          onClose={handleCloseDetails}
          onEdit={() => handleEditReport(selectedReport)}
        />
      )}
      
      {/* Create/Edit report form */}
      {(showCreateForm || showEditForm) && (
        <ReportForm
          onClose={handleCloseForm}
          report={showEditForm ? selectedReport : undefined}
          defaultType={selectedTemplate?.type}
        />
      )}
      
      {/* Templates management */}
      {showTemplates && (
        <ReportTemplates
          onClose={() => setShowTemplates(false)}
          onSelectTemplate={handleCreateFromTemplate}
        />
      )}
    </motion.div>
  );
};

export default ReportManagement;
