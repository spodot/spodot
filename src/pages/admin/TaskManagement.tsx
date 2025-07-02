import React, { useState } from 'react';
import { useTask, Task, TaskStatus, TaskPriority } from '../../contexts/TaskContext';
import { useUser } from '../../contexts/UserContext';
import { format, parseISO } from 'date-fns';
import { Edit2, Trash2, PlusSquare, X } from 'lucide-react';

// AllTasks.tsx 또는 MyTasks.tsx 에서 가져온 헬퍼 함수들 (Task 컨텍스트 타입 기반)
const getPriorityClass = (priority: TaskPriority | undefined) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'urgent': return 'bg-purple-600';
    case 'medium': return 'bg-orange-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

const getStatusDisplayName = (status: TaskStatus | undefined) => {
  switch (status) {
    case 'pending': return '대기중';
    case 'in-progress': return '진행중';
    case 'completed': return '완료';
    case 'cancelled': return '취소됨';
    default: return status || 'N/A';
  }
};

const getCategoryDisplayName = (category: string) => {
  switch (category) {
    case 'maintenance': return '유지보수';
    case 'client': return '고객';
    case 'administrative': return '행정';
    case 'training': return '트레이닝';
    case 'general': return '일반';
    default: return category;
  }
};

const AdminTaskManagement: React.FC = () => {
  const { tasks, addTask, updateTask, deleteTask } = useTask();
  const { staff: staffList = [] } = useUser();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskData, setNewTaskData] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedTo: [],
    assignedToName: [],
    dueDate: '',
    priority: 'medium',
    status: 'pending',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (isEditModalOpen && editingTask) {
      setEditingTask(prev => prev ? { ...prev, [name]: value } : null);
    } else {
      setNewTaskData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const dateValue = value ? new Date(value).toISOString() : '';
    if (isEditModalOpen && editingTask) {
      setEditingTask(prev => prev ? { ...prev, [name]: dateValue } : null);
    } else {
      setNewTaskData(prev => ({ ...prev, [name]: dateValue }));
    }
  };

  const resetNewTaskData = () => {
    setNewTaskData({
      title: '',
      description: '',
      assignedTo: [],
      assignedToName: [],
      dueDate: '',
      priority: 'medium',
      status: 'pending',
    });
  }

  const handleAddTask = async () => {
    if (!newTaskData.title || !newTaskData.dueDate) {
      alert('업무명과 마감일은 필수 항목입니다.');
      return;
    }
    try {
      await addTask({
        ...newTaskData,
      } as Omit<Task, 'id' | 'createdAt'>);
      setIsModalOpen(false);
      resetNewTaskData();
    } catch (error) {
      console.error('Failed to add task:', error);
      alert('업무 추가에 실패했습니다.');
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    if (!editingTask.title || !editingTask.dueDate) {
      alert('업무명과 마감일은 필수 항목입니다.');
      return;
    }
    try {
      await updateTask(editingTask.id, editingTask);
      setIsEditModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('업무 수정에 실패했습니다.');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (window.confirm('정말로 이 업무를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await deleteTask(taskId);
        // 성공 알림 (선택 사항)
      } catch (error) {
        console.error('Failed to delete task:', error);
        alert('업무 삭제에 실패했습니다.');
      }
    }
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">업무 관리 (관리자)</h1>
        <button 
          onClick={() => setIsModalOpen(true)} 
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center shadow-md transition-colors">
          <PlusSquare size={20} className="mr-2" />
          새 업무 추가
        </button>
      </header>
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">전체 업무 목록</h2>
        
        {tasks.length === 0 ? (
          <p className="text-slate-500">등록된 업무가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[20%]">업무명</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[12%]">카테고리</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[15%]">담당자</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[10%]">상태</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[10%]">마감일</th>
                  <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider w-[10%]">생성일</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider w-[8%]">중요도</th>
                  <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider w-[12%]">작업</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task: Task) => (
                  <tr key={task.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="py-3 pr-3">
                      <p className="font-semibold text-slate-800">{task.title}</p>
                      {task.description && <p className="text-xs text-slate-500 truncate w-64" title={task.description}>{task.description}</p>}
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700">{getCategoryDisplayName(task.category)}</td>
                    <td className="py-3 pr-3 text-sm text-slate-700">
                      {Array.isArray(task.assignedToName) && task.assignedToName.length > 0 
                        ? task.assignedToName.join(', ') 
                        : task.assignedToName || 'N/A'}
                    </td>
                    <td className="py-3 pr-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full`}> 
                        {getStatusDisplayName(task.status)}
                      </span>
                    </td>
                    <td className="py-3 pr-3 text-sm text-slate-700">{task.dueDate ? format(parseISO(task.dueDate), 'yyyy-MM-dd') : 'N/A'}</td>
                    <td className="py-3 pr-3 text-sm text-slate-700">{task.createdAt ? format(parseISO(task.createdAt), 'yyyy-MM-dd') : 'N/A'}</td>
                    <td className="py-3 text-center">
                      <span className={`inline-block h-3 w-3 rounded-full ${getPriorityClass(task.priority)}`} title={task.priority || 'N/A'}></span>
                    </td>
                    <td className="py-3 text-center space-x-2">
                      <button 
                        onClick={() => openEditModal(task)} 
                        className="text-blue-600 hover:text-blue-800 transition-colors" 
                        title="수정">
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTask(task.id)} 
                        className="text-red-500 hover:text-red-700 transition-colors" 
                        title="삭제">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 새 업무 추가 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-slate-800">새 업무 추가</h3>
              <button onClick={() => { setIsModalOpen(false); resetNewTaskData(); }} className="text-slate-500 hover:text-slate-700">
                <X size={28} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">업무명 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="title" 
                  id="title" 
                  value={newTaskData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="예: 주간 보고서 작성"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                <textarea 
                  name="description" 
                  id="description" 
                  rows={3}
                  value={newTaskData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="업무에 대한 상세 내용을 입력하세요."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">담당자</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-300 rounded-md p-3">
                    {staffList && staffList.length > 0 ? (
                      staffList
                        .filter(staff => staff.status === 'active')
                        .map(staff => (
                          <label key={staff.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={newTaskData.assignedTo?.includes(staff.id) || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewTaskData(prev => {
                                  const assignedTo = checked
                                    ? [...(prev.assignedTo || []), staff.id]
                                    : (prev.assignedTo || []).filter(id => id !== staff.id);
                                  const assignedToName = assignedTo.map(id => {
                                    const s = staffList.find(st => st.id === id);
                                    return s ? s.name : '';
                                  });
                                  return { ...prev, assignedTo, assignedToName };
                                });
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                              {staff.name} {staff.department && `(${staff.department})`}
                            </span>
                          </label>
                        ))
                    ) : (
                      <div className="text-slate-500 text-sm">등록된 직원이 없습니다.</div>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700 mb-1">마감일 <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="dueDate" 
                    id="dueDate" 
                    value={newTaskData.dueDate ? format(parseISO(newTaskData.dueDate), 'yyyy-MM-dd') : ''}
                    onChange={handleDateChange} 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">중요도</label>
                  <select 
                    name="priority" 
                    id="priority" 
                    value={newTaskData.priority}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-1">상태</label>
                  <select 
                    name="status" 
                    id="status" 
                    value={newTaskData.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="pending">대기중</option>
                    <option value="in-progress">진행중</option>
                    <option value="completed">완료</option> 
                    <option value="cancelled">취소됨</option> 
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => { setIsModalOpen(false); resetNewTaskData(); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                취소
              </button>
              <button 
                type="button" 
                onClick={handleAddTask}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                업무 추가
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 업무 수정 모달 */}
      {isEditModalOpen && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-2xl transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-slate-800">업무 수정</h3>
              <button onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }} className="text-slate-500 hover:text-slate-700">
                <X size={28} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-slate-700 mb-1">업무명 <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="title" 
                  id="edit-title" 
                  value={editingTask.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 mb-1">설명</label>
                <textarea 
                  name="description" 
                  id="edit-description" 
                  rows={3}
                  value={editingTask.description || ''}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">담당자</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-300 rounded-md p-3">
                    {staffList && staffList.length > 0 ? (
                      staffList
                        .filter(staff => staff.status === 'active')
                        .map(staff => (
                          <label key={staff.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={editingTask.assignedTo?.includes(staff.id) || false}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setEditingTask(prev => {
                                  if (!prev) return null;
                                  const assignedTo = checked
                                    ? [...(prev.assignedTo || []), staff.id]
                                    : (prev.assignedTo || []).filter(id => id !== staff.id);
                                  const assignedToName = assignedTo.map(id => {
                                    const s = staffList.find(st => st.id === id);
                                    return s ? s.name : '';
                                  });
                                  return { ...prev, assignedTo, assignedToName };
                                });
                              }}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                              {staff.name} {staff.department && `(${staff.department})`}
                            </span>
                          </label>
                        ))
                    ) : (
                      <div className="text-slate-500 text-sm">등록된 직원이 없습니다.</div>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="edit-dueDate" className="block text-sm font-medium text-slate-700 mb-1">마감일 <span className="text-red-500">*</span></label>
                  <input 
                    type="date" 
                    name="dueDate" 
                    id="edit-dueDate" 
                    value={editingTask.dueDate ? format(parseISO(editingTask.dueDate), 'yyyy-MM-dd') : ''}
                    onChange={handleDateChange} 
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-slate-700 mb-1">중요도</label>
                  <select 
                    name="priority" 
                    id="edit-priority" 
                    value={editingTask.priority}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="low">낮음</option>
                    <option value="medium">중간</option>
                    <option value="high">높음</option>
                    <option value="urgent">긴급</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-slate-700 mb-1">상태</label>
                  <select 
                    name="status" 
                    id="edit-status" 
                    value={editingTask.status}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="pending">대기중</option>
                    <option value="in-progress">진행중</option>
                    <option value="completed">완료</option>
                    <option value="cancelled">취소됨</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button 
                type="button" 
                onClick={() => { setIsEditModalOpen(false); setEditingTask(null); }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
              >
                취소
              </button>
              <button 
                type="button" 
                onClick={handleUpdateTask}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                변경사항 저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTaskManagement;
