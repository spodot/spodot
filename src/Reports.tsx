import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText } from 'lucide-react';
import { useReport, Report } from './contexts/ReportContext';
import { useAuth } from './contexts/AuthContext';
import ReportsList from './components/reports/ReportsList';
import ReportDetails from './components/reports/ReportDetails';
import ReportForm from './components/forms/ReportForm';

const Reports = () => {
  const { user } = useAuth();
  const { reports, filterReports } = useReport();
  
  // States for showing different modals and selected items
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter reports for the current user
  useState(() => {
    if (user) {
      filterReports({
        createdBy: user.id
      });
    }
  }, [user]);
  
  // Handlers for actions
  const handleSelectReport = (report: Report) => {
    setSelectedReport(report);
    setShowReportDetails(true);
  };
  
  const handleCreateReport = () => {
    setSelectedReport(null);
    setShowCreateForm(true);
  };
  
  const handleCloseDetails = () => {
    setShowReportDetails(false);
    setSelectedReport(null);
  };
  
  const handleCloseForm = () => {
    setShowCreateForm(false);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">나의 보고서</h1>
        
        <button
          onClick={handleCreateReport}
          className="btn btn-primary inline-flex items-center"
        >
          <Plus size={16} className="mr-2" />
          보고서 작성
        </button>
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
        />
      )}
      
      {/* Create report form */}
      {showCreateForm && (
        <ReportForm
          onClose={handleCloseForm}
        />
      )}
    </motion.div>
  );
};

export default Reports; 