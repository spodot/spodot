import {
  Bell,
  Megaphone,
  UserPlus,
  Edit3,
  Trash2,
  KeyRound, // For permissions icon
} from 'lucide-react';
import { useState } from 'react';
import { useUser, Staff } from '../../contexts/UserContext'; // useUser, Staff import
import AddStaffForm from '../../components/forms/AddStaffForm'; // AddStaffForm import
import EditStaffForm from '../../components/forms/EditStaffForm'; // EditStaffForm import
import PermissionsForm from '../../components/forms/PermissionsForm'; // PermissionsForm import

const getStatusBadgeClass = (status: Staff['status']) => { // Staff['status'] 사용
  // UserContext의 UserStatus 타입 ('active', 'inactive', 'pending', 'suspended') 에 맞춰 조정 필요
  // 현재 StaffManagement UI는 '활성', '비활성'만 사용
  if (status === 'active') return 'bg-green-100 text-green-800';
  if (status === 'inactive') return 'bg-red-100 text-red-800';
  if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
  if (status === 'suspended') return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800'; // 기본값
};

const StaffManagement = () => {
  const { staff: staffList, deleteUser: deleteStaffMember } = useUser(); // UserContext에서 staff 목록과 삭제 함수 가져오기
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 ${['일', '월', '화', '수', '목', '금', '토'][today.getDay()]
  }요일`;

  const handleOpenAddModal = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  // TODO: Implement edit and delete handlers
  const handleEditStaff = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setIsEditModalOpen(true);
    console.log('Edit staff:', staffMember);
  };

  const handleDeleteStaff = (staffId: string) => {
    if (window.confirm('정말로 이 직원을 삭제하시겠습니까?')) {
      if (deleteStaffMember) {
        deleteStaffMember(staffId); // UserContext의 deleteUser (현재 deleteStaffMember로 매핑) 호출
      } else {
        console.error('deleteStaffMember function is not available from UserContext');
      }
    }
  };

  const handlePermissions = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setIsPermissionsModalOpen(true);
    console.log('Set permissions for staff:', staffMember);
  }

  if (!staffList) {
    return <div>Loading staff...</div>; // 또는 로딩 스피너
  }

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">직원 관리</h1>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">{formattedDate}</span>
        </div>
      </header>

      {/* Notice Banner */}
      <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center space-x-3 mb-6 shadow-md">
        <Megaphone size={24} className="flex-shrink-0" />
        <p className="text-sm font-medium">공지사항: 이번 주 금요일 오후 3시에 전체 회의가 있습니다. 모든 직원은 참석해주세요.</p>
      </div>

      {/* Staff List Section */}
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-3 sm:mb-0">직원 관리</h2>
          <button 
            onClick={handleOpenAddModal} // 직원 추가 모달 열기 핸들러 연결
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <UserPlus size={18} />
            <span>직원 추가</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">이름</th>
                <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">부서</th>
                <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">직책</th>
                <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">이메일</th>
                <th className="pb-3 text-left text-sm font-semibold text-slate-500 uppercase tracking-wider">상태</th>
                <th className="pb-3 text-center text-sm font-semibold text-slate-500 uppercase tracking-wider">작업</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map((staff) => (
                <tr key={staff.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-3 font-medium text-slate-800">{staff.name}</td>
                  <td className="py-3 pr-3 text-sm text-slate-700">{staff.department || '-'}</td>
                  <td className="py-3 pr-3 text-sm text-slate-700">{staff.position || '-'}</td>
                  <td className="py-3 pr-3 text-sm text-slate-700">{staff.email}</td>
                  <td className="py-3 pr-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(staff.status)}`}>
                      {staff.status === 'active' ? '활성' : 
                       staff.status === 'inactive' ? '비활성' : 
                       staff.status === 'pending' ? '보류' : 
                       staff.status === 'suspended' ? '정지' : staff.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button onClick={() => handleEditStaff(staff)} className="text-slate-500 hover:text-blue-600 transition-colors" title="수정">
                        <Edit3 size={18} />
                      </button>
                      <button onClick={() => handleDeleteStaff(staff.id)} className="text-slate-500 hover:text-red-600 transition-colors" title="삭제">
                        <Trash2 size={18} />
                      </button>
                      <button onClick={() => handlePermissions(staff)} className="text-slate-500 hover:text-purple-600 transition-colors" title="권한 설정">
                        <KeyRound size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
               {staffList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">등록된 직원이 없습니다.</td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 직원 추가 모달 */}
      {isAddModalOpen && (
        <AddStaffForm onClose={handleCloseAddModal} />
      )}

      {/* 직원 수정 모달 */}
      {isEditModalOpen && editingStaff && (
        <EditStaffForm 
          staff={editingStaff} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}

      {/* 권한 설정 모달 */}
      {isPermissionsModalOpen && editingStaff && (
        <PermissionsForm 
          staff={editingStaff} 
          onClose={() => setIsPermissionsModalOpen(false)} 
        />
      )}

    </div>
  );
};

export default StaffManagement;