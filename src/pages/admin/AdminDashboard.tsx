import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Settings, Database, Shield, BarChart2, CreditCard, FileText, HelpCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AdminMenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  to: string;
  color: string;
}

const AdminMenuItem = ({ icon, title, description, to, color }: AdminMenuItemProps) => (
  <Link to={to} className="block">
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-6 rounded-lg shadow-sm hover:shadow-md transition-all ${color}`}
    >
      <div className="flex items-start">
        <div className="mr-4 p-2 rounded-full bg-white/20">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg">{title}</h3>
          <p className="text-white/80 text-sm mt-1">{description}</p>
        </div>
      </div>
    </motion.div>
  </Link>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '안녕하세요';
    return '좋은 저녁이에요';
  })();

  const adminMenuItems: AdminMenuItemProps[] = [
    {
      icon: <Users size={24} className="text-white" />,
      title: '직원 관리',
      description: '직원 계정 추가 및 관리',
      to: '/admin/staff',
      color: 'bg-blue-600',
    },
    {
      icon: <Settings size={24} className="text-white" />,
      title: '시스템 설정',
      description: '시스템 환경 설정',
      to: '/admin/settings',
      color: 'bg-indigo-600',
    },
    {
      icon: <Database size={24} className="text-white" />,
      title: '데이터 관리',
      description: '데이터 백업 및 복원',
      to: '/admin/data',
      color: 'bg-purple-600',
    },
    {
      icon: <Shield size={24} className="text-white" />,
      title: '보안 설정',
      description: '접근 권한 및 보안 관리',
      to: '/admin/security',
      color: 'bg-red-600',
    },
    {
      icon: <BarChart2 size={24} className="text-white" />,
      title: '통계 및 보고서',
      description: '시스템 사용 통계 및 분석',
      to: '/admin/reports',
      color: 'bg-green-600',
    },
    {
      icon: <CreditCard size={24} className="text-white" />,
      title: '결제 설정',
      description: '결제 방식 및 요금제 관리',
      to: '/admin/payments',
      color: 'bg-yellow-600',
    },
    {
      icon: <FileText size={24} className="text-white" />,
      title: '로그 관리',
      description: '시스템 로그 및 활동 기록',
      to: '/admin/logs',
      color: 'bg-cyan-600',
    },
    {
      icon: <HelpCircle size={24} className="text-white" />,
      title: '도움말',
      description: '관리자 가이드 및 지원',
      to: '/admin/help',
      color: 'bg-slate-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">관리자 대시보드</h1>
          <p className="text-slate-600">
            {greeting}, {user?.name}님! 관리자 메뉴에 오신 것을 환영합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {adminMenuItems.map((item, index) => (
          <AdminMenuItem
            key={index}
            icon={item.icon}
            title={item.title}
            description={item.description}
            to={item.to}
            color={item.color}
          />
        ))}
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">시스템 상태</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-100 rounded-lg">
            <p className="text-sm text-slate-600">활성 사용자</p>
            <p className="text-2xl font-bold text-slate-900">24</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-lg">
            <p className="text-sm text-slate-600">오늘 예약</p>
            <p className="text-2xl font-bold text-slate-900">12</p>
          </div>
          <div className="p-4 bg-slate-100 rounded-lg">
            <p className="text-sm text-slate-600">서버 상태</p>
            <p className="text-2xl font-bold text-green-600">정상</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">최근 활동</h2>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-slate-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
            <div>
              <p className="text-sm text-slate-900">새 직원 계정이 생성되었습니다.</p>
              <p className="text-xs text-slate-500">오늘 10:25</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-slate-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-3"></div>
            <div>
              <p className="text-sm text-slate-900">시스템 백업이 완료되었습니다.</p>
              <p className="text-xs text-slate-500">오늘 09:15</p>
            </div>
          </div>
          <div className="flex items-center p-3 bg-slate-50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-3"></div>
            <div>
              <p className="text-sm text-slate-900">보안 설정이 업데이트되었습니다.</p>
              <p className="text-xs text-slate-500">어제 18:30</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
