import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, BookTemplate, Settings } from 'lucide-react';
import { ReportProvider, useReport, Report, ReportTemplate } from '../../contexts/ReportContext';
import ReportsList from '../../components/reports/ReportsList';
import ReportDetails from '../../components/reports/ReportDetails';
import ReportForm from '../../components/forms/ReportForm';
import ReportTemplates from '../../components/reports/ReportTemplates';

const ReportManagement = () => {
  // States for showing different modals and selected items
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  
  // Handlers for actions
  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportDetails(true);
  };
  
  const handleCreateReport = () => {
    setSelectedReport(null);
    setSelectedTemplate(null);
    setShowCreateForm(true);
  };
  
  const handleCreateFromTemplate = (template: ReportTemplate) => {
    setSelectedTemplate(template);
    setShowTemplates(false);
    setShowCreateForm(true);
  };
  
  const handleEditReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportDetails(false);
    setShowEditForm(true);
  };
  
  const handleCloseDetails = () => {
    setShowReportDetails(false);
    setSelectedReport(null);
  };
  
  const handleCloseForm = () => {
    setShowCreateForm(false);
    setShowEditForm(false);
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
      
      {/* Reports list */}
      <ReportsList 
        onSelectReport={handleSelectReport}
        onCreateReport={handleCreateReport}
      />
      
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