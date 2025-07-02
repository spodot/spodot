import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, User, Lock, Bell, Calendar, DollarSign, Database, Mail, Zap, Shield, UploadCloud as CloudUpload, Clock, Globe, Check, X, Save, BarChart2, Moon, Sun, Smartphone, Laptop, Trash, Download, ToggleLeft, ToggleRight, Plus } from 'lucide-react';
import clsx from 'clsx';

// 알림 빈도 타입
type NotificationFrequency = 'immediately' | 'hourly' | 'daily' | 'weekly' | 'never';

// 환경설정 메뉴 항목
interface SettingMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);
  const [pushNotifications, setPushNotifications] = useState<boolean>(true);
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>('immediately');
  const [maintenanceMode, setMaintenanceMode] = useState<boolean>(false);
  const [autoLogout, setAutoLogout] = useState<number>(30);
  
  // 시스템 설정
  const [darkMode, setDarkMode] = useState<'system' | 'light' | 'dark'>('system');
  const [language, setLanguage] = useState<'ko' | 'en'>('ko');
  const [dateFormat, setDateFormat] = useState<'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY'>('YYYY-MM-DD');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');
  
  // 백업 설정
  const [backupEnabled, setBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [backupRetention, setBackupRetention] = useState(7);
  
  // 알림 설정
  const [systemNotifications, setSystemNotifications] = useState(true);
  
  // 회원권 설정
  const [membershipTypes, setMembershipTypes] = useState([
    { id: 1, name: '기본 회원권', durationDays: 30, price: 50000 },
    { id: 2, name: 'PT 패키지 10회', durationDays: 60, price: 450000 },
    { id: 3, name: 'PT 패키지 20회', durationDays: 90, price: 800000 },
    { id: 4, name: 'PT 패키지 30회', durationDays: 120, price: 1100000 },
    { id: 5, name: '1개월 무제한', durationDays: 30, price: 100000 },
    { id: 6, name: '3개월 무제한', durationDays: 90, price: 270000 },
    { id: 7, name: '6개월 무제한', durationDays: 180, price: 500000 },
    { id: 8, name: '12개월 무제한', durationDays: 365, price: 900000 },
  ]);
  
  // 설정 메뉴 항목
  const settingMenuItems: SettingMenuItem[] = [
    { id: 'general', label: '일반 설정', icon: <Settings size={20} />, description: '시스템 일반 설정 및 환경설정' },
    { id: 'users', label: '사용자 관리', icon: <User size={20} />, description: '사용자 권한 및 계정 관리' },
    { id: 'security', label: '보안 설정', icon: <Shield size={20} />, description: '시스템 보안 및 접근 제어' },
    { id: 'notifications', label: '알림 설정', icon: <Bell size={20} />, description: '시스템 알림 및 커뮤니케이션' },
    { id: 'schedule', label: '일정 설정', icon: <Calendar size={20} />, description: '일정 및 예약 시스템 설정' },
    { id: 'payments', label: '결제 설정', icon: <DollarSign size={20} />, description: '결제 방식 및 요금제 관리' },
    { id: 'data', label: '데이터 관리', icon: <Database size={20} />, description: '데이터 백업 및 복원 관리' },
    { id: 'integrations', label: '연동 설정', icon: <Zap size={20} />, description: '외부 서비스 연동 및 API 설정' }
  ];
  
  // 일반 설정 컴포넌트
  const GeneralSettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">시스템 설정</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">유지보수 모드</p>
              <p className="text-sm text-slate-500">시스템 유지보수 중에 사용자 접근 제한</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={maintenanceMode}
                onChange={() => setMaintenanceMode(!maintenanceMode)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              자동 로그아웃 시간 (분)
            </label>
            <select
              value={autoLogout}
              onChange={(e) => setAutoLogout(Number(e.target.value))}
              className="form-input"
            >
              <option value={15}>15분</option>
              <option value={30}>30분</option>
              <option value={60}>1시간</option>
              <option value={120}>2시간</option>
            </select>
            <p className="text-xs text-slate-500">
              비활성화 상태가 지정된 시간을 초과하면 자동으로 로그아웃됩니다.
            </p>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              언어 설정
            </label>
            <select className="form-input">
              <option value="ko">한국어</option>
              <option value="en">English</option>
              <option value="ja">日本語</option>
              <option value="zh">中文</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              시간대 설정
            </label>
            <select className="form-input">
              <option value="Asia/Seoul">(GMT+09:00) 서울</option>
              <option value="Asia/Tokyo">(GMT+09:00) 도쿄</option>
              <option value="America/New_York">(GMT-05:00) 뉴욕</option>
              <option value="Europe/London">(GMT+00:00) 런던</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">운영 정보</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              센터명
            </label>
            <input
              type="text"
              className="form-input"
              defaultValue="피트니스 센터"
            />
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              주소
            </label>
            <input
              type="text"
              className="form-input"
              defaultValue="서울특별시 강남구 테헤란로 123"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                연락처
              </label>
              <input
                type="text"
                className="form-input"
                defaultValue="02-1234-5678"
              />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                이메일
              </label>
              <input
                type="email"
                className="form-input"
                defaultValue="info@fitness-center.com"
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              운영 시간
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                className="form-input"
                placeholder="시작 시간"
                defaultValue="06:00"
              />
              <input
                type="text"
                className="form-input"
                placeholder="종료 시간"
                defaultValue="22:00"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button className="btn btn-outline">취소</button>
        <button className="btn btn-primary">저장하기</button>
      </div>
    </div>
  );
  
  // 알림 설정 컴포넌트
  const NotificationSettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">알림 설정</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">이메일 알림</p>
              <p className="text-sm text-slate-500">중요 알림을 이메일로 받기</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={emailNotifications}
                onChange={() => setEmailNotifications(!emailNotifications)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">푸시 알림</p>
              <p className="text-sm text-slate-500">브라우저와 모바일 앱 푸시 알림</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={pushNotifications}
                onChange={() => setPushNotifications(!pushNotifications)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              알림 빈도
            </label>
            <select
              value={notificationFrequency}
              onChange={(e) => setNotificationFrequency(e.target.value as NotificationFrequency)}
              className="form-input"
            >
              <option value="immediately">즉시 알림</option>
              <option value="hourly">시간별 요약</option>
              <option value="daily">일별 요약</option>
              <option value="weekly">주별 요약</option>
              <option value="never">알림 끄기</option>
            </select>
            <p className="text-xs text-slate-500">
              알림을 얼마나 자주 받을지 설정하세요.
            </p>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">알림 유형 설정</h3>
        <div className="space-y-4">
          {[
            { id: 'new_member', label: '신규 회원 등록', checked: true },
            { id: 'session_reminder', label: 'PT 세션 알림', checked: true },
            { id: 'payment_reminder', label: '결제 알림', checked: true },
            { id: 'member_birthday', label: '회원 생일 알림', checked: false },
            { id: 'system_updates', label: '시스템 업데이트', checked: true },
          ].map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 border-b border-slate-200 last:border-0">
              <p className="font-medium text-slate-900">{item.label}</p>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={item.checked}
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">이메일 템플릿</h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              환영 이메일
            </label>
            <textarea
              className="form-input h-32"
              defaultValue={`안녕하세요 {name}님,\n\n피트니스 센터에 가입해주셔서 감사합니다!\n귀하의 회원 ID는 {memberId}입니다.\n\n즐거운 운동 되세요!`}
            />
            <p className="text-xs text-slate-500">
              {'{name}'}, {'{memberId}'} 등의 변수를 사용할 수 있습니다.
            </p>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button className="btn btn-sm btn-outline">기본값으로 복원</button>
            <button className="btn btn-sm btn-primary">템플릿 저장</button>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button className="btn btn-outline">취소</button>
        <button className="btn btn-primary">저장하기</button>
      </div>
    </div>
  );
  
  // 데이터 관리 컴포넌트
  const DataManagementSettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">데이터 백업</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">자동 백업</p>
              <p className="text-sm text-slate-500">매일 자동으로 데이터 백업</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={true}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              백업 빈도
            </label>
            <select className="form-input">
              <option value="daily">매일</option>
              <option value="weekly">매주</option>
              <option value="monthly">매월</option>
            </select>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              백업 보관 기간
            </label>
            <select className="form-input">
              <option value="7">7일</option>
              <option value="14">14일</option>
              <option value="30">30일</option>
              <option value="90">90일</option>
              <option value="365">1년</option>
            </select>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="font-medium text-slate-900">수동 백업</p>
              <p className="text-sm text-slate-500">지금 모든 데이터 백업하기</p>
            </div>
            <button className="btn btn-primary inline-flex items-center">
              <CloudUpload size={16} className="mr-2" />
              백업 시작
            </button>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">백업 내역</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  파일명
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  타입
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  날짜
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  크기
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  상태
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {[
                { filename: 'backup_20230801_auto', type: '자동', date: '2023-08-01 03:00', size: '45.2 MB', status: '완료' },
                { filename: 'backup_20230731_auto', type: '자동', date: '2023-07-31 03:00', size: '44.8 MB', status: '완료' },
                { filename: 'backup_20230730_manual', type: '수동', date: '2023-07-30 15:12', size: '44.5 MB', status: '완료' },
                { filename: 'backup_20230730_auto', type: '자동', date: '2023-07-30 03:00', size: '44.1 MB', status: '완료' },
              ].map((backup, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                    {backup.filename}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {backup.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {backup.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                    {backup.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {backup.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-primary hover:text-primary-dark mr-3">
                      다운로드
                    </button>
                    <button className="text-red-600 hover:text-red-800:text-red-300">
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">데이터 복원</h3>
        <div className="space-y-4">
          <div className="p-6 border-2 border-dashed border-slate-300 rounded-lg text-center">
            <div className="flex flex-col items-center">
              <CloudUpload size={36} className="text-slate-400 mb-2" />
              <p className="text-sm text-slate-700 mb-2">
                백업 파일을 여기에 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-slate-500">
                ZIP 또는 SQL 파일만 허용됩니다
              </p>
              <button className="mt-4 btn btn-outline">
                파일 선택
              </button>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>주의:</strong> 데이터 복원은 현재 데이터를 대체합니다. 이 작업은 되돌릴 수 없습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
  
  // 보안 설정 컴포넌트
  const SecuritySettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">보안 정책</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">2단계 인증 요구</p>
              <p className="text-sm text-slate-500">모든 관리자 계정에 2단계 인증 요구</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={true}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              비밀번호 정책
            </label>
            <select className="form-input">
              <option value="standard">표준 (8자 이상, 영문/숫자 조합)</option>
              <option value="strong">강력 (10자 이상, 영문/숫자/특수문자 조합)</option>
              <option value="very-strong">매우 강력 (12자 이상, 대소문자/숫자/특수문자 조합)</option>
            </select>
            <p className="text-xs text-slate-500">
              모든 사용자에게 적용되는 비밀번호 정책입니다.
            </p>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              비밀번호 유효 기간
            </label>
            <select className="form-input">
              <option value="never">만료 없음</option>
              <option value="30">30일</option>
              <option value="60">60일</option>
              <option value="90">90일</option>
              <option value="180">180일</option>
            </select>
            <p className="text-xs text-slate-500">
              지정된 날짜 이후 비밀번호 변경을 요구합니다.
            </p>
          </div>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">세션 관리</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">단일 세션 제한</p>
              <p className="text-sm text-slate-500">사용자당 하나의 활성 세션만 허용</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={false}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              세션 타임아웃 (분)
            </label>
            <select className="form-input">
              <option value="15">15분</option>
              <option value="30">30분</option>
              <option value="60">1시간</option>
              <option value="120">2시간</option>
              <option value="240">4시간</option>
            </select>
          </div>
          
          <button className="btn btn-outline text-red-500 border-red-300 hover:bg-red-50:bg-red-900/20">
            모든 활성 세션 종료
          </button>
        </div>
      </div>
      
      <div className="card p-6">
        <h3 className="text-lg font-medium text-slate-900 mb-4">접근 로그</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">접근 로그 활성화</p>
              <p className="text-sm text-slate-500">모든 사용자 활동 기록</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                defaultChecked={true}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">
              로그 보존 기간
            </label>
            <select className="form-input">
              <option value="30">30일</option>
              <option value="60">60일</option>
              <option value="90">90일</option>
              <option value="180">180일</option>
              <option value="365">1년</option>
            </select>
          </div>
          
          <button className="btn btn-primary">
            접근 로그 보기
          </button>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button className="btn btn-outline">취소</button>
        <button className="btn btn-primary">저장하기</button>
      </div>
    </div>
  );
  
  // 기타 설정 컴포넌트 유사하게 구현...
  
  // 페이지 컨텐츠 맵핑
  const tabContent: Record<string, React.ReactNode> = {
    general: <GeneralSettings />,
    notifications: <NotificationSettings />,
    data: <DataManagementSettings />,
    security: <SecuritySettings />,
    // 다른 탭 컨텐츠도 유사하게 추가...
  };
  
  // 현재 선택된 탭 컨텐츠
  const renderContent = () => {
    return tabContent[activeTab] || <GeneralSettings />;
  };
  
  // 설정 아이템 렌더링
  const renderSettingMenuItem = (item: SettingMenuItem) => (
    <button
      key={item.id}
      onClick={() => setActiveTab(item.id)}
      className={clsx(
        'flex items-center p-3 w-full text-left transition-colors rounded-lg',
        activeTab === item.id
          ? 'bg-primary text-white'
          : 'hover:bg-slate-100:bg-slate-700/50 text-slate-700'
      )}
    >
      <div className="flex-shrink-0 mr-3">
        {item.icon}
      </div>
      <div>
        <p className="font-medium">{item.label}</p>
        <p className={clsx(
          'text-xs',
          activeTab === item.id ? 'text-white/80' : 'text-slate-500'
        )}>
          {item.description}
        </p>
      </div>
    </button>
  );
  
  // 설정 저장
  const saveSettings = () => {
    // localStorage에 설정 저장
    localStorage.setItem('adminSettings', JSON.stringify({
      darkMode,
      language,
      dateFormat,
      timeFormat,
      backupEnabled,
      backupFrequency,
      backupRetention,
      emailNotifications,
      systemNotifications,
      membershipTypes
    }));
    
    // 저장 완료 알림
    alert('설정이 저장되었습니다.');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">관리자 설정</h1>
        
        <button
          onClick={saveSettings}
          className="btn btn-primary inline-flex items-center"
        >
          <Save size={16} className="mr-2" />
          설정 저장
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 설정 메뉴 */}
        <div className="lg:col-span-1 space-y-3">
          <div className="card p-3">
            {settingMenuItems.map(renderSettingMenuItem)}
          </div>
          
          <div className="card p-4 bg-blue-50 border border-blue-200">
            <h3 className="font-medium text-blue-900 flex items-center">
              <Info size={18} className="mr-2" />
              시스템 정보
            </h3>
            <div className="mt-2 space-y-1 text-sm text-blue-800">
              <p>버전: v1.5.2</p>
              <p>마지막 업데이트: 2023-07-28</p>
              <p>데이터베이스: PostgreSQL 14.5</p>
            </div>
          </div>
        </div>
        
        {/* 설정 내용 */}
        <div className="lg:col-span-3">
          {renderContent()}
        </div>
      </div>
    </motion.div>
  );
};

// Info 아이콘 컴포넌트
const Info = ({ size = 24, className = '' }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export default AdminSettings;