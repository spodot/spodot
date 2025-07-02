import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, User, FileText, Repeat, CheckSquare, Shield } from 'lucide-react';
import { format } from 'date-fns';
import { useSchedule, Schedule, SessionType, RecurrenceType } from '../../contexts/ScheduleContext';
import { useAuth } from '../../contexts/AuthContext';
import clsx from 'clsx';

interface EditScheduleFormProps {
  schedule: Schedule;
  onClose: () => void;
  onSuccess?: (updatedSchedule: Schedule) => void;
}

const EditScheduleForm = ({ schedule, onClose, onSuccess }: EditScheduleFormProps) => {
  const { updateSchedule } = useSchedule();
  const { user, isAdmin } = useAuth();
  
  const [formData, setFormData] = useState({
    clientName: schedule.clientName,
    type: schedule.type,
    date: schedule.date,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    notes: schedule.notes || '',
    isCompleted: schedule.isCompleted
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // OT 세션 수정은 관리자만 가능
    if (formData.type === 'OT' && !isAdmin) {
      alert('OT 세션은 관리자만 수정할 수 있습니다.');
      return;
    }
    
    // 기존 OT 세션을 다른 타입으로 변경하는 것도 관리자만 가능
    if (schedule.type === 'OT' && formData.type !== 'OT' && !isAdmin) {
      alert('OT 세션의 유형 변경은 관리자만 가능합니다.');
      return;
    }
    
    updateSchedule(schedule.id, {
      clientName: formData.clientName,
      type: formData.type,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      notes: formData.notes,
      isCompleted: formData.isCompleted
    });
    
    const updatedSchedule = {
      ...schedule,
      clientName: formData.clientName,
      type: formData.type,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      notes: formData.notes,
      isCompleted: formData.isCompleted,
      updatedAt: new Date().toISOString()
    };
    
    onClose();
    if (onSuccess) {
      onSuccess(updatedSchedule);
    }
  };

  // OT 세션이고 관리자가 아닌 경우 읽기 전용 모드
  const isOTReadOnly = schedule.type === 'OT' && !isAdmin;

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
            일정 수정
            {isOTReadOnly && (
              <span className="ml-2 text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                읽기 전용
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        {isOTReadOnly && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200">
            <div className="flex items-center text-amber-700">
              <Shield size={16} className="mr-2" />
              <span className="text-sm">OT 세션은 관리자만 수정할 수 있습니다.</span>
            </div>
          </div>
        )}

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
                className={clsx("form-input pl-10", isOTReadOnly && "bg-gray-50 cursor-not-allowed")}
                placeholder="고객 이름을 입력하세요"
                disabled={isOTReadOnly}
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
              className={clsx("form-input", isOTReadOnly && "bg-gray-50 cursor-not-allowed")}
              disabled={isOTReadOnly}
            >
              <option value="PT">PT 세션</option>
              <option value="OT" disabled={!isAdmin && schedule.type !== 'OT'}>
                OT 세션 {!isAdmin && schedule.type !== 'OT' && '(관리자 전용)'}
              </option>
              <option value="GROUP">그룹 수업</option>
              <option value="CONSULT">상담</option>
            </select>
            {!isAdmin && !isOTReadOnly && (
              <div className="mt-1 flex items-center text-amber-600 text-xs">
                <Shield size={12} className="mr-1" />
                OT 세션으로 변경은 관리자만 가능합니다.
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
                className={clsx("form-input pl-10", isOTReadOnly && "bg-gray-50 cursor-not-allowed")}
                disabled={isOTReadOnly}
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
                  className={clsx("form-input pl-10", isOTReadOnly && "bg-gray-50 cursor-not-allowed")}
                  disabled={isOTReadOnly}
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
                  className={clsx("form-input pl-10", isOTReadOnly && "bg-gray-50 cursor-not-allowed")}
                  disabled={isOTReadOnly}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              메모
            </label>
            <div className="relative">
              <FileText size={18} className="absolute left-3 top-3 text-slate-400" />
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={clsx("form-input pl-10 h-24", isOTReadOnly && "bg-gray-50 cursor-not-allowed")}
                placeholder="세션에 대한 메모를 입력하세요"
                disabled={isOTReadOnly}
              />
            </div>
          </div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="isCompleted"
              checked={formData.isCompleted}
              onChange={(e) => setFormData({ ...formData, isCompleted: e.target.checked })}
              className={clsx("form-checkbox h-4 w-4 text-primary", isOTReadOnly && "cursor-not-allowed")}
              disabled={isOTReadOnly}
            />
            <label htmlFor="isCompleted" className={clsx("ml-2 text-sm text-slate-700", isOTReadOnly && "text-gray-500")}>
              완료됨으로 표시
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {isOTReadOnly ? '닫기' : '취소'}
            </button>
            {!isOTReadOnly && (
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center"
              >
                <CheckSquare size={16} className="mr-2" />
                저장
              </button>
            )}
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditScheduleForm; 