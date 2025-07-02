import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useCustomer } from '../../contexts/CustomerContext';
import { useAuth } from '../../contexts/AuthContext';
import { useOT } from '../../contexts/OTContext';
import { format } from 'date-fns';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Plus, Search, Filter, FileText, Download, Shield, UserPlus } from 'lucide-react';
import type { Customer, ConsultingRecord } from '../../types/customer';

// 고객관리 탭 정의
const getCustomerTabs = (isAdmin: boolean) => [
  { label: '전화문의', path: 'phone-inquiry' },
  { label: '회원권(PT포함)상담예약', path: 'membership-reservation' },
  { label: '상담예약', path: 'consulting-reservation' },
  { label: '문의', path: 'inquiry' },
  { label: 'FC LOG', path: 'fc-log' },
  { label: '미등록자DB', path: 'unregistered' },
  { label: '전체DB', path: '' },  // 루트 경로는 빈 문자열
  ...(isAdmin ? [{ label: 'OT리스트', path: 'ot-list' }] : []),
  { label: '연락망/스케줄', path: 'contact-schedule' },
  { label: '투어만', path: 'tour-only' },
  { label: '질문', path: 'question' },
  { label: '피드백', path: 'feedback' },
  { label: '테니스상담내역서', path: 'tennis-consult' },
  { label: '테니스골프무료개방', path: 'tennis-golf-free' },
  { label: '헬스무료개방', path: 'fitness-free' },
  { label: '방문객', path: 'visitor' },
  { label: '테니스레슨회원(무인증정현황)', path: 'tennis-lesson-unverified' },
];

// 새 고객 등록 모달 컴포넌트
interface NewCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (customer: Omit<Customer, 'id' | 'registeredAt'>) => void;
}

const NewCustomerModal: React.FC<NewCustomerModalProps> = ({ isOpen, onClose, onSave }) => {
  const { isAdmin } = useAuth();
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    birthDate: '',
    gender: undefined as 'male' | 'female' | 'other' | undefined,
    address: '',
    membershipType: 'fitness' as const,
    membershipStart: '',
    membershipEnd: '',
    ptCount: 0,
    otCount: 0,
    lessonCount: 0,
    status: 'active' as const,
    consultant: '',
    notes: '',
    marketingConsent: false,
    registerSource: 'offline' as const
  });

  if (!isOpen) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement; // type assertion for checkbox
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setNewCustomer(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setNewCustomer(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setNewCustomer(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(newCustomer);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">신규 고객 등록</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">기본 정보</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCustomer.name}
                  onChange={handleChange}
                  className="mt-1 form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  연락처 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={newCustomer.phone}
                  onChange={handleChange}
                  placeholder="010-0000-0000"
                  className="mt-1 form-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <input
                  type="email"
                  name="email"
                  value={newCustomer.email}
                  onChange={handleChange}
                  className="mt-1 form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  생년월일
                </label>
                <input
                  type="date"
                  name="birthDate"
                  value={newCustomer.birthDate}
                  onChange={handleChange}
                  className="mt-1 form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  성별
                </label>
                <select
                  name="gender"
                  value={newCustomer.gender}
                  onChange={handleChange}
                  className="mt-1 form-select w-full"
                >
                  <option value="">선택</option>
                  <option value="male">남성</option>
                  <option value="female">여성</option>
                  <option value="other">기타</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  주소
                </label>
                <input
                  type="text"
                  name="address"
                  value={newCustomer.address}
                  onChange={handleChange}
                  className="mt-1 form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  유입 경로
                </label>
                <select
                  name="registerSource"
                  value={newCustomer.registerSource}
                  onChange={handleChange}
                  className="mt-1 form-select w-full"
                >
                  <option value="offline">방문</option>
                  <option value="online">온라인</option>
                  <option value="referral">지인 소개</option>
                  <option value="phone">전화문의</option>
                  <option value="membership">회원권상담예약</option>
                  <option value="consulting">상담예약</option>
                  <option value="inquiry">기타문의</option>
                  <option value="visit">방문고객</option>
                  <option value="other">기타</option>
                </select>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="marketingConsent"
                  name="marketingConsent"
                  checked={newCustomer.marketingConsent}
                  onChange={handleChange}
                  className="form-checkbox h-4 w-4 text-primary"
                />
                <label htmlFor="marketingConsent" className="ml-2 text-sm text-gray-700">
                  마케팅 정보 수신 동의
                </label>
              </div>
            </div>
            
            {/* 회원권 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">회원권 정보</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  회원권 유형 <span className="text-red-500">*</span>
                </label>
                <select
                  name="membershipType"
                  value={newCustomer.membershipType}
                  onChange={handleChange}
                  className="mt-1 form-select w-full"
                  required
                >
                  <option value="fitness">헬스</option>
                  <option value="golf">골프</option>
                  <option value="tennis">테니스</option>
                  <option value="combo">복합</option>
                  <option value="other">기타</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  회원 상태 <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  value={newCustomer.status}
                  onChange={handleChange}
                  className="mt-1 form-select w-full"
                  required
                >
                  <option value="active">활성</option>
                  <option value="expired">만료</option>
                  <option value="paused">휴면</option>
                  <option value="withdrawn">탈퇴</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  시작일
                </label>
                <input
                  type="date"
                  name="membershipStart"
                  value={newCustomer.membershipStart}
                  onChange={handleChange}
                  className="mt-1 form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  종료일
                </label>
                <input
                  type="date"
                  name="membershipEnd"
                  value={newCustomer.membershipEnd}
                  onChange={handleChange}
                  className="mt-1 form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  PT 횟수
                </label>
                <input
                  type="number"
                  name="ptCount"
                  value={newCustomer.ptCount}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  OT 횟수 {!isAdmin && <span className="text-amber-600 text-xs">(관리자 전용)</span>}
                </label>
                <input
                  type="number"
                  name="otCount"
                  value={newCustomer.otCount}
                  onChange={handleChange}
                  min="0"
                  className={`mt-1 form-input w-full ${!isAdmin ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                  disabled={!isAdmin}
                />
                {!isAdmin && (
                  <div className="mt-1 flex items-center text-amber-600 text-xs">
                    <Shield size={12} className="mr-1" />
                    OT 횟수는 관리자만 설정할 수 있습니다.
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  레슨 횟수
                </label>
                <input
                  type="number"
                  name="lessonCount"
                  value={newCustomer.lessonCount}
                  onChange={handleChange}
                  min="0"
                  className="mt-1 form-input w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  담당자
                </label>
                <input
                  type="text"
                  name="consultant"
                  value={newCustomer.consultant}
                  onChange={handleChange}
                  className="mt-1 form-input w-full"
                />
              </div>
            </div>
          </div>
          
          {/* 공통 영역 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">
              특이사항
            </label>
            <textarea
              name="notes"
              value={newCustomer.notes}
              onChange={handleChange}
              rows={4}
              className="mt-1 form-textarea w-full"
              placeholder="고객의 특이사항, 요청사항, 운동 목표 등을 입력하세요."
            ></textarea>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="mr-4 px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// 고객 상세 정보 모달 컴포넌트
interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
}

const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({ customer, isOpen, onClose }) => {
  const { isAdmin } = useAuth();
  const { addConsultingHistory, updateCustomer } = useCustomer();
  const [newRecord, setNewRecord] = useState<ConsultingRecord>({ 
    date: new Date().toISOString().split('T')[0], 
    content: '', 
    consultant: '' 
  });
  const [activeTab, setActiveTab] = useState('info');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer>>({});

  if (!isOpen || !customer) return null;

  const handleAddRecord = () => {
    if (!newRecord.content || !newRecord.consultant) return;
    addConsultingHistory(customer.id, newRecord);
    setNewRecord({ date: new Date().toISOString().split('T')[0], content: '', consultant: '' });
  };

  const handleEdit = () => {
    setEditData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      birthDate: customer.birthDate || '',
      gender: customer.gender,
      address: customer.address || '',
      membershipType: customer.membershipType,
      membershipStart: customer.membershipStart || '',
      membershipEnd: customer.membershipEnd || '',
      ptCount: customer.ptCount || 0,
      otCount: customer.otCount || 0,
      lessonCount: customer.lessonCount || 0,
      status: customer.status,
      consultant: customer.consultant || '',
      notes: customer.notes || '',
    });
    setEditMode(true);
  };

  const handleSave = () => {
    updateCustomer(customer.id, editData);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'number') {
      setEditData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setEditData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-8">
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold text-gray-800">
              {customer.name}
              <span className={`ml-3 inline-block px-2 py-1 text-xs rounded-full ${
                customer.status === 'active' ? 'bg-green-100 text-green-800' :
                customer.status === 'expired' ? 'bg-red-100 text-red-800' :
                customer.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {customer.status === 'active' ? '활성' :
                 customer.status === 'expired' ? '만료' :
                 customer.status === 'paused' ? '휴면' : '탈퇴'}
              </span>
            </h2>
          </div>
          <div className="flex space-x-2">
            {!editMode && (
              <button 
                onClick={handleEdit}
                className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
              >
                수정
              </button>
            )}
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <div className="flex border-b mb-4">
            <button 
              onClick={() => setActiveTab('info')} 
              className={`px-4 py-2 ${activeTab === 'info' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              기본 정보
            </button>
            <button 
              onClick={() => setActiveTab('membership')} 
              className={`px-4 py-2 ${activeTab === 'membership' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              회원권 정보
            </button>
            <button 
              onClick={() => setActiveTab('history')} 
              className={`px-4 py-2 ${activeTab === 'history' ? 'border-b-2 border-primary text-primary font-medium' : 'text-gray-500 hover:text-gray-700'}`}
            >
              상담 내역
            </button>
          </div>
          
          {activeTab === 'info' && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                    <input
                      type="text"
                      name="name"
                      value={editData.name}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연락처</label>
                    <input
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                    <input
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                    <input
                      type="date"
                      name="birthDate"
                      value={editData.birthDate}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                    <select
                      name="gender"
                      value={editData.gender}
                      onChange={handleChange}
                      className="form-select w-full"
                    >
                      <option value="">선택</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                    <input
                      type="text"
                      name="consultant"
                      value={editData.consultant}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <input
                      type="text"
                      name="address"
                      value={editData.address}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">메모</label>
                    <textarea
                      name="notes"
                      value={editData.notes}
                      onChange={handleChange}
                      rows={3}
                      className="form-textarea w-full"
                    ></textarea>
                  </div>
                  <div className="sm:col-span-2 flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">개인 정보</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">이름</span>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">연락처</span>
                          <span className="font-medium">{customer.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">이메일</span>
                          <span className="font-medium">{customer.email || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">생년월일</span>
                          <span className="font-medium">{customer.birthDate || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">성별</span>
                          <span className="font-medium">
                            {customer.gender === 'male' ? '남성' : 
                            customer.gender === 'female' ? '여성' : 
                            customer.gender === 'other' ? '기타' : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">등록 정보</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">등록일</span>
                          <span className="font-medium">{format(new Date(customer.registeredAt), 'yyyy-MM-dd')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">담당자</span>
                          <span className="font-medium">{customer.consultant || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">유입 경로</span>
                          <span className="font-medium">
                            {customer.registerSource === 'offline' ? '방문' :
                             customer.registerSource === 'online' ? '온라인' :
                             customer.registerSource === 'referral' ? '지인 소개' :
                             customer.registerSource === 'phone' ? '전화문의' :
                             customer.registerSource === 'membership' ? '회원권상담예약' :
                             customer.registerSource === 'consulting' ? '상담예약' :
                             customer.registerSource === 'inquiry' ? '기타문의' :
                             customer.registerSource === 'visit' ? '방문고객' : '기타'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">주소</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-gray-800">{customer.address || '등록된 주소가 없습니다.'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">메모</h3>
                      <div className="bg-gray-50 p-4 rounded-lg min-h-[120px]">
                        <p className="text-gray-800 whitespace-pre-line">{customer.notes || '등록된 메모가 없습니다.'}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">기타</h3>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">마케팅 수신 동의</span>
                          <span className="font-medium">{customer.marketingConsent ? '동의' : '미동의'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">마지막 방문일</span>
                          <span className="font-medium">{customer.lastVisitDate || '-'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'membership' && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">회원권 유형</label>
                    <select
                      name="membershipType"
                      value={editData.membershipType}
                      onChange={handleChange}
                      className="form-select w-full"
                    >
                      <option value="fitness">헬스</option>
                      <option value="golf">골프</option>
                      <option value="tennis">테니스</option>
                      <option value="combo">복합</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">회원 상태</label>
                    <select
                      name="status"
                      value={editData.status}
                      onChange={handleChange}
                      className="form-select w-full"
                    >
                      <option value="active">활성</option>
                      <option value="expired">만료</option>
                      <option value="paused">휴면</option>
                      <option value="withdrawn">탈퇴</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                    <input
                      type="date"
                      name="membershipStart"
                      value={editData.membershipStart}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                    <input
                      type="date"
                      name="membershipEnd"
                      value={editData.membershipEnd}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">PT 횟수</label>
                    <input
                      type="number"
                      name="ptCount"
                      value={editData.ptCount}
                      onChange={handleChange}
                      min="0"
                      className="form-input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      OT 횟수 {!isAdmin && <span className="text-amber-600 text-xs">(관리자 전용)</span>}
                    </label>
                    <input
                      type="number"
                      name="otCount"
                      value={editData.otCount}
                      onChange={handleChange}
                      min="0"
                      className={`form-input w-full ${!isAdmin ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                      disabled={!isAdmin}
                    />
                    {!isAdmin && (
                      <div className="mt-1 flex items-center text-amber-600 text-xs">
                        <Shield size={12} className="mr-1" />
                        OT 횟수는 관리자만 수정할 수 있습니다.
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">레슨 횟수</label>
                    <input
                      type="number"
                      name="lessonCount"
                      value={editData.lessonCount}
                      onChange={handleChange}
                      min="0"
                      className="form-input w-full"
                    />
                  </div>
                  <div className="sm:col-span-2 flex justify-end space-x-3 mt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">회원권 정보</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">회원권 유형</span>
                        <span className="font-medium">
                          {customer.membershipType === 'fitness' ? '헬스' : 
                           customer.membershipType === 'golf' ? '골프' : 
                           customer.membershipType === 'tennis' ? '테니스' : 
                           customer.membershipType === 'combo' ? '복합' : '기타'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">상태</span>
                        <span className={`font-medium ${
                          customer.status === 'active' ? 'text-green-600' :
                          customer.status === 'expired' ? 'text-red-500' :
                          customer.status === 'paused' ? 'text-yellow-500' : 'text-gray-500'
                        }`}>
                          {customer.status === 'active' ? '활성' :
                           customer.status === 'expired' ? '만료' :
                           customer.status === 'paused' ? '휴면' : '탈퇴'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">시작일</span>
                        <span className="font-medium">{customer.membershipStart || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">종료일</span>
                        <span className="font-medium">{customer.membershipEnd || '-'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">이용 현황</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-1">PT 잔여</p>
                        <p className="text-2xl font-bold text-primary">{customer.ptCount || 0}</p>
                        <p className="text-xs text-gray-500">회</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-1">OT 잔여</p>
                        <p className="text-2xl font-bold text-primary">{customer.otCount || 0}</p>
                        <p className="text-xs text-gray-500">회</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg text-center">
                        <p className="text-sm text-gray-500 mb-1">레슨 잔여</p>
                        <p className="text-2xl font-bold text-primary">{customer.lessonCount || 0}</p>
                        <p className="text-xs text-gray-500">회</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sm:col-span-2">
                    <h3 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">회원권 기간</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {customer.membershipStart && customer.membershipEnd ? (
                        <div className="relative pt-2">
                          <div className="h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-2 bg-primary rounded-full"
                              style={{
                                width: `${Math.max(0, Math.min(100, (() => {
                                  const startDate = new Date(customer.membershipStart!);
                                  const endDate = new Date(customer.membershipEnd!);
                                  const today = new Date();
                                  const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                                  const daysElapsed = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                                  return (daysElapsed / totalDays) * 100;
                                })()))}%`
                              }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-2">
                            <span>{customer.membershipStart}</span>
                            <span>{customer.membershipEnd}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 text-center py-2">등록된 회원권 기간이 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">상담 내역 추가</h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                    <input
                      type="date"
                      value={newRecord.date}
                      onChange={(e) => setNewRecord({...newRecord, date: e.target.value})}
                      className="form-input w-full"
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <input
                      type="text"
                      placeholder="상담 내용을 입력하세요"
                      value={newRecord.content}
                      onChange={(e) => setNewRecord({...newRecord, content: e.target.value})}
                      className="form-input w-full"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <div className="flex flex-col h-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
                      <div className="flex gap-2 flex-grow">
                        <input
                          type="text"
                          placeholder="담당자명"
                          value={newRecord.consultant}
                          onChange={(e) => setNewRecord({...newRecord, consultant: e.target.value})}
                          className="form-input w-full flex-grow"
                        />
                        <button 
                          onClick={handleAddRecord}
                          disabled={!newRecord.content || !newRecord.consultant}
                          className={`px-4 py-2 rounded-md ${
                            !newRecord.content || !newRecord.consultant 
                            ? 'bg-gray-200 text-gray-500' 
                            : 'bg-primary text-white hover:bg-primary-dark'
                          } transition-colors`}
                        >
                          추가
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="overflow-hidden rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">날짜</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-3/5">내용</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">담당자</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customer.consultingHistory && customer.consultingHistory.length > 0 ? (
                      [...customer.consultingHistory]
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((record: ConsultingRecord, index: number) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{record.date}</td>
                            <td className="px-4 py-3 text-sm">{record.content}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{record.consultant}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-5 text-center text-gray-500">
                          <div className="py-8">
                            <p className="text-gray-500 text-sm mb-2">등록된 상담 내역이 없습니다</p>
                            <p className="text-xs text-gray-400">상단의 양식을 통해 상담 내역을 추가하세요</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CustomerList: React.FC = () => {
  const { isAdmin } = useAuth();
  const { otMembers, addOTMember } = useOT();
  const { filtered, searchCustomers, addCustomer, customers } = useCustomer();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { tab } = useParams<{ tab?: string }>();
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    membershipType: 'all',
    dateRange: 'all',
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Customer | '';
    direction: 'ascending' | 'descending';
  }>({
    key: '',
    direction: 'ascending'
  });

  // 현재 탭에 따른 필터링 로직
  useEffect(() => {
    let result = [...filtered];

    // 탭에 따른 필터링
    if (tab) {
      switch (tab) {
        case 'phone-inquiry':
          result = result.filter(c => c.registerSource === 'phone');
          break;
        case 'membership-reservation':
          result = result.filter(c => c.registerSource === 'membership' || c.notes?.includes('PT'));
          break;
        case 'consulting-reservation':
          result = result.filter(c => c.registerSource === 'consulting');
          break;
        case 'inquiry':
          result = result.filter(c => c.registerSource === 'inquiry');
          break;
        case 'fc-log':
          result = result.filter(c => c.notes?.includes('FC') || c.consultant?.includes('FC'));
          break;
        case 'unregistered':
          result = result.filter(c => c.status === 'withdrawn' || !c.membershipStart);
          break;
        case 'ot-list':
          // OTContext의 데이터를 사용하여 OT 회원 목록 표시
          const otMemberIds = otMembers.map(m => m.id);
          result = result.filter(c => c.otCount && c.otCount > 0);
          break;
        case 'contact-schedule':
          result = result.filter(c => c.notes?.includes('연락') || c.notes?.includes('스케줄'));
          break;
        case 'tour-only':
          result = result.filter(c => c.notes?.includes('투어') && !c.membershipStart);
          break;
        case 'question':
          result = result.filter(c => c.notes?.includes('질문'));
          break;
        case 'feedback':
          result = result.filter(c => c.notes?.includes('피드백'));
          break;
        case 'tennis-consult':
          result = result.filter(c => c.membershipType === 'tennis' && c.registerSource === 'consulting');
          break;
        case 'tennis-golf-free':
          result = result.filter(c => 
            (c.membershipType === 'tennis' || c.membershipType === 'golf') && 
            c.notes?.includes('무료')
          );
          break;
        case 'fitness-free':
          result = result.filter(c => c.membershipType === 'fitness' && c.notes?.includes('무료'));
          break;
        case 'visitor':
          result = result.filter(c => c.registerSource === 'visit');
          break;
        case 'tennis-lesson-unverified':
          result = result.filter(c => 
            c.membershipType === 'tennis' && 
            c.lessonCount && c.lessonCount > 0 && 
            c.notes?.includes('무인증')
          );
          break;
      }
    }

    // 추가 필터 적용
    if (filters.status !== 'all') {
      result = result.filter(c => c.status === filters.status);
    }

    if (filters.membershipType !== 'all') {
      result = result.filter(c => c.membershipType === filters.membershipType);
    }

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      switch (filters.dateRange) {
        case 'today':
          result = result.filter(c => {
            const date = new Date(c.registeredAt);
            return date.toDateString() === now.toDateString();
          });
          break;
        case 'week':
          result = result.filter(c => {
            const date = new Date(c.registeredAt);
            return date >= lastWeek;
          });
          break;
        case 'month':
          result = result.filter(c => {
            const date = new Date(c.registeredAt);
            return date >= lastMonth;
          });
          break;
      }
    }

    // 정렬 적용
    if (sortConfig.key !== '') {
      const key = sortConfig.key as keyof Customer;
      result.sort((a, b) => {
        if (a[key] === null || a[key] === undefined) return 1;
        if (b[key] === null || b[key] === undefined) return -1;
        
        if (typeof a[key] === 'string' && typeof b[key] === 'string') {
          return sortConfig.direction === 'ascending'
            ? (a[key] as string).localeCompare(b[key] as string)
            : (b[key] as string).localeCompare(a[key] as string);
        }
        
        if (a[key] < b[key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredCustomers(result);
  }, [tab, filtered, filters, sortConfig]);

  // URL에서 탭 파라미터 확인
  useEffect(() => {
    // 탭 변경 시 검색어 초기화
    setSearch('');
    searchCustomers('');
  }, [tab, searchCustomers]);

  const handleSaveNewCustomer = (customerData: Omit<Customer, 'id' | 'registeredAt'>) => {
    addCustomer(customerData);
    
    // OT 횟수가 있는 경우 OTContext에도 추가
    if (customerData.otCount && customerData.otCount > 0) {
      addOTMember({
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || '',
        otCount: customerData.otCount,
        totalSessions: customerData.otCount,
        status: 'pending',
        notes: customerData.notes || ''
      });
    }
    
    setIsNewModalOpen(false);
  };

  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  // 정렬 처리 함수
  const requestSort = (key: keyof Customer) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // 헤더 정렬 상태에 따른 아이콘 표시
  const getSortIcon = (key: keyof Customer) => {
    if (sortConfig.key !== key) {
      return (
        <span className="text-gray-300 ml-1 inline-block">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <polyline points="19 12 12 19 5 12"></polyline>
          </svg>
        </span>
      );
    }
    
    return sortConfig.direction === 'ascending' ? (
      <span className="text-primary ml-1 inline-block">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </span>
    ) : (
      <span className="text-primary ml-1 inline-block">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </span>
    );
  };

  // 현재 탭에 따른 경로 구성
  const getCurrentTabPath = (tabPath: string) => {
    return `/customer${tabPath ? `/${tabPath}` : ''}`;
  };

  // 현재 탭 정보 가져오기
  const customerTabs = getCustomerTabs(isAdmin);
  const currentTab = tab 
    ? customerTabs.find(t => t.path === tab) 
    : customerTabs.find(t => t.path === '');

  // 필터 변경 핸들러
  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // 필터 토글 핸들러
  const toggleFilter = () => {
    setFilterOpen(prev => !prev);
  };

  // 엑셀 다운로드 기능
  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) return;
    
    // CSV 헤더 정의
    const headers = [
      '이름', 
      '연락처', 
      '이메일', 
      '회원권 유형', 
      '상태', 
      '담당자', 
      '등록일', 
      '회원권 시작일', 
      '회원권 종료일', 
      'PT 잔여', 
      'OT 잔여', 
      '레슨 잔여', 
      '마지막 방문일', 
      '유입 경로', 
      '메모'
    ];
    
    // 데이터 행 생성
    const rows = filteredCustomers.map(customer => [
      customer.name,
      customer.phone,
      customer.email || '',
      customer.membershipType === 'fitness' ? '헬스' :
      customer.membershipType === 'golf' ? '골프' :
      customer.membershipType === 'tennis' ? '테니스' :
      customer.membershipType === 'combo' ? '복합' : '기타',
      customer.status === 'active' ? '활성' :
      customer.status === 'expired' ? '만료' :
      customer.status === 'paused' ? '휴면' : '탈퇴',
      customer.consultant || '',
      format(new Date(customer.registeredAt), 'yyyy-MM-dd'),
      customer.membershipStart || '',
      customer.membershipEnd || '',
      customer.ptCount || '0',
      customer.otCount || '0',
      customer.lessonCount || '0',
      customer.lastVisitDate || '',
      customer.registerSource || '',
      (customer.notes || '').replace(/,/g, ' ') // 쉼표 제거하여 CSV 포맷 유지
    ]);
    
    // CSV 생성
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // 다운로드 링크 생성 및 클릭
    const blob = new Blob(['\uFEFF'+csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // 현재 탭 이름을 파일명으로 사용
    const tabName = currentTab?.label || '고객목록';
    const date = format(new Date(), 'yyyyMMdd');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${tabName}_${date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* 고객 관리 상단 탭 네비게이션 */}
      <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2">
        {customerTabs.map(tab => (
          <button
            key={tab.path}
            onClick={() => navigate(getCurrentTabPath(tab.path))}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap
              ${location.pathname === getCurrentTabPath(tab.path)
                ? 'bg-primary text-white shadow'
                : 'bg-white text-slate-700 hover:bg-primary/10'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 헤더 영역: 제목, 필터, 검색, 신규등록 버튼 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-slate-800">
            {currentTab ? currentTab.label : '고객 관리'}
          </h1>
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel} 
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              disabled={filteredCustomers.length === 0}
              title={filteredCustomers.length === 0 ? "내보낼 데이터가 없습니다" : "Excel 형식으로 내보내기"}
            >
              <Download size={18} />
              <span>내보내기</span>
            </button>
            {tab === 'ot-list' && isAdmin ? (
              <button 
                onClick={() => {
                  // OT 배정 페이지로 이동하면서 OT 회원 추가 모달 열기
                  navigate('/dashboard/ot-assignment');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={18} />
                <span>OT 회원 추가</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsNewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                <Plus size={18} />
                <span>신규 등록</span>
              </button>
            )}
          </div>
        </div>

        {/* 검색 및 필터 영역 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="이름, 연락처, 이메일 검색"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                searchCustomers(e.target.value);
              }}
              className="pl-10 form-input w-full"
            />
          </div>
          <button 
            onClick={toggleFilter}
            className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg ${filterOpen ? 'bg-primary/10 text-primary' : 'text-gray-700 hover:bg-gray-50'} transition-colors`}
          >
            <Filter size={18} />
            <span>필터</span>
          </button>
        </div>

        {/* 확장 가능한 필터 패널 */}
        {filterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
                <select 
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="form-select w-full"
                >
                  <option value="all">모든 상태</option>
                  <option value="active">활성</option>
                  <option value="expired">만료</option>
                  <option value="paused">휴면</option>
                  <option value="withdrawn">탈퇴</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">회원권 유형</label>
                <select 
                  value={filters.membershipType}
                  onChange={(e) => handleFilterChange('membershipType', e.target.value)}
                  className="form-select w-full"
                >
                  <option value="all">모든 유형</option>
                  <option value="fitness">헬스</option>
                  <option value="golf">골프</option>
                  <option value="tennis">테니스</option>
                  <option value="combo">복합</option>
                  <option value="other">기타</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">등록일</label>
                <select 
                  value={filters.dateRange}
                  onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                  className="form-select w-full"
                >
                  <option value="all">전체 기간</option>
                  <option value="today">오늘</option>
                  <option value="week">최근 7일</option>
                  <option value="month">최근 30일</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 고객 목록 테이블 */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th 
                  className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('name')}
                >
                  <div className="flex items-center">
                    이름
                    {getSortIcon('name')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('phone')}
                >
                  <div className="flex items-center">
                    연락처
                    {getSortIcon('phone')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('membershipType')}
                >
                  <div className="flex items-center">
                    회원권
                    {getSortIcon('membershipType')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('status')}
                >
                  <div className="flex items-center">
                    상태
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('consultant')}
                >
                  <div className="flex items-center">
                    담당자
                    {getSortIcon('consultant')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  onClick={() => requestSort('registeredAt')}
                >
                  <div className="flex items-center">
                    등록일
                    {getSortIcon('registeredAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-center font-medium text-gray-500">상세</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tab === 'ot-list' ? (
                // OT 리스트 탭에서는 OTContext의 데이터 표시
                otMembers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-gray-400">OT 회원이 없습니다.</td></tr>
                ) : (
                  otMembers.map(otMember => (
                    <tr key={`ot-${otMember.id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{otMember.name}</td>
                      <td className="px-6 py-4">{otMember.phone}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                          OT ({otMember.otCount}회)
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          otMember.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          otMember.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                          otMember.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {otMember.status === 'pending' ? '대기중' :
                           otMember.status === 'assigned' ? '배정됨' :
                           otMember.status === 'completed' ? '완료' : '알 수 없음'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {otMember.assignedStaffId ? 
                          `담당자 ${otMember.assignedStaffId}` : '-'}
                      </td>
                      <td className="px-6 py-4">{format(new Date(otMember.registeredAt), 'yyyy-MM-dd')}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => navigate('/dashboard/ot-assignment')}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <FileText size={16} />
                          <span>관리</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )
              ) : (
                // 일반 고객 목록
                filteredCustomers.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-8 text-gray-400">고객이 없습니다.</td></tr>
                ) : (
                  filteredCustomers.map(customer => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{customer.name}</td>
                      <td className="px-6 py-4">{customer.phone}</td>
                      <td className="px-6 py-4">
                        {customer.membershipType === 'fitness' ? '헬스' : 
                         customer.membershipType === 'golf' ? '골프' : 
                         customer.membershipType === 'tennis' ? '테니스' : 
                         customer.membershipType === 'combo' ? '복합' : '기타'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'active' ? 'bg-green-100 text-green-800' :
                          customer.status === 'expired' ? 'bg-red-100 text-red-800' :
                          customer.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {customer.status === 'active' ? '활성' :
                           customer.status === 'expired' ? '만료' :
                           customer.status === 'paused' ? '휴면' : '탈퇴'}
                        </span>
                      </td>
                      <td className="px-6 py-4">{customer.consultant || '-'}</td>
                      <td className="px-6 py-4">{format(new Date(customer.registeredAt), 'yyyy-MM-dd')}</td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleOpenDetail(customer)}
                          className="inline-flex items-center gap-1 text-primary hover:text-primary-dark transition-colors"
                        >
                          <FileText size={16} />
                          <span>상세</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달 컴포넌트 */}
      <NewCustomerModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleSaveNewCustomer}
      />

      <CustomerDetailModal
        customer={selectedCustomer}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />
    </div>
  );
};

export default CustomerList; 