import { useState } from 'react';
import { X, Save, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useUser, UserStatus, Gender, Client } from '../../contexts/UserContext';
import clsx from 'clsx';

export interface AddClientFormProps {
  onClose: () => void;
}

const AddClientForm = ({ onClose }: AddClientFormProps) => {
  const { addClient, trainers } = useUser();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as UserStatus,
    dateOfBirth: '',
    gender: '' as Gender | '',
    address: '',
    emergencyContact: '',
    membershipType: '',
    membershipStart: format(new Date(), 'yyyy-MM-dd'),
    membershipEnd: format(new Date(new Date().setFullYear(new Date().getFullYear() + 1)), 'yyyy-MM-dd'),
    weight: '',
    height: '',
    goals: '',
    healthNotes: '',
    assignedTrainerId: '',
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
    
    if (!formData.membershipType) newErrors.membershipType = '멤버십 유형을 선택해 주세요';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // 트레이너 이름 가져오기
      const assignedTrainer = trainers.find(t => t.id === formData.assignedTrainerId);
      
      // 클라이언트 데이터 준비
      const clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'role'> = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender as Gender || undefined,
        address: formData.address || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        membershipType: formData.membershipType,
        membershipStart: formData.membershipStart,
        membershipEnd: formData.membershipEnd,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        goals: formData.goals || undefined,
        healthNotes: formData.healthNotes || undefined,
        assignedTrainerId: formData.assignedTrainerId || undefined,
        assignedTrainerName: assignedTrainer ? assignedTrainer.name : undefined,
      };
      
      // 클라이언트 추가
      addClient(clientData);
      
      // 폼 닫기
      onClose();
    } catch (error) {
      console.error('고객 추가 중 오류 발생:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const formFields = [
    { 
      label: '고객명', 
      name: 'name', 
      type: 'text', 
      required: true,
      placeholder: '고객 이름을 입력하세요' 
    },
    { 
      label: '이메일', 
      name: 'email', 
      type: 'email', 
      required: true,
      placeholder: 'email@example.com' 
    },
    { 
      label: '전화번호', 
      name: 'phone', 
      type: 'text', 
      required: true,
      placeholder: '010-1234-5678' 
    },
    { 
      label: '생년월일', 
      name: 'dateOfBirth', 
      type: 'date'
    },
    { 
      label: '성별', 
      name: 'gender', 
      type: 'select',
      options: [
        { value: '', label: '선택 안함' },
        { value: 'male', label: '남성' },
        { value: 'female', label: '여성' },
        { value: 'other', label: '기타' }
      ]
    },
    { 
      label: '주소', 
      name: 'address', 
      type: 'text',
      placeholder: '주소를 입력하세요' 
    },
    { 
      label: '비상 연락처', 
      name: 'emergencyContact', 
      type: 'text',
      placeholder: '비상 연락처를 입력하세요' 
    },
    { 
      label: '멤버십 유형', 
      name: 'membershipType', 
      type: 'select',
      required: true,
      options: [
        { value: '', label: '선택해 주세요' },
        { value: '기본 회원권', label: '기본 회원권' },
        { value: 'PT 패키지 10회', label: 'PT 패키지 10회' },
        { value: 'PT 패키지 20회', label: 'PT 패키지 20회' },
        { value: 'PT 패키지 30회', label: 'PT 패키지 30회' },
        { value: '1개월 무제한', label: '1개월 무제한' },
        { value: '3개월 무제한', label: '3개월 무제한' },
        { value: '6개월 무제한', label: '6개월 무제한' },
        { value: '12개월 무제한', label: '12개월 무제한' }
      ]
    },
    { 
      label: '멤버십 시작일', 
      name: 'membershipStart', 
      type: 'date',
      required: true
    },
    { 
      label: '멤버십 종료일', 
      name: 'membershipEnd', 
      type: 'date',
      required: true
    },
    { 
      label: '체중 (kg)', 
      name: 'weight', 
      type: 'number',
      min: '20',
      max: '300',
      step: '0.1'
    },
    { 
      label: '신장 (cm)', 
      name: 'height', 
      type: 'number',
      min: '100',
      max: '250',
      step: '0.1'
    },
    { 
      label: '담당 트레이너', 
      name: 'assignedTrainerId', 
      type: 'select',
      options: [
        { value: '', label: '배정 안함' },
        ...trainers.map(trainer => ({ 
          value: trainer.id, 
          label: trainer.name 
        }))
      ]
    },
    { 
      label: '고객 상태', 
      name: 'status', 
      type: 'select',
      required: true,
      options: [
        { value: 'active', label: '활성' },
        { value: 'inactive', label: '비활성' },
        { value: 'pending', label: '대기중' }
      ]
    }
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
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <User className="w-5 h-5 mr-2" />
            새 고객 추가
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formFields.map(field => (
                <div key={field.name} className={clsx(
                  'space-y-2',
                  field.name === 'goals' || field.name === 'healthNotes' ? 'md:col-span-2' : ''
                )}>
                  <label 
                    htmlFor={field.name} 
                    className="block text-sm font-medium text-slate-700"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'select' ? (
                    <select
                      id={field.name}
                      name={field.name}
                      value={formData[field.name as keyof typeof formData] as string}
                      onChange={handleChange}
                      className={clsx(
                        'form-input w-full',
                        errors[field.name] ? 'border-red-500' : ''
                      )}
                      required={field.required}
                    >
                      {field.options?.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.name === 'goals' || field.name === 'healthNotes' ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={formData[field.name as keyof typeof formData] as string}
                      onChange={handleChange}
                      rows={3}
                      className={clsx(
                        'form-input w-full',
                        errors[field.name] ? 'border-red-500' : ''
                      )}
                      placeholder={field.placeholder}
                      required={field.required}
                    />
                  ) : (
                    <input
                      id={field.name}
                      name={field.name}
                      type={field.type}
                      value={formData[field.name as keyof typeof formData] as string}
                      onChange={handleChange}
                      className={clsx(
                        'form-input w-full',
                        errors[field.name] ? 'border-red-500' : ''
                      )}
                      placeholder={field.placeholder}
                      required={field.required}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                    />
                  )}
                  
                  {errors[field.name] && (
                    <p className="mt-1 text-sm text-red-500">{errors[field.name]}</p>
                  )}
                </div>
              ))}
              
              <div className="md:col-span-2">
                <label 
                  htmlFor="goals" 
                  className="block text-sm font-medium text-slate-700"
                >
                  고객 목표
                </label>
                <textarea
                  id="goals"
                  name="goals"
                  rows={3}
                  value={formData.goals}
                  onChange={handleChange}
                  className="form-input w-full mt-1"
                  placeholder="고객의 트레이닝 목표를 입력하세요"
                />
              </div>
              
              <div className="md:col-span-2">
                <label 
                  htmlFor="healthNotes" 
                  className="block text-sm font-medium text-slate-700"
                >
                  건강 특이사항
                </label>
                <textarea
                  id="healthNotes"
                  name="healthNotes"
                  rows={3}
                  value={formData.healthNotes}
                  onChange={handleChange}
                  className="form-input w-full mt-1"
                  placeholder="건강 관련 특이사항을 입력하세요 (부상, 질환 등)"
                />
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
            {isSubmitting ? '저장 중...' : '고객 저장'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddClientForm;