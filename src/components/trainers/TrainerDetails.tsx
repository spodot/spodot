import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, User, Edit, Trash, Save, Calendar, Clock, Phone, Mail, Award,
  Star, AlignLeft, DollarSign, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Trainer, UserStatus, useUser } from '../../contexts/UserContext';
import clsx from 'clsx';

interface TrainerDetailsProps {
  trainer: Trainer;
  onClose: () => void;
}

const TrainerDetails = ({ trainer, onClose }: TrainerDetailsProps) => {
  const { updateTrainer, deleteUser } = useUser();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<Trainer>(trainer);
  
  useEffect(() => {
    setFormData(trainer);
  }, [trainer]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          specialties: [...(prev.specialties || []), value]
        };
      } else {
        return {
          ...prev,
          specialties: (prev.specialties || []).filter(specialty => specialty !== value)
        };
      }
    });
  };
  
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      const currentDays = prev.schedulePreference?.availableDays || [];
      const newAvailableDays = checked
        ? [...currentDays, value]
        : currentDays.filter(day => day !== value);
      
      return {
        ...prev,
        schedulePreference: {
          ...(prev.schedulePreference || { preferredHours: { start: '09:00', end: '18:00' } }),
          availableDays: newAvailableDays
        }
      };
    });
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      schedulePreference: {
        ...(prev.schedulePreference || { availableDays: [] }),
        preferredHours: {
          ...(prev.schedulePreference?.preferredHours || { start: '09:00', end: '18:00' }),
          [name === 'startTime' ? 'start' : 'end']: value
        }
      }
    }));
  };
  
  const handleSave = () => {
    // 트레이너 정보 업데이트
    updateTrainer(trainer.id, formData);
    setIsEditing(false);
  };
  
  const handleDelete = () => {
    deleteUser(trainer.id);
    onClose();
  };
  
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
  
  // 요일 한글 변환
  const getDayLabel = (day: string) => {
    const dayMap: Record<string, string> = {
      '월': '월요일',
      '화': '화요일',
      '수': '수요일',
      '목': '목요일',
      '금': '금요일',
      '토': '토요일',
      '일': '일요일'
    };
    return dayMap[day] || day;
  };
  
  // 전문분야 목록
  const SPORTS_CATEGORIES = [
    '헬스/웨이트',
    '요가',
    '필라테스',
    '수영',
    '크로스핏',
    '테니스',
    '골프',
    '복싱',
    '축구',
    '농구',
    '기타'
  ];

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
            {isEditing ? '트레이너 정보 수정' : '트레이너 정보'}
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
                <h3 className="font-medium text-red-800">트레이너 삭제 확인</h3>
                <p className="text-sm text-red-600 mt-1">
                  정말로 '{trainer.name}' 트레이너를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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
          <div className="grid grid-cols-1 gap-6">
            {/* 기본 정보 섹션 */}
            <div className="bg-slate-50 p-4 rounded-lg">
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
                
                {/* 시급 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    시급
                  </label>
                  {isEditing ? (
                    <div className="relative">
                      <input
                        type="text"
                        name="hourlyRate"
                        value={formData.hourlyRate?.toString() || ''}
                        onChange={handleChange}
                        className="form-input w-full"
                        placeholder="시급 (숫자만 입력)"
                      />
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-slate-500">
                        원/시간
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-slate-900">
                      <DollarSign className="w-4 h-4 mr-1.5 text-slate-400" />
                      {formData.hourlyRate ? `${formData.hourlyRate.toLocaleString()}원/시간` : '미설정'}
                    </div>
                  )}
                </div>
                
                {/* 경력 */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    경력
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience || ''}
                      onChange={handleChange}
                      className="form-input w-full"
                      placeholder="예) 5년 / 3년 6개월"
                    />
                  ) : (
                    <div className="text-slate-900">
                      {formData.experience || '미설정'}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* 전문 분야 섹션 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <h3 className="font-medium text-slate-900">
                  <Star className="w-4 h-4 inline mr-1" /> 
                  전문 분야
                </h3>
                {isEditing && <span className="text-red-500 ml-1">*</span>}
              </div>
              
              {isEditing ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {SPORTS_CATEGORIES.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`specialty-${category}`}
                        value={category}
                        checked={(formData.specialties || []).includes(category)}
                        onChange={handleSpecialtyChange}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <label
                        htmlFor={`specialty-${category}`}
                        className="ml-2 block text-sm text-slate-700"
                      >
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {formData.specialties && formData.specialties.length > 0 ? (
                    formData.specialties.map(specialty => (
                      <span
                        key={specialty}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        {specialty}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">등록된 전문 분야가 없습니다</span>
                  )}
                </div>
              )}
            </div>
            
            {/* 자격증 정보 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">
                <Award className="w-4 h-4 inline mr-1" /> 
                자격증 정보
              </h3>
              
              {formData.certifications && formData.certifications.length > 0 ? (
                <div className="space-y-2">
                  {formData.certifications.map((cert, index) => (
                    <div 
                      key={index} 
                      className="p-2 bg-white rounded border border-slate-200"
                    >
                      <div className="font-medium text-slate-800">
                        {typeof cert === 'string' ? cert : cert.name}
                      </div>
                      {typeof cert !== 'string' && (
                        <div className="text-xs text-slate-500">
                          {cert.certId && <span className="mr-2">번호: {cert.certId}</span>}
                          <span>발급일: {cert.issueDate}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-500">등록된 자격증이 없습니다</div>
              )}
            </div>
            
            {/* 소개 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">
                <AlignLeft className="w-4 h-4 inline mr-1" /> 
                소개
              </h3>
              
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  className="form-textarea w-full h-24"
                  placeholder="트레이너 소개 및 이력을 작성해주세요"
                />
              ) : (
                <div className="text-slate-700 bg-white p-3 rounded">
                  {formData.bio || <span className="text-slate-500">소개 정보가 없습니다</span>}
                </div>
              )}
            </div>
            
            {/* 근무 가능 시간 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <h3 className="font-medium text-slate-900">
                  <Clock className="w-4 h-4 inline mr-1" /> 
                  근무 가능 시간
                </h3>
                {isEditing && <span className="text-red-500 ml-1">*</span>}
              </div>
              
              {isEditing ? (
                <>
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">가능 요일</h4>
                    <div className="flex flex-wrap gap-2">
                      {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                        <label key={day} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={day}
                            checked={formData.schedulePreference?.availableDays?.includes(day) || false}
                            onChange={handleDayChange}
                            className="rounded text-primary focus:ring-primary mr-1"
                          />
                          <span className="text-sm text-slate-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        선호 시작 시간
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.schedulePreference?.preferredHours?.start || '09:00'}
                        onChange={handleTimeChange}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        선호 종료 시간
                      </label>
                      <input
                        type="time"
                        name="endTime"
                        value={formData.schedulePreference?.preferredHours?.end || '18:00'}
                        onChange={handleTimeChange}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-2">
                    <h4 className="text-sm font-medium text-slate-700 mb-1">가능 요일</h4>
                    <div className="flex flex-wrap gap-1">
                      {formData.schedulePreference?.availableDays && formData.schedulePreference.availableDays.length > 0 ? (
                        formData.schedulePreference.availableDays.map(day => (
                          <span
                            key={day}
                            className="inline-block px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs"
                          >
                            {getDayLabel(day)}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-500">등록된 가능 요일이 없습니다</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-1">선호 시간</h4>
                    {formData.schedulePreference?.preferredHours ? (
                      <div className="flex items-center text-slate-900">
                        <Clock className="w-4 h-4 mr-1.5 text-slate-400" />
                        {formData.schedulePreference.preferredHours.start} ~ {formData.schedulePreference.preferredHours.end}
                      </div>
                    ) : (
                      <span className="text-slate-500">등록된 선호 시간이 없습니다</span>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {/* 계정 정보 */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-medium text-slate-900 mb-3">계정 정보</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1">
                    등록일
                  </label>
                  <div className="flex items-center text-slate-900">
                    <Calendar className="w-4 h-4 mr-1.5 text-slate-400" />
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

export default TrainerDetails; 