import { useState } from 'react';
import { X, Save, User, Star, Award, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useUser, UserStatus, Trainer } from '../../contexts/UserContext';
import clsx from 'clsx';

export interface AddTrainerFormProps {
  onClose: () => void;
}

// 스포츠/전문 분야 목록
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

// 자격증 종류
const CERTIFICATION_TYPES = [
  '생활스포츠지도사',
  '전문스포츠지도사',
  '건강운동관리사',
  '요가지도자',
  '필라테스지도자',
  '수영지도자',
  '테니스지도자',
  '골프지도자',
  '퍼스널트레이너',
  '기타'
];

const AddTrainerForm = ({ onClose }: AddTrainerFormProps) => {
  const { addTrainer } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as UserStatus,
    specialties: [] as string[],
    certifications: [] as { name: string, issueDate: string, certId: string }[],
    experience: '',
    bio: '',
    schedulePreference: {
      availableDays: [] as string[],
      preferredHours: { start: '09:00', end: '18:00' }
    },
    hourlyRate: ''
  });
  
  const [newCertification, setNewCertification] = useState({
    name: '',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    certId: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 에러 메시지 초기화
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };
  
  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          specialties: [...prev.specialties, value]
        };
      } else {
        return {
          ...prev,
          specialties: prev.specialties.filter(specialty => specialty !== value)
        };
      }
    });
  };
  
  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    
    setFormData(prev => {
      const newAvailableDays = checked
        ? [...prev.schedulePreference.availableDays, value]
        : prev.schedulePreference.availableDays.filter(day => day !== value);
      
      return {
        ...prev,
        schedulePreference: {
          ...prev.schedulePreference,
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
        ...prev.schedulePreference,
        preferredHours: {
          ...prev.schedulePreference.preferredHours,
          [name === 'startTime' ? 'start' : 'end']: value
        }
      }
    }));
  };
  
  const handleCertificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewCertification({ ...newCertification, [name]: value });
  };
  
  const addCertification = () => {
    if (!newCertification.name) {
      setErrors({ ...errors, certName: '자격증 이름을 입력해 주세요' });
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, { ...newCertification }]
    }));
    
    // 입력 폼 초기화
    setNewCertification({
      name: '',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      certId: ''
    });
    
    // 에러 메시지 제거
    if (errors.certName) {
      const { certName, ...restErrors } = errors;
      setErrors(restErrors);
    }
  };
  
  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    // 필수 필드 검증
    if (!formData.name) newErrors.name = '이름을 입력해 주세요';
    if (!formData.email) {
      newErrors.email = '이메일을 입력해 주세요';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '유효한 이메일 주소를 입력해 주세요';
    }
    
    if (!formData.phone) {
      newErrors.phone = '전화번호를 입력해 주세요';
    } else if (!/^\d{3}-\d{3,4}-\d{4}$/.test(formData.phone) && !/^\d{10,11}$/.test(formData.phone)) {
      newErrors.phone = '유효한 전화번호 형식을 입력해 주세요 (예: 010-1234-5678 또는 01012345678)';
    }
    
    if (formData.specialties.length === 0) {
      newErrors.specialties = '최소 하나 이상의 전문 분야를 선택해 주세요';
    }
    
    if (formData.schedulePreference.availableDays.length === 0) {
      newErrors.availableDays = '최소 하나 이상의 가능한 요일을 선택해 주세요';
    }
    
    // 시급 검증 (숫자만 허용)
    if (formData.hourlyRate && !/^\d+$/.test(formData.hourlyRate)) {
      newErrors.hourlyRate = '시급은 숫자만 입력해 주세요';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 트레이너 데이터 준비
      const trainerData: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        role: 'trainer',
        specialties: formData.specialties,
        certifications: formData.certifications,
        experience: formData.experience,
        bio: formData.bio,
        schedulePreference: formData.schedulePreference,
        hourlyRate: formData.hourlyRate ? Number(formData.hourlyRate) : undefined
      };
      
      // 트레이너 추가
      addTrainer(trainerData);
      
      // 폼 닫기
      onClose();
    } catch (error) {
      console.error('트레이너 추가 중 오류 발생:', error);
    } finally {
      setIsSubmitting(false);
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
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            새 트레이너 추가
          </h2>
          <button 
            className="text-slate-400 hover:text-slate-500:text-slate-300"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* 기본 정보 섹션 */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">기본 정보</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 이름 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      이름
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={clsx(
                        'form-input w-full',
                        errors.name ? 'border-red-500' : ''
                      )}
                      placeholder="트레이너 이름"
                      required
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  
                  {/* 상태 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      상태
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="form-input w-full"
                      required
                    >
                      <option value="active">활성</option>
                      <option value="inactive">비활성</option>
                      <option value="pending">대기중</option>
                    </select>
                  </div>
                  
                  {/* 이메일 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      이메일
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={clsx(
                        'form-input w-full',
                        errors.email ? 'border-red-500' : ''
                      )}
                      placeholder="example@mail.com"
                      required
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                  
                  {/* 전화번호 */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      전화번호
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={clsx(
                        'form-input w-full',
                        errors.phone ? 'border-red-500' : ''
                      )}
                      placeholder="010-1234-5678"
                      required
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 전문 분야 선택 */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <h3 className="font-medium text-slate-900">
                    <Star className="w-4 h-4 inline mr-1" /> 
                    전문 분야
                  </h3>
                  <span className="text-red-500 ml-1">*</span>
                  <span className="ml-2 text-xs text-slate-500">
                    (트레이너의 전문 분야를 선택하세요)
                  </span>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {SPORTS_CATEGORIES.map(category => (
                    <div key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`specialty-${category}`}
                        value={category}
                        checked={formData.specialties.includes(category)}
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
                {errors.specialties && (
                  <p className="mt-2 text-sm text-red-500">{errors.specialties}</p>
                )}
              </div>
              
              {/* 자격증 정보 */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">
                  <Award className="w-4 h-4 inline mr-1" /> 
                  자격증 정보
                </h3>
                
                {/* 추가된 자격증 목록 */}
                {formData.certifications.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">등록된 자격증</h4>
                    <div className="space-y-2">
                      {formData.certifications.map((cert, index) => (
                        <div 
                          key={index} 
                          className="flex justify-between items-center p-2 bg-white rounded border border-slate-200"
                        >
                          <div>
                            <div className="font-medium text-slate-800">{cert.name}</div>
                            <div className="text-xs text-slate-500">
                              {cert.certId && <span className="mr-2">번호: {cert.certId}</span>}
                              <span>발급일: {cert.issueDate}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCertification(index)}
                            className="text-red-500 hover:text-red-700:text-red-400"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 자격증 추가 폼 */}
                <div className="bg-white p-3 rounded border border-slate-200">
                  <h4 className="text-sm font-medium text-slate-700 mb-2">자격증 추가</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        자격증 종류
                      </label>
                      <select
                        name="name"
                        value={newCertification.name}
                        onChange={handleCertificationChange}
                        className={clsx(
                          'form-input w-full',
                          errors.certName ? 'border-red-500' : ''
                        )}
                      >
                        <option value="">자격증 선택...</option>
                        {CERTIFICATION_TYPES.map(cert => (
                          <option key={cert} value={cert}>{cert}</option>
                        ))}
                      </select>
                      {errors.certName && (
                        <p className="mt-1 text-sm text-red-500">{errors.certName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        발급일
                      </label>
                      <input
                        type="date"
                        name="issueDate"
                        value={newCertification.issueDate}
                        onChange={handleCertificationChange}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        자격증 번호 (선택)
                      </label>
                      <input
                        type="text"
                        name="certId"
                        value={newCertification.certId}
                        onChange={handleCertificationChange}
                        className="form-input w-full"
                        placeholder="자격증 번호 (선택사항)"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCertification}
                    className="btn btn-sm btn-outline"
                  >
                    자격증 추가
                  </button>
                </div>
              </div>
              
              {/* 경력 및 소개 */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">경력 및 소개</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      경력 (년 단위)
                    </label>
                    <input
                      type="text"
                      name="experience"
                      value={formData.experience}
                      onChange={handleChange}
                      className="form-input w-full"
                      placeholder="예) 5년 / 3년 6개월"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      소개
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="form-textarea w-full h-24"
                      placeholder="트레이너 소개 및 이력을 작성해주세요"
                    />
                  </div>
                </div>
              </div>
              
              {/* 스케줄 선호도 */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <h3 className="font-medium text-slate-900">
                    <Clock className="w-4 h-4 inline mr-1" /> 
                    근무 가능 시간
                  </h3>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">가능 요일</h4>
                    <div className="flex flex-wrap gap-2">
                      {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                        <label key={day} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={day}
                            checked={formData.schedulePreference.availableDays.includes(day)}
                            onChange={handleDayChange}
                            className="rounded text-primary focus:ring-primary mr-1"
                          />
                          <span className="text-sm text-slate-700">{day}</span>
                        </label>
                      ))}
                    </div>
                    {errors.availableDays && (
                      <p className="mt-1 text-sm text-red-500">{errors.availableDays}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        선호 시작 시간
                      </label>
                      <input
                        type="time"
                        name="startTime"
                        value={formData.schedulePreference.preferredHours.start}
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
                        value={formData.schedulePreference.preferredHours.end}
                        onChange={handleTimeChange}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 시급 정보 */}
              <div className="bg-slate-50 p-4 rounded-lg">
                <h3 className="font-medium text-slate-900 mb-3">시급 정보</h3>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    시급 (원)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className={clsx(
                        'form-input w-full',
                        errors.hourlyRate ? 'border-red-500' : ''
                      )}
                      placeholder="시급 (숫자만 입력)"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-slate-500">
                      원/시간
                    </div>
                  </div>
                  {errors.hourlyRate && (
                    <p className="mt-1 text-sm text-red-500">{errors.hourlyRate}</p>
                  )}
                </div>
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
          <button 
            type="button" 
            className="btn btn-outline"
            onClick={onClose}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn-primary inline-flex items-center"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <Save size={16} className="mr-2" />
            {isSubmitting ? '저장 중...' : '트레이너 저장'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddTrainerForm; 