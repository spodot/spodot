import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useReport, ReportType, ReportCategory, ReportStatus } from '../../contexts/ReportContext';
import { useAuth } from '../../contexts/AuthContext';

interface AddReportFormProps {
  onClose: () => void;
  defaultType?: ReportType;
  initialDate?: string;
}

const AddReportForm = ({ onClose, defaultType = 'daily', initialDate }: AddReportFormProps) => {
  const { createReport } = useReport();
  const { user } = useAuth();
  
  const getDefaultTitle = (type: ReportType, date?: string): string => {
    switch (type) {
      case 'daily':
        return `${format(date ? new Date(date + 'T00:00:00') : new Date(), 'yyyy-MM-dd')} 일일 업무 보고`;
      case 'weekly':
        return `${format(new Date(), 'yyyy-MM-dd')} 주간 업무 보고`;
      case 'monthly':
        return `${format(new Date(), 'yyyy-MM')} 월간 업무 보고`;
      default:
        const formattedDate = date ? format(new Date(date + 'T00:00:00'), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
        return `${formattedDate} ${typeName} Report`;
    }
  };
  
  const [formData, setFormData] = useState({
    title: getDefaultTitle(defaultType, defaultType === 'daily' ? initialDate : undefined),
    content: '',
    type: defaultType
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;

    let reportCategory: ReportCategory = 'operational'; 
    if (user.role === 'trainer') {
      reportCategory = 'trainer';
    }
    
    createReport({
      ...formData,
      createdBy: user.id,
      createdByName: user.name || user.email,
      category: reportCategory,
      status: 'draft',
    });
    
    onClose();
  };
  
  const handleTypeChange = (type: ReportType) => {
    setFormData({
      ...formData,
      type,
      title: getDefaultTitle(type, type === 'daily' ? initialDate : undefined)
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            업무 보고서 작성
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600:text-slate-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                보고서 종류
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange('daily')}
                  className={`p-3 rounded-lg flex items-center justify-center text-sm font-medium ${
                    formData.type === 'daily'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200:bg-slate-600'
                  }`}
                >
                  일일 보고서
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('weekly')}
                  className={`p-3 rounded-lg flex items-center justify-center text-sm font-medium ${
                    formData.type === 'weekly'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200:bg-slate-600'
                  }`}
                >
                  주간 보고서
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('monthly')}
                  className={`p-3 rounded-lg flex items-center justify-center text-sm font-medium ${
                    formData.type === 'monthly'
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200:bg-slate-600'
                  }`}
                >
                  월간 보고서
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                보고서 제목
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input w-full"
                placeholder="보고서 제목을 입력하세요"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                보고서 내용
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="form-input h-64 w-full"
                placeholder="보고서 내용을 입력하세요"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn-primary inline-flex items-center"
            >
              <Save size={16} className="mr-2" />
              임시저장
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddReportForm;