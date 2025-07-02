import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, User, Edit, Trash, Save, Calendar, Clock, Phone, Mail, MapPin, AlertCircle, UserCheck, UserX, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Client, UserStatus, Gender, useUser } from '../../contexts/UserContext';
import InitialsAvatar from '../common/InitialsAvatar';
import clsx from 'clsx';

interface ClientDetailsProps {
  client: Client;
  onClose: () => void;
}

const ClientDetails = ({ client, onClose }: ClientDetailsProps) => {
  const { updateClient, trainers, deleteUser } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Client>(client);
  
  useEffect(() => {
    setFormData(client);
  }, [client]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = () => {
    // 트레이너 이름 가져오기
    const trainerName = trainers.find(t => t.id === formData.assignedTrainerId)?.name;
    
    // 클라이언트 업데이트
    updateClient(client.id, {
      ...formData,
      assignedTrainerName: trainerName
    });
    
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    deleteUser(client.id);
    onClose();
  };
  
  // 고객 상태에 따른 스타일
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
  
  // 고객 상태 텍스트
  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'active': return '활성';
      case 'inactive': return '비활성';
      case 'pending': return '대기중';
      case 'suspended': return '정지됨';
    }
  };
  
  // 성별 텍스트
  const getGenderText = (gender?: Gender) => {
    if (!gender) return '미지정';
    switch (gender) {
      case 'male': return '남성';
      case 'female': return '여성';
      case 'other': return '기타';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            {isEditing ? '고객 정보 수정' : '고객 정보'}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button 
                  className="p-1 text-blue-600 hover:text-blue-800:text-blue-300"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit size={18} />
                </button>
                <button 
                  className="p-1 text-red-600 hover:text-red-800:text-red-300"
                  onClick={() => setIsDeleting(true)}
                >
                  <Trash size={18} />
                </button>
              </>
            )}
            <button 
              className="p-1 text-slate-400 hover:text-slate-500:text-slate-300"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* 확인 메시지 */}
        {isDeleting && (
          <div className="p-4 border-b border-slate-200 bg-red-50">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800">고객 삭제 확인</h3>
                <p className="text-sm text-red-600 mt-1">
                  정말로 '{client.name}' 고객을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </p>
                <div className="mt-3 flex space-x-2">
                  <button
                    className="btn btn-sm btn-outline text-red-600 border-red-600 hover:bg-red-50:bg-red-900/30"
                    onClick={handleDelete}
                  >
                    삭제
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => setIsDeleting(false)}
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 상세 정보 또는 수정 폼 */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
          {/* 고객 프로필 헤더 - 새로 추가 */}
          <div className="mb-6 flex items-center">
            <div className="mr-4">
              <InitialsAvatar name={formData.name} size="lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{formData.name}</h2>
              <div className="flex items-center mt-1 text-sm text-slate-500">
                <Mail className="w-4 h-4 mr-1" />
                <span className="mr-3">{formData.email}</span>
                <Phone className="w-4 h-4 mr-1 ml-2" />
                <span>{formData.phone}</span>
              </div>
            </div>
            <span className={clsx(
              "ml-auto px-2 py-1 rounded-full text-xs font-medium",
              getStatusStyle(formData.status)
            )}>
              {getStatusText(formData.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 기본 정보 섹션 */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">기본 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 이름 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    이름
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="form-input w-full"
                      required
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.name}
                    </div>
                  )}
                </div>
                
                {/* 상태 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    상태
                  </label>
                  {isEditing ? (
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="pending">대기중</option>
                      <option value="suspended">정지됨</option>
                    </select>
                  ) : (
                    <span className={clsx(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getStatusStyle(formData.status)
                    )}>
                      {getStatusText(formData.status)}
                    </span>
                  )}
                </div>
                
                {/* 이메일 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    이메일
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input w-full"
                      required
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Mail className="w-4 h-4 mr-1.5 text-slate-400" />
                      <a href={`mailto:${formData.email}`} className="hover:underline">
                        {formData.email}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* 전화번호 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    전화번호
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="form-input w-full"
                      required
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Phone className="w-4 h-4 mr-1.5 text-slate-400" />
                      <a href={`tel:${formData.phone}`} className="hover:underline">
                        {formData.phone}
                      </a>
                    </div>
                  )}
                </div>
                
                {/* 생년월일 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    생년월일
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                      {formData.dateOfBirth ? format(new Date(formData.dateOfBirth), 'yyyy년 MM월 dd일') : '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 성별 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    성별
                  </label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={formData.gender || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="">선택 안함</option>
                      <option value="male">남성</option>
                      <option value="female">여성</option>
                      <option value="other">기타</option>
                    </select>
                  ) : (
                    <div className="text-slate-900">
                      {getGenderText(formData.gender)}
                    </div>
                  )}
                </div>
                
                {/* 주소 */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    주소
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      placeholder="주소 입력"
                    />
                  ) : (
                    <div className="flex items-start text-slate-900">
                      <MapPin className="w-4 h-4 mr-1.5 mt-0.5 text-slate-400 flex-shrink-0" />
                      <span>{formData.address || '미지정'}</span>
                    </div>
                  )}
                </div>
                
                {/* 비상 연락처 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    비상 연락처
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="emergencyContact"
                      value={formData.emergencyContact || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      placeholder="비상 연락처 입력"
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.emergencyContact || '미지정'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 트레이닝 정보 섹션 */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">트레이닝 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 담당 트레이너 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    담당 트레이너
                  </label>
                  {isEditing ? (
                    <select
                      name="assignedTrainerId"
                      value={formData.assignedTrainerId || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="">배정 안함</option>
                      {trainers.map(trainer => (
                        <option key={trainer.id} value={trainer.id}>
                          {trainer.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex items-center text-slate-900">
                      {formData.assignedTrainerName ? (
                        <>
                          <UserCheck className="w-4 h-4 mr-1.5 text-green-500" />
                          {formData.assignedTrainerName}
                        </>
                      ) : (
                        <>
                          <UserX className="w-4 h-4 mr-1.5 text-slate-400" />
                          미배정
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {/* 멤버십 유형 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    멤버십 유형
                  </label>
                  {isEditing ? (
                    <select
                      name="membershipType"
                      value={formData.membershipType || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                    >
                      <option value="">선택해 주세요</option>
                      <option value="기본 회원권">기본 회원권</option>
                      <option value="PT 패키지 10회">PT 패키지 10회</option>
                      <option value="PT 패키지 20회">PT 패키지 20회</option>
                      <option value="PT 패키지 30회">PT 패키지 30회</option>
                      <option value="1개월 무제한">1개월 무제한</option>
                      <option value="3개월 무제한">3개월 무제한</option>
                      <option value="6개월 무제한">6개월 무제한</option>
                      <option value="12개월 무제한">12개월 무제한</option>
                    </select>
                  ) : (
                    <div className="text-slate-900">
                      {formData.membershipType || '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 멤버십 시작일 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    멤버십 시작일
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="membershipStart"
                      value={formData.membershipStart || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                      {formData.membershipStart 
                        ? format(new Date(formData.membershipStart), 'yyyy년 MM월 dd일') 
                        : '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 멤버십 종료일 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    멤버십 종료일
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="membershipEnd"
                      value={formData.membershipEnd || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                    />
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
                      {formData.membershipEnd 
                        ? format(new Date(formData.membershipEnd), 'yyyy년 MM월 dd일') 
                        : '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 체중 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    체중 (kg)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      min="20"
                      max="300"
                      step="0.1"
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.weight ? `${formData.weight} kg` : '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 신장 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    신장 (cm)
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="height"
                      value={formData.height || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      min="100"
                      max="250"
                      step="0.1"
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.height ? `${formData.height} cm` : '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 목표 */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    트레이닝 목표
                  </label>
                  {isEditing ? (
                    <textarea
                      name="goals"
                      value={formData.goals || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      rows={3}
                      placeholder="고객의 트레이닝 목표를 입력하세요"
                    />
                  ) : (
                    <div className="text-slate-900 whitespace-pre-wrap">
                      {formData.goals || '미지정'}
                    </div>
                  )}
                </div>
                
                {/* 건강 특이사항 */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    건강 특이사항
                  </label>
                  {isEditing ? (
                    <textarea
                      name="healthNotes"
                      value={formData.healthNotes || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      rows={3}
                      placeholder="건강 관련 특이사항을 입력하세요 (부상, 질환 등)"
                    />
                  ) : (
                    <div className="text-slate-900 whitespace-pre-wrap">
                      {formData.healthNotes || '미지정'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 등록 정보 */}
            <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">계정 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    등록일
                  </label>
                  <div className="flex items-center text-slate-900">
                    <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                    {format(new Date(formData.createdAt), 'yyyy년 MM월 dd일')}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    최근 업데이트
                  </label>
                  <div className="flex items-center text-slate-900">
                    <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                    {format(new Date(formData.updatedAt), 'yyyy년 MM월 dd일')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 하단 버튼 */}
        <div className="p-4 border-t border-slate-200 flex justify-end space-x-2">
          {isEditing ? (
            <>
              <button 
                className="btn btn-outline"
                onClick={() => setIsEditing(false)}
              >
                취소
              </button>
              <button
                className="btn btn-primary inline-flex items-center"
                onClick={handleSave}
              >
                <Save size={16} className="mr-2" />
                저장
              </button>
            </>
          ) : (
            <button 
              className="btn btn-outline"
              onClick={onClose}
            >
              닫기
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ClientDetails; 