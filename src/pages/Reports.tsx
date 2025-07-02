import React from 'react';
import { BarChart2, FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Reports: React.FC = () => {
  const reportCategories = [
    {
      id: 'sales',
      title: '매출 보고서',
      description: '월간/연간 매출 통계 및 추이',
      icon: <BarChart2 size={24} className="text-blue-500" />,
      link: '/reports/sales'
    },
    {
      id: 'members',
      title: '회원 보고서',
      description: '회원 등록/해지 추이 및 통계',
      icon: <BarChart2 size={24} className="text-green-500" />,
      link: '/reports/members'
    },
    {
      id: 'trainers',
      title: '트레이너 실적',
      description: '트레이너별 세션 및 회원 관리 실적',
      icon: <BarChart2 size={24} className="text-purple-500" />,
      link: '/reports/trainers'
    },
    {
      id: 'attendance',
      title: '출석 보고서',
      description: '회원 출석률 및 방문 패턴 분석',
      icon: <BarChart2 size={24} className="text-orange-500" />,
      link: '/reports/attendance'
    },
    {
      id: 'work',
      title: '업무 보고서',
      description: '직원 업무 보고 및 작업 로그',
      icon: <FileText size={24} className="text-indigo-500" />,
      link: '/work-reports'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">보고서</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportCategories.map((category) => (
          <Link 
            key={category.id}
            to={category.link}
            className="card p-6 hover:shadow-md transition-shadow flex items-start"
          >
            <div className="mr-4 p-3 rounded-full bg-slate-100">
              {category.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-slate-900 mb-1">
                {category.title}
              </h3>
              <p className="text-sm text-slate-500 mb-2">
                {category.description}
              </p>
              <div className="flex items-center text-primary text-sm font-medium">
                자세히 보기
                <ChevronRight size={16} className="ml-1" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Reports;