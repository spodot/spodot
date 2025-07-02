import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, FileText, Repeat, CheckSquare, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useSchedule, SessionType, RecurrenceType } from '../../contexts/ScheduleContext';
import { useAuth } from '../../contexts/AuthContext';

interface AddScheduleFormProps {
  onClose: () => void;
  initialDate?: string;
}

const AddScheduleForm = ({ onClose, initialDate }: AddScheduleFormProps) => {
  const { addSchedule } = useSchedule();
  const { user, isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    clientName: '',
    type: 'PT' as SessionType,
    date: initialDate || format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    notes: '',
    recurrence: 'none' as RecurrenceType,
    recurrenceEndDate: format(new Date(), 'yyyy-MM-dd')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // OT 세션은 관리자만 생성 가능
    if (formData.type === 'OT' && !isAdmin) {
      alert('OT 세션은 관리자만 생성할 수 있습니다.');
      return;
    }
    
    addSchedule({
      clientName: formData.clientName,
      trainerId: user?.id || 'unknown',
      trainerName: user?.name || 'unknown',
      type: formData.type,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      notes: formData.notes,
      recurrence: formData.recurrence,
      recurrenceEndDate: formData.recurrence !== 'none' ? formData.recurrenceEndDate : undefined
    });
    
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-slate-900 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-primary" />
            일정 추가
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              고객 이름
            </label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                className="form-input pl-10"
                placeholder="고객 이름을 입력하세요"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              세션 유형
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as SessionType })}
              className="form-input"
            >
              <option value="PT">PT 세션</option>
              <option value="OT" disabled={!isAdmin}>
                OT 세션 {!isAdmin && '(관리자 전용)'}
              </option>
              <option value="GROUP">그룹 수업</option>
              <option value="CONSULT">상담</option>
            </select>
            {!isAdmin && (
              <div className="mt-1 flex items-center text-amber-600 text-xs">
                <Shield size={12} className="mr-1" />
                OT 세션은 관리자만 생성할 수 있습니다.
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              날짜
            </label>
            <div className="relative">
              <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                시작 시간
              </label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                종료 시간
              </label>
              <div className="relative">
                <Clock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="time"
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  className="form-input pl-10"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              반복
            </label>
            <div className="relative">
              <Repeat size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as RecurrenceType })}
                className="form-input pl-10"
              >
                <option value="none">반복 없음</option>
                <option value="daily">매일</option>
                <option value="weekly">매주</option>
                <option value="monthly">매월</option>
              </select>
            </div>
          </div>
          
          {formData.recurrence !== 'none' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                반복 종료 날짜
              </label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  required
                  value={formData.recurrenceEndDate}
                  onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                  className="form-input pl-10"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              메모
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="form-input pl-10 pt-10"
                rows={3}
                placeholder="추가 메모를 입력하세요"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
            >
              <CheckSquare size={16} className="mr-2" />
              일정 추가
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default AddScheduleForm;