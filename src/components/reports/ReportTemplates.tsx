import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Edit, Trash2, X, Copy, Save } from 'lucide-react';
import clsx from 'clsx';
import { useReport, ReportTemplate, ReportType, ReportCategory } from '../../contexts/ReportContext';

// Helper functions for display text
const getTypeText = (type: ReportType) => {
  switch (type) {
    case 'daily': return '일일 보고서';
    case 'weekly': return '주간 보고서';
    case 'monthly': return '월간 보고서';
    case 'performance': return '성과 보고서';
    case 'incident': return '사건 보고서';
    case 'custom': return '커스텀 보고서';
  }
};

const getCategoryText = (category: ReportCategory) => {
  switch (category) {
    case 'trainer': return '트레이너';
    case 'facility': return '시설';
    case 'client': return '고객';
    case 'financial': return '재정';
    case 'operational': return '운영';
  }
};

interface ReportTemplatesProps {
  onClose: () => void;
  onSelectTemplate: (template: ReportTemplate) => void;
}

const ReportTemplates = ({ onClose, onSelectTemplate }: ReportTemplatesProps) => {
  const { templates, createTemplate, updateTemplate, deleteTemplate } = useReport();
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const handleAddTemplate = () => {
    setEditingTemplate(null);
    setIsEditing(false);
    setShowTemplateForm(true);
  };
  
  const handleEditTemplate = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setIsEditing(true);
    setShowTemplateForm(true);
  };
  
  const handleDeleteTemplate = (template: ReportTemplate) => {
    if (window.confirm(`정말로 "${template.title}" 템플릿을 삭제하시겠습니까?`)) {
      deleteTemplate(template.id);
    }
  };
  
  const handleDuplicateTemplate = (template: ReportTemplate) => {
    const { id, ...templateWithoutId } = template;
    const newTemplate = {
      ...templateWithoutId,
      title: `${template.title} (복사본)`,
    };
    createTemplate(newTemplate as any);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-primary" />
            보고서 템플릿
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>
        
        {showTemplateForm ? (
          <TemplateForm 
            template={editingTemplate}
            isEditing={isEditing}
            onSave={() => setShowTemplateForm(false)}
            onCancel={() => setShowTemplateForm(false)}
          />
        ) : (
          <div className="p-6">
            <div className="flex justify-between mb-6">
              <p className="text-slate-600">
                보고서 작성 시 사용할 템플릿을 관리합니다.
              </p>
              <button
                onClick={handleAddTemplate}
                className="btn btn-primary inline-flex items-center"
              >
                <Plus size={16} className="mr-2" />
                템플릿 추가
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-slate-900">{template.title}</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {getTypeText(template.type)}
                      </span>
                      <span className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-full">
                        {getCategoryText(template.category)}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => onSelectTemplate(template)}
                      className="btn btn-outline btn-sm"
                    >
                      사용하기
                    </button>
                  </div>
                </div>
              ))}
              
              {templates.length === 0 && (
                <div className="col-span-3 text-center py-8 text-slate-500">
                  생성된 템플릿이 없습니다.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

interface TemplateFormProps {
  template: ReportTemplate | null;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

const TemplateForm = ({ template, isEditing, onSave, onCancel }: TemplateFormProps) => {
  const { createTemplate, updateTemplate } = useReport();
  
  const [formData, setFormData] = useState({
    title: template?.title || '',
    description: template?.description || '',
    type: template?.type || 'daily' as ReportType,
    category: template?.category || 'trainer' as ReportCategory,
    structure: template?.structure || {
      sections: [
        {
          title: '요약',
          description: '보고서 요약을 입력하세요',
          type: 'text',
          required: true
        }
      ],
      metrics: []
    }
  });
  
  // Form fields for adding sections and metrics
  const [newSection, setNewSection] = useState({
    title: '',
    description: '',
    type: 'text' as 'text' | 'metrics' | 'list' | 'table',
    required: true
  });
  
  const [newMetric, setNewMetric] = useState({
    name: '',
    label: '',
    unit: '',
    type: 'number' as 'number' | 'percentage' | 'currency' | 'text',
    required: true
  });
  
  const addSection = () => {
    if (!newSection.title) return;
    
    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        sections: [...formData.structure.sections, {...newSection}]
      }
    });
    
    // Reset form
    setNewSection({
      title: '',
      description: '',
      type: 'text',
      required: true
    });
  };
  
  const removeSection = (index: number) => {
    const updatedSections = [...formData.structure.sections];
    updatedSections.splice(index, 1);
    
    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        sections: updatedSections
      }
    });
  };
  
  const addMetric = () => {
    if (!newMetric.name || !newMetric.label) return;
    
    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        metrics: [...(formData.structure.metrics || []), {...newMetric}]
      }
    });
    
    // Reset form
    setNewMetric({
      name: '',
      label: '',
      unit: '',
      type: 'number',
      required: true
    });
  };
  
  const removeMetric = (index: number) => {
    const updatedMetrics = [...(formData.structure.metrics || [])];
    updatedMetrics.splice(index, 1);
    
    setFormData({
      ...formData,
      structure: {
        ...formData.structure,
        metrics: updatedMetrics
      }
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && template) {
      updateTemplate(template.id, formData);
    } else {
      createTemplate({
        ...formData,
        createdBy: 'admin-1' // In a real app, this would be the current user's ID
      });
    }
    
    onSave();
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            템플릿 제목
          </label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="form-input w-full"
            placeholder="템플릿 제목을 입력하세요"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            설명
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-input w-full"
            placeholder="템플릿에 대한 설명을 입력하세요"
            rows={2}
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              보고서 종류
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as ReportType })}
              className="form-input w-full"
            >
              <option value="daily">일일 보고서</option>
              <option value="weekly">주간 보고서</option>
              <option value="monthly">월간 보고서</option>
              <option value="performance">성과 보고서</option>
              <option value="incident">사건 보고서</option>
              <option value="custom">커스텀 보고서</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              카테고리
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ReportCategory })}
              className="form-input w-full"
            >
              <option value="trainer">트레이너</option>
              <option value="facility">시설</option>
              <option value="client">고객</option>
              <option value="financial">재정</option>
              <option value="operational">운영</option>
            </select>
          </div>
        </div>
        
        {/* Sections */}
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            보고서 섹션
          </h3>
          
          {/* Existing sections */}
          {formData.structure.sections.map((section, index) => (
            <div 
              key={index}
              className="mb-2 bg-slate-50 rounded-lg p-3 border border-slate-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{section.title}</h4>
                  {section.description && <p className="text-sm text-slate-500">{section.description}</p>}
                  <div className="flex mt-1 space-x-2">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                      {section.type === 'text' ? '텍스트' :
                       section.type === 'metrics' ? '메트릭' :
                       section.type === 'list' ? '리스트' : '테이블'}
                    </span>
                    <span className={clsx(
                      "px-2 py-0.5 rounded-full text-xs",
                      section.required 
                        ? "bg-red-100 text-red-800"
                        : "bg-slate-100 text-slate-700"
                    )}>
                      {section.required ? '필수' : '선택'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {/* Add section form */}
          <div className="mt-3 bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">새 섹션 추가</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    섹션 제목
                  </label>
                  <input
                    type="text"
                    value={newSection.title}
                    onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                    className="form-input w-full"
                    placeholder="섹션 제목"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    섹션 타입
                  </label>
                  <select
                    value={newSection.type}
                    onChange={(e) => setNewSection({ ...newSection, type: e.target.value as any })}
                    className="form-input w-full"
                  >
                    <option value="text">텍스트</option>
                    <option value="metrics">메트릭</option>
                    <option value="list">리스트</option>
                    <option value="table">테이블</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  설명 (선택)
                </label>
                <input
                  type="text"
                  value={newSection.description}
                  onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                  className="form-input w-full"
                  placeholder="섹션에 대한 설명"
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sectionRequired"
                  checked={newSection.required}
                  onChange={(e) => setNewSection({ ...newSection, required: e.target.checked })}
                  className="form-checkbox h-4 w-4"
                />
                <label htmlFor="sectionRequired" className="ml-2 text-sm text-slate-700">
                  필수 항목
                </label>
              </div>
              
              <div className="text-right">
                <button
                  type="button"
                  onClick={addSection}
                  disabled={!newSection.title}
                  className="btn btn-primary btn-sm inline-flex items-center"
                >
                  <Plus size={14} className="mr-1" />
                  섹션 추가
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Metrics */}
        <div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            메트릭
          </h3>
          
          {/* Existing metrics */}
          {formData.structure.metrics && formData.structure.metrics.length > 0 ? (
            <div className="mb-3 bg-slate-50 rounded-lg p-3 border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-4 font-medium">명칭</th>
                    <th className="text-left py-2 px-4 font-medium">라벨</th>
                    <th className="text-left py-2 px-4 font-medium">단위</th>
                    <th className="text-left py-2 px-4 font-medium">타입</th>
                    <th className="text-left py-2 px-4 font-medium">필수</th>
                    <th className="text-right py-2 px-4 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.structure.metrics.map((metric, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="py-2 px-4">{metric.name}</td>
                      <td className="py-2 px-4">{metric.label}</td>
                      <td className="py-2 px-4">{metric.unit || '-'}</td>
                      <td className="py-2 px-4">
                        {metric.type === 'number' ? '숫자' :
                         metric.type === 'percentage' ? '퍼센트' :
                         metric.type === 'currency' ? '금액' : '텍스트'}
                      </td>
                      <td className="py-2 px-4">
                        {metric.required ? '예' : '아니오'}
                      </td>
                      <td className="py-2 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => removeMetric(index)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-3">
              아직 메트릭이 없습니다. 아래에서 추가해보세요.
            </p>
          )}
          
          {/* Add metric form */}
          <div className="bg-slate-50 rounded-lg p-4">
            <h4 className="font-medium text-slate-900 mb-2">새 메트릭 추가</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    식별자 (영문)
                  </label>
                  <input
                    type="text"
                    value={newMetric.name}
                    onChange={(e) => setNewMetric({ ...newMetric, name: e.target.value })}
                    className="form-input w-full"
                    placeholder="예: totalHours"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    라벨 (한글)
                  </label>
                  <input
                    type="text"
                    value={newMetric.label}
                    onChange={(e) => setNewMetric({ ...newMetric, label: e.target.value })}
                    className="form-input w-full"
                    placeholder="예: 총 시간"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    단위 (선택)
                  </label>
                  <input
                    type="text"
                    value={newMetric.unit}
                    onChange={(e) => setNewMetric({ ...newMetric, unit: e.target.value })}
                    className="form-input w-full"
                    placeholder="예: 시간, 인원, 원"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    데이터 타입
                  </label>
                  <select
                    value={newMetric.type}
                    onChange={(e) => setNewMetric({ ...newMetric, type: e.target.value as any })}
                    className="form-input w-full"
                  >
                    <option value="number">숫자</option>
                    <option value="percentage">퍼센트</option>
                    <option value="currency">금액</option>
                    <option value="text">텍스트</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="metricRequired"
                  checked={newMetric.required}
                  onChange={(e) => setNewMetric({ ...newMetric, required: e.target.checked })}
                  className="form-checkbox h-4 w-4"
                />
                <label htmlFor="metricRequired" className="ml-2 text-sm text-slate-700">
                  필수 항목
                </label>
              </div>
              
              <div className="text-right">
                <button
                  type="button"
                  onClick={addMetric}
                  disabled={!newMetric.name || !newMetric.label}
                  className="btn btn-primary btn-sm inline-flex items-center"
                >
                  <Plus size={14} className="mr-1" />
                  메트릭 추가
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
        >
          취소
        </button>
        <button
          type="submit"
          className="btn btn-primary inline-flex items-center"
        >
          <Save size={16} className="mr-2" />
          {isEditing ? '템플릿 수정' : '템플릿 저장'}
        </button>
      </div>
    </form>
  );
};

export default ReportTemplates; 