import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Edit, Save, Calendar, Bell, Lock, X, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import InitialsAvatar from '../components/common/InitialsAvatar';

// 비밀번호 변경 모달 컴포넌트
const PasswordChangeModal = ({ isOpen, onClose, onSubmit }: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (currentPassword: string, newPassword: string) => Promise<void>;
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 유효성 검사
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (newPassword.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit(currentPassword, newPassword);
      setIsSuccess(true);
      // 성공 후 3초 후에 모달 닫기
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        // 입력 필드 초기화
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }, 3000);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">비밀번호 변경</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-500 mb-4">
              <Check size={24} />
            </div>
            <p className="text-lg font-medium text-slate-900">비밀번호가 성공적으로 변경되었습니다.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md flex items-start">
                <AlertCircle size={18} className="mr-2 mt-0.5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">현재 비밀번호</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="form-input w-full"
                placeholder="현재 비밀번호 입력"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="form-input w-full"
                placeholder="새 비밀번호 입력 (8자 이상)"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="form-input w-full"
                placeholder="새 비밀번호 다시 입력"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-outline"
                disabled={isLoading}
              >
                취소
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '비밀번호 변경'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// 알림 설정 모달 컴포넌트
const NotificationSettingsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [emailNotifications, setEmailNotifications] = useState({
    taskAssigned: true,
    taskUpdated: true,
    announcements: true,
    weeklyReport: false,
  });

  const [appNotifications, setAppNotifications] = useState({
    taskAssigned: true,
    taskUpdated: true,
    announcements: true,
    messages: true,
  });

  const handleToggleEmail = (key: keyof typeof emailNotifications) => {
    setEmailNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleApp = (key: keyof typeof appNotifications) => {
    setAppNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    // 실제로는 API를 통해 저장
    console.log('이메일 알림 설정 저장:', emailNotifications);
    console.log('앱 알림 설정 저장:', appNotifications);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-900">알림 설정</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600:text-slate-200">
            <X size={20} />
          </button>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-medium text-slate-800 mb-3">이메일 알림</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">업무 할당 알림</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={emailNotifications.taskAssigned}
                  onChange={() => handleToggleEmail('taskAssigned')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${emailNotifications.taskAssigned ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">업무 업데이트 알림</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={emailNotifications.taskUpdated}
                  onChange={() => handleToggleEmail('taskUpdated')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${emailNotifications.taskUpdated ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">공지사항 알림</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={emailNotifications.announcements}
                  onChange={() => handleToggleEmail('announcements')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${emailNotifications.announcements ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">주간 리포트</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={emailNotifications.weeklyReport}
                  onChange={() => handleToggleEmail('weeklyReport')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${emailNotifications.weeklyReport ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h4 className="text-md font-medium text-slate-800 mb-3">앱 알림</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">업무 할당 알림</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={appNotifications.taskAssigned}
                  onChange={() => handleToggleApp('taskAssigned')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${appNotifications.taskAssigned ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">업무 업데이트 알림</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={appNotifications.taskUpdated}
                  onChange={() => handleToggleApp('taskUpdated')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${appNotifications.taskUpdated ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">공지사항 알림</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={appNotifications.announcements}
                  onChange={() => handleToggleApp('announcements')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${appNotifications.announcements ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-slate-700">메시지 알림</label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input 
                  type="checkbox" 
                  checked={appNotifications.messages}
                  onChange={() => handleToggleApp('messages')}
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${appNotifications.messages ? 'bg-blue-500' : 'bg-gray-300'}`}
                ></label>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const { user, updateProfile, updatePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // 프로필 정보 (사용자 정보 + 추가 정보)
  const [profileData, setProfileData] = useState({
    name: user?.name || '사용자',
    email: user?.email || 'user@example.com',
    phone: '010-1234-5678',
    address: '서울시 강남구',
    position: user?.role === 'admin' ? '관리자' : 
              user?.role === 'trainer' ? '트레이너' : '직원',
    joinDate: '2023년 5월 15일',
    bio: '10년 경력의 피트니스 전문가입니다. 헬스 트레이닝 및 영양 관리 전문.',
  });

  // 사용자 정보가 변경될 때 프로필 데이터 업데이트
  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email,
        position: user.role === 'admin' ? '관리자' : 
                 user.role === 'trainer' ? '트레이너' : '직원',
      }));
    }
  }, [user]);

  // 편집 데이터
  const [editData, setEditData] = useState(profileData);

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profileData);
    setSaveStatus('idle');
    setErrorMessage('');
  };

  const handleSave = async () => {
    setSaveStatus('loading');
    setErrorMessage('');
    
    try {
      // 사용자 이름만 업데이트 (실제로는 더 많은 필드 업데이트 가능)
      const { error } = await updateProfile({ name: editData.name });
      
      if (error) {
        setSaveStatus('error');
        setErrorMessage(error.message);
        return;
      }
      
      // 로컬 프로필 데이터 업데이트
      setProfileData(editData);
      setSaveStatus('success');
      setIsEditing(false);
      
      // 3초 후 상태 초기화
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error: any) {
      setSaveStatus('error');
      setErrorMessage(error.message || '프로필 저장 중 오류가 발생했습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData({
      ...editData,
      [name]: value
    });
  };
  
  const handlePasswordChange = async (currentPassword: string, newPassword: string) => {
    const { error } = await updatePassword(currentPassword, newPassword);
    if (error) {
      throw error;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">내 프로필</h1>
        {!isEditing ? (
          <button 
            onClick={handleEdit}
            className="btn btn-outline inline-flex items-center"
          >
            <Edit size={16} className="mr-2" />
            프로필 수정
          </button>
        ) : (
          <button 
            onClick={handleSave}
            className="btn btn-primary inline-flex items-center"
          >
            <Save size={16} className="mr-2" />
            저장하기
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 프로필 카드 */}
        <div className="card p-6 md:col-span-1">
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <InitialsAvatar 
                name={profileData.name} 
                size="xl" 
                className="border-4 border-primary/20"
              />
            </div>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={editData.name}
                onChange={handleChange}
                className="form-input text-center text-xl font-bold mb-1"
              />
            ) : (
              <h2 className="text-xl font-bold text-slate-900 mb-1">{profileData.name}</h2>
            )}
            <p className="text-sm text-primary font-medium">{profileData.position}</p>
            <div className="w-full mt-6 space-y-3">
              <div className="flex items-center">
                <Calendar size={18} className="text-slate-400 mr-3" />
                <span className="text-sm text-slate-600">{profileData.joinDate} 입사</span>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 정보 */}
        <div className="card p-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">개인 정보</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">이메일</label>
                <div className="flex items-center">
                  <Mail size={18} className="text-slate-400 mr-2" />
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={editData.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.email}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1">전화번호</label>
                <div className="flex items-center">
                  <Phone size={18} className="text-slate-400 mr-2" />
                  {isEditing ? (
                    <input
                      type="text"
                      name="phone"
                      value={editData.phone}
                      onChange={handleChange}
                      className="form-input"
                    />
                  ) : (
                    <p className="text-slate-900">{profileData.phone}</p>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">주소</label>
              <div className="flex items-center">
                <MapPin size={18} className="text-slate-400 mr-2" />
                {isEditing ? (
                  <input
                    type="text"
                    name="address"
                    value={editData.address}
                    onChange={handleChange}
                    className="form-input w-full"
                  />
                ) : (
                  <p className="text-slate-900">{profileData.address}</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">자기소개</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={editData.bio}
                  onChange={handleChange}
                  className="form-input w-full h-24"
                />
              ) : (
                <p className="text-slate-900">{profileData.bio}</p>
              )}
            </div>
          </div>
        </div>

        {/* 설정 */}
        <div className="card p-6 md:col-span-3">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">계정 설정</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-900">알림 설정</p>
                <p className="text-sm text-slate-500">이메일 및 앱 알림 설정</p>
              </div>
              <button 
                onClick={() => setIsNotificationModalOpen(true)}
                className="btn btn-sm btn-outline inline-flex items-center"
              >
                <Bell size={14} className="mr-1" />
                설정
              </button>
            </div>
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <div>
                <p className="font-medium text-slate-900">비밀번호 변경</p>
                <p className="text-sm text-slate-500">계정 비밀번호 변경</p>
              </div>
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="btn btn-sm btn-outline inline-flex items-center"
              >
                <Lock size={14} className="mr-1" />
                변경
              </button>
            </div>
            <div className="flex items-center justify-between p-3">
              <div>
                <p className="font-medium text-slate-900">다중 인증(MFA)</p>
                <p className="text-sm text-slate-500">계정 보안 강화</p>
              </div>
              <button className="btn btn-sm btn-outline inline-flex items-center">
                <User size={14} className="mr-1" />
                설정
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* 상태 메시지 */}
      {saveStatus === 'success' && (
        <div className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-3 rounded-md shadow-md flex items-center">
          <Check size={18} className="mr-2" />
          프로필이 성공적으로 저장되었습니다.
        </div>
      )}
      
      {saveStatus === 'error' && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-4 py-3 rounded-md shadow-md flex items-center">
          <AlertCircle size={18} className="mr-2" />
          {errorMessage || '프로필 저장 중 오류가 발생했습니다.'}
        </div>
      )}
      
      {/* 비밀번호 변경 모달 */}
      <PasswordChangeModal 
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={handlePasswordChange}
      />
      
      {/* 알림 설정 모달 */}
      <NotificationSettingsModal 
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
      />
    </motion.div>
  );
};

export default Profile;