import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, Filter, User, Info, ChevronDown, ChevronUp, Mail, Phone, Award } from 'lucide-react';
import { useUser, Trainer, UserStatus } from '../contexts/UserContext';
import clsx from 'clsx';

// 임시 컴포넌트들 정의
const AddTrainerForm = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div 
      className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6"
      onClick={e => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold mb-4">새 트레이너 추가</h2>
      <p className="text-slate-500">곧 구현될 예정입니다.</p>
      <div className="mt-6 flex justify-end">
        <button 
          className="btn btn-primary"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  </div>
);

const TrainerDetails = ({ trainer, onClose }: { trainer: Trainer, onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div 
      className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6"
      onClick={e => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold mb-4">{trainer.name} 상세 정보</h2>
      <p className="text-slate-500">상세 정보 기능은 곧 구현될 예정입니다.</p>
      <div className="mt-6 flex justify-end">
        <button 
          className="btn btn-primary"
          onClick={onClose}
        >
          닫기
        </button>
      </div>
    </div>
  </div>
);

const Trainers = () => {
  const { staff, filterUsers, filteredUsers } = useUser();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [filterSpecialty, setFilterSpecialty] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<any>(null);
  const [showTrainerDetails, setShowTrainerDetails] = useState(false);
  
  // 피트니스 직원 중 트레이너 직책인 사람들 필터링
  const trainers = staff?.filter(member => 
    member.role === 'fitness' && 
    (member.position?.includes('트레이너') || member.position?.includes('코치'))
  ) || [];
  
  // 전체 전문 분야 목록 수집 (기본값)
  const specialties = ['헬스', '요가', '필라테스', '크로스핏', '수영', '테니스'];
  
  // 필터링 적용
  useEffect(() => {
    if (filterUsers) {
      filterUsers({
        role: 'fitness',
        status: filterStatus !== 'all' ? filterStatus : undefined,
        searchQuery
      });
    }
  }, [searchQuery, filterStatus, staff, filterUsers]);
  
  // 필터링된 트레이너만 표시 및 특정 전문 분야로 추가 필터링
  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = !searchQuery || 
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.phone.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || trainer.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  const displayedTrainers = filterSpecialty
    ? filteredTrainers.filter(trainer => 
        specialties.includes(filterSpecialty)
      )
    : filteredTrainers;
  
  // 트레이너 상태에 따른 스타일
  const getStatusStyle = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'suspended':
        return 'bg-purple-100 text-purple-800';
    }
  };
  
  // 트레이너 상태 텍스트
  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'pending': return '대기중';
      case 'suspended': return '정지됨';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">트레이너 관리</h1>
        
        <div className="flex items-center space-x-2">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="트레이너 이름, 이메일, 전화번호 검색"
              className="form-input pl-10 py-2 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-outline inline-flex items-center"
          >
            <Filter size={16} className="mr-2" />
            필터
            {showFilters ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
          </button>
          
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary inline-flex items-center"
          >
            <UserPlus size={16} className="mr-2" />
            트레이너 추가
          </button>
        </div>
      </div>
      
      {/* 필터 패널 */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg shadow-sm p-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                상태
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'all')}
                className="form-input w-full"
              >
                <option value="all">모든 상태</option>
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
                <option value="pending">대기중</option>
                <option value="suspended">정지됨</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                전문 분야
              </label>
              <select
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                className="form-input w-full"
              >
                <option value="">모든 전문 분야</option>
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* 트레이너 목록 */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  트레이너 정보
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  전문 분야
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  고객 수
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  시간당 요금
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {displayedTrainers.length > 0 ? (
                displayedTrainers.map((trainer) => (
                  <tr 
                    key={trainer.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => {
                      setSelectedTrainer(trainer);
                      setShowTrainerDetails(true);
                    }}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                          <User size={20} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-slate-900">
                            {trainer.name}
                          </div>
                          <div className="text-sm text-slate-500">
                            {trainer.email}
                          </div>
                          <div className="text-sm text-slate-500">
                            {trainer.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {trainer.position || '트레이너'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        0명
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-900">
                        50,000원
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={clsx(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getStatusStyle(trainer.status)
                      )}>
                        {getStatusText(trainer.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end space-x-2" onClick={e => e.stopPropagation()}>
                        <button 
                          className="p-1 text-blue-600 hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrainer(trainer);
                            setShowTrainerDetails(true);
                          }}
                        >
                          <Info size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                    {searchQuery || filterStatus !== 'all' || filterSpecialty
                      ? '검색 결과가 없습니다. 다른 검색어나 필터를 사용해 보세요.'
                      : '등록된 트레이너가 없습니다. 새 트레이너를 추가해 보세요.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 트레이너 추가 폼 */}
      {showAddForm && (
        <AddTrainerForm onClose={() => setShowAddForm(false)} />
      )}
      
      {/* 트레이너 상세 정보 */}
      {showTrainerDetails && selectedTrainer && (
        <TrainerDetails 
          trainer={selectedTrainer} 
          onClose={() => setShowTrainerDetails(false)} 
        />
      )}
    </motion.div>
  );
};

export default Trainers;