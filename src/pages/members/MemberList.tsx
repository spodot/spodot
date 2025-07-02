import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, PlusCircle, Edit, Trash2, Eye, FilterIcon, RefreshCw, Download, Users, Calendar, CreditCard, AlertCircle, CheckCircle2, XCircle, Clock, Mail, Phone } from 'lucide-react';
import { useMember, Member } from '../../contexts/MemberContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';

// 필터 타입 정의
interface MemberFilters {
  status: string;
  membershipType: string;
  search: string;
  expirationFilter: string;
}

// 회원 상태별 색상
const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800', 
  pending: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800'
};

// 회원 상태별 한글명
const statusLabels = {
  active: '활성',
  inactive: '비활성',
  pending: '대기중',
  expired: '만료됨'
};

// 새 회원 등록 모달
interface NewMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>) => void;
}

const NewMemberModal: React.FC<NewMemberModalProps> = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    membership_type: 'basic',
    join_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    status: 'active' as Member['status'],
    notes: '',
    emergency_contact: '',
    birth_date: '',
    address: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      membership_type: 'basic',
      join_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      status: 'active',
      notes: '',
      emergency_contact: '',
      birth_date: '',
      address: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 overflow-y-auto p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-6 max-h-[calc(100vh-4rem)] overflow-y-auto my-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">신규 회원 등록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircle size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="010-0000-0000"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({...formData, birth_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">회원권 타입</label>
              <select
                value={formData.membership_type}
                onChange={(e) => setFormData({...formData, membership_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="basic">기본 회원권</option>
                <option value="premium">프리미엄 회원권</option>
                <option value="vip">VIP 회원권</option>
                <option value="student">학생 회원권</option>
                <option value="senior">시니어 회원권</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">가입일</label>
              <input
                type="date"
                value={formData.join_date}
                onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">만료일</label>
              <input
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="주소를 입력하세요"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비상연락처</label>
            <input
              type="tel"
              value={formData.emergency_contact}
              onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="비상시 연락할 번호"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="특이사항이나 메모를 입력하세요"
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors"
            >
              등록
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default function MemberList() {
  const { members, setMembers } = useMember();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [filters, setFilters] = useState<MemberFilters>({
    status: '',
    membershipType: '',
    search: '',
    expirationFilter: ''
  });

  // 회원 통계 계산
  const memberStats = React.useMemo(() => {
    const total = members.length;
    const active = members.filter(m => m.status === 'active').length;
    const expiringSoon = members.filter(m => {
      if (!m.expiry_date) return false;
      const expiryDate = new Date(m.expiry_date);
      const today = new Date();
      const daysUntilExpiry = differenceInDays(expiryDate, today);
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }).length;
    const expired = members.filter(m => {
      if (!m.expiry_date) return false;
      return isBefore(new Date(m.expiry_date), new Date());
    }).length;

    return { total, active, expiringSoon, expired };
  }, [members]);

  // 필터링된 회원 목록
  const filteredMembers = React.useMemo(() => {
    return members.filter(member => {
      const searchMatch = !filters.search || 
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.email.toLowerCase().includes(filters.search.toLowerCase()) ||
        member.phone.includes(filters.search);
      
      const statusMatch = !filters.status || member.status === filters.status;
      const membershipMatch = !filters.membershipType || member.membership_type === filters.membershipType;
      
      let expirationMatch = true;
      if (filters.expirationFilter === 'expiring-soon' && member.expiry_date) {
        const expiryDate = new Date(member.expiry_date);
        const today = new Date();
        const daysUntilExpiry = differenceInDays(expiryDate, today);
        expirationMatch = daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
      } else if (filters.expirationFilter === 'expired' && member.expiry_date) {
        expirationMatch = isBefore(new Date(member.expiry_date), new Date());
      }

      return searchMatch && statusMatch && membershipMatch && expirationMatch;
    });
  }, [members, filters]);

  // 새 회원 추가
  const handleAddMember = async (newMemberData: Omit<Member, 'id'>) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('members')
        .insert([newMemberData])
        .select()
        .single();

      if (error) throw error;

      setMembers(prev => [...prev, data]);
      alert('회원이 성공적으로 등록되었습니다.');
    } catch (error) {
      console.error('회원 등록 실패:', error);
      alert('회원 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 회원 삭제
  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('정말로 이 회원을 삭제하시겠습니까?')) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      alert('회원이 삭제되었습니다.');
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      alert('회원 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 회원권 만료일까지 남은 일수 계산
  const getDaysUntilExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;
    return differenceInDays(new Date(expiryDate), new Date());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
          <p className="mt-2 text-gray-600">피트니스 센터 회원들을 관리합니다.</p>
        </div>
        <button
          onClick={() => setShowNewMemberModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusCircle size={20} />
          신규 회원 등록
        </button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">전체 회원</p>
              <p className="text-3xl font-bold text-gray-900">{memberStats.total}</p>
            </div>
            <Users className="w-12 h-12 text-gray-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">활성 회원</p>
              <p className="text-3xl font-bold text-green-600">{memberStats.active}</p>
            </div>
            <CheckCircle2 className="w-12 h-12 text-green-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">곧 만료</p>
              <p className="text-3xl font-bold text-yellow-600">{memberStats.expiringSoon}</p>
            </div>
            <Clock className="w-12 h-12 text-yellow-400" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">만료됨</p>
              <p className="text-3xl font-bold text-red-600">{memberStats.expired}</p>
            </div>
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색"
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">모든 상태</option>
              <option value="active">활성</option>
              <option value="inactive">비활성</option>
              <option value="pending">대기중</option>
              <option value="expired">만료됨</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">회원권 타입</label>
            <select
              value={filters.membershipType}
              onChange={(e) => setFilters({...filters, membershipType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">모든 타입</option>
              <option value="basic">기본 회원권</option>
              <option value="premium">프리미엄 회원권</option>
              <option value="vip">VIP 회원권</option>
              <option value="student">학생 회원권</option>
              <option value="senior">시니어 회원권</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">만료 상태</label>
            <select
              value={filters.expirationFilter}
              onChange={(e) => setFilters({...filters, expirationFilter: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">모든 회원</option>
              <option value="expiring-soon">곧 만료 (7일 이내)</option>
              <option value="expired">만료됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredMembers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-500 mb-2">회원이 없습니다</p>
            <p className="text-gray-400">검색 조건을 변경하거나 새 회원을 등록해보세요.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">회원정보</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">연락처</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">회원권</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">가입일</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">만료일</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">상태</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredMembers.map((member) => {
                  const daysUntilExpiry = member.expiry_date ? getDaysUntilExpiry(member.expiry_date) : null;
                  const isExpiring = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
                  const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;
                  
                  return (
                    <motion.tr
                      key={member.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member.last_name} {member.first_name}
                          </div>
                          {member.birth_date && (
                            <div className="text-sm text-gray-500">
                              {format(new Date(member.birth_date), 'yyyy.MM.dd', { locale: ko })}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-gray-900">
                            <Mail size={14} />
                            {member.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone size={14} />
                            {member.phone}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {member.membership_type}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {format(new Date(member.join_date), 'yyyy.MM.dd', { locale: ko })}
                      </td>
                      
                      <td className="px-6 py-4">
                        {member.expiry_date ? (
                          <div>
                            <div className={clsx(
                              "text-sm font-medium",
                              isExpired ? "text-red-600" : isExpiring ? "text-yellow-600" : "text-gray-900"
                            )}>
                              {format(new Date(member.expiry_date), 'yyyy.MM.dd', { locale: ko })}
                            </div>
                            {daysUntilExpiry !== null && (
                              <div className={clsx(
                                "text-xs",
                                isExpired ? "text-red-500" : isExpiring ? "text-yellow-500" : "text-gray-500"
                              )}>
                                {isExpired ? `${Math.abs(daysUntilExpiry)}일 전 만료` : 
                                 isExpiring ? `${daysUntilExpiry}일 남음` : 
                                 `${daysUntilExpiry}일 남음`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">설정되지 않음</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4">
                        <span className={clsx(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                          statusColors[member.status]
                        )}>
                          {statusLabels[member.status]}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            className="text-indigo-600 hover:text-indigo-900 transition-colors"
                            title="편집"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 신규 회원 등록 모달 */}
      <AnimatePresence>
        {showNewMemberModal && (
          <NewMemberModal
            isOpen={showNewMemberModal}
            onClose={() => setShowNewMemberModal(false)}
            onSave={handleAddMember}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 