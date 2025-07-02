import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../../contexts/TaskContext';
import { useUser } from '../../contexts/UserContext'; // Staff 타입 사용
import clsx from 'clsx';

interface EditTaskModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<Task>) => void;
}

const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, isOpen, onClose, onSave }) => {
  const { staff: staffList, loadingStaff } = useUser(); // 실제 직원 목록 사용
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || '',
    status: task.status,
    priority: task.priority,
    category: task.category,
    dueDate: task.dueDate.split('T')[0], // YYYY-MM-DD 형식으로 변환
    startTime: task.startTime || '',
    endTime: task.endTime || '',
    assignedTo: task.assignedTo
  });

  // task가 변경될 때마다 폼 데이터 업데이트
  useEffect(() => {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate.split('T')[0],
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      assignedTo: task.assignedTo
    });
  }, [task]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAssigneeChange = (staffId: string) => {
    const isAssigned = formData.assignedTo.includes(staffId);
    setFormData(prev => ({
      ...prev,
      assignedTo: isAssigned 
        ? prev.assignedTo.filter(id => id !== staffId)
        : [...prev.assignedTo, staffId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 담당자 이름 배열 생성
      const assignedToNames = formData.assignedTo.map(staffId => {
        const staff = staffList?.find(s => s.id === staffId);
        return staff?.name || staffId;
      });

      const updates: Partial<Task> = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        category: formData.category,
        dueDate: new Date(formData.dueDate).toISOString(),
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        assignedTo: formData.assignedTo,
        assignedToName: assignedToNames,
        updatedAt: new Date().toISOString()
      };

      onSave(updates);
    } catch (error) {
      console.error('업무 수정 실패:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reset = () => {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate.split('T')[0],
      startTime: task.startTime || '',
      endTime: task.endTime || '',
      assignedTo: task.assignedTo
    });
  };

  if (!isOpen) return null;

  // 활성 상태인 직원만 필터링
  const activeStaff = staffList?.filter(staff => staff.status === 'active') || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[calc(100vh-4rem)] overflow-y-auto my-8">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900">업무 수정</h2>
          <button
            onClick={() => { reset(); onClose(); }}
            className="text-slate-400 hover:text-slate-600"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              업무 제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              업무 설명
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 상태 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="pending">대기중</option>
                <option value="in-progress">진행중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>

            {/* 우선순위 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                우선순위
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="low">낮음</option>
                <option value="medium">보통</option>
                <option value="high">높음</option>
                <option value="urgent">긴급</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 카테고리 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                카테고리
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">일반</option>
                <option value="maintenance">유지보수</option>
                <option value="administrative">행정</option>
                <option value="client">고객</option>
                <option value="training">교육</option>
              </select>
            </div>

            {/* 마감일 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                마감일 *
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 시작 시간 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                시작 시간
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* 종료 시간 */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                종료 시간
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* 담당자 */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              담당자
            </label>
            {loadingStaff ? (
              <div className="w-full p-3 border border-slate-300 rounded-md text-slate-500">
                직원 목록을 불러오는 중...
              </div>
            ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-300 rounded-md p-3">
                {activeStaff.length === 0 ? (
                  <div className="text-slate-500 text-sm">등록된 직원이 없습니다.</div>
                ) : (
                  activeStaff.map(staff => (
                    <label key={staff.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                        checked={formData.assignedTo.includes(staff.id)}
                        onChange={() => handleAssigneeChange(staff.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">
                        {staff.name} {staff.department && `(${staff.department})`}
                  </span>
                </label>
                  ))
                )}
            </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-300"
              disabled={isSubmitting}
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || loadingStaff}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal; 