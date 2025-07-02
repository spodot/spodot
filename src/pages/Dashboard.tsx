import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bell,
  Megaphone,
  Briefcase,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Calendar,
  TrendingUp,
  FileText,
  MessageSquare,
  ArrowRight,
  Timer,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../contexts/TaskContext';
import { useAnnouncement } from '../contexts/AnnouncementContext';
import { useMember } from '../contexts/MemberContext';
import { format, isToday, isTomorrow, differenceInDays, startOfDay, endOfDay, isAfter, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import clsx from 'clsx';

// 퀴즈 타임 배지 컴포넌트
const QuickActionBadge = ({ icon, label, count, color, link }: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  link: string;
}) => (
  <Link to={link}>
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`p-4 rounded-xl shadow-sm border border-gray-200 bg-white hover:shadow-md transition-all cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className={`text-2xl font-bold ${color}`}>{count}</p>
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          {icon}
        </div>
      </div>
    </motion.div>
  </Link>
);

// 업무 우선순위 색상
const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'high': return 'bg-red-500';
    case 'medium': return 'bg-yellow-500';
    case 'low': return 'bg-green-500';
    default: return 'bg-gray-500';
  }
};

// 업무 상태 색상
const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// 업무 상태 라벨
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'pending': return '대기중';
    case 'in_progress': return '진행중';
    case 'completed': return '완료';
    case 'cancelled': return '취소됨';
    default: return status;
  }
};

const Dashboard = () => {
  const { user } = useAuth();
  const { tasks } = useTask();
  const { announcements } = useAnnouncement();
  const { members } = useMember();

  // 오늘 날짜
  const today = new Date();
  const formattedDate = format(today, 'yyyy년 MM월 dd일 EEEE', { locale: ko });

  // 내 업무 필터링
  const myTasks = tasks.filter(task => 
    task.assignedTo.includes(user?.id || '') || task.assignedBy === user?.id
  );

  // 오늘 마감 업무
  const todayTasks = myTasks.filter(task => {
    if (!task.dueDate) return false;
    return isToday(new Date(task.dueDate));
  });

  // 내일 마감 업무
  const tomorrowTasks = myTasks.filter(task => {
    if (!task.dueDate) return false;
    return isTomorrow(new Date(task.dueDate));
  });

  // 지연된 업무
  const overdueTasks = myTasks.filter(task => {
    if (!task.dueDate || task.status === 'completed') return false;
    return isBefore(new Date(task.dueDate), startOfDay(today));
  });

  // 진행중인 업무
  const inProgressTasks = myTasks.filter(task => task.status === 'in-progress');

  // 완료된 업무 (이번 주)
  const completedThisWeek = myTasks.filter(task => {
    if (task.status !== 'completed' || !task.updatedAt) return false;
    const completedDate = new Date(task.updatedAt);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return isAfter(completedDate, weekAgo);
  }).length;

  // 중요한 업무
  const highPriorityTasks = myTasks.filter(task => 
    task.priority === 'high' && task.status !== 'completed'
  );

  // 최근 공지사항 (상위 3개)
  const recentAnnouncements = announcements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  // 업무 통계
  const taskStats = [
    {
      label: '오늘 마감',
      count: todayTasks.length,
      color: 'text-red-600',
      icon: <Timer size={24} />,
      link: '/my-tasks'
    },
    {
      label: '진행중',
      count: inProgressTasks.length,
      color: 'text-blue-600',
      icon: <Zap size={24} />,
      link: '/my-tasks'
    },
    {
      label: '이번주 완료',
      count: completedThisWeek,
      color: 'text-green-600',
      icon: <CheckCircle2 size={24} />,
      link: '/my-tasks'
    },
    {
      label: '중요 업무',
      count: highPriorityTasks.length,
      color: 'text-orange-600',
      icon: <AlertTriangle size={24} />,
      link: '/my-tasks'
    }
  ];

  // 위젯 애니메이션
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="p-4 sm:p-6 lg:p-8 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* 헤더 */}
      <motion.header variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            안녕하세요, {user?.name}님 👋
          </h1>
          <p className="text-gray-600 mt-1">{formattedDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/my-tasks"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Briefcase size={20} />
            내 업무 보기
          </Link>
        </div>
      </motion.header>

      {/* 긴급 알림 배너 */}
      {overdueTasks.length > 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-red-500" size={24} />
            <div>
              <p className="text-red-800 font-medium">
                지연된 업무가 {overdueTasks.length}개 있습니다
              </p>
              <p className="text-red-600 text-sm">
                마감일이 지난 업무를 확인해주세요.
              </p>
            </div>
            <Link 
              to="/my-tasks"
              className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
            >
              확인하기
            </Link>
          </div>
        </motion.div>
      )}

      {/* 업무 통계 카드 */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {taskStats.map((stat, index) => (
          <QuickActionBadge key={index} {...stat} />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 오늘의 업무 */}
        <motion.section variants={itemVariants} className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="text-indigo-600" size={24} />
              오늘의 업무
            </h2>
            <Link 
              to="/my-tasks"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-1"
            >
              전체 보기 <ArrowRight size={16} />
            </Link>
          </div>
          
          {todayTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">오늘 마감인 업무가 없습니다</p>
              <p className="text-gray-400 text-sm">새로운 업무를 추가하거나 기존 업무를 확인해보세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                    <div>
                      <h3 className="font-medium text-gray-900">{task.title}</h3>
                      <p className="text-sm text-gray-600">{task.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                    {task.dueDate && (
                      <span className="text-sm text-gray-500">
                        {format(new Date(task.dueDate), 'HH:mm')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {todayTasks.length > 5 && (
                <div className="text-center pt-4">
                  <Link 
                    to="/my-tasks"
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    +{todayTasks.length - 5}개 더 보기
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.section>

        {/* 사이드 패널 */}
        <div className="space-y-6">
          {/* 내일의 업무 미리보기 */}
          <motion.section variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="text-yellow-600" size={20} />
              내일 마감 업무
            </h3>
            {tomorrowTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">내일 마감인 업무가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {tomorrowTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      <p className="text-xs text-gray-600">{task.description}</p>
                    </div>
                  </div>
                ))}
                {tomorrowTasks.length > 3 && (
                  <p className="text-xs text-gray-500 text-center">+{tomorrowTasks.length - 3}개 더</p>
                )}
              </div>
            )}
          </motion.section>

          {/* 최근 공지사항 */}
          <motion.section variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Megaphone className="text-blue-600" size={20} />
                공지사항
              </h3>
              <Link 
                to="/announcements"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                전체보기
              </Link>
            </div>
            {recentAnnouncements.length === 0 ? (
              <p className="text-gray-500 text-sm">최근 공지사항이 없습니다</p>
            ) : (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="border-b border-gray-100 last:border-b-0 pb-3 last:pb-0">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{announcement.title}</h4>
                    <p className="text-xs text-gray-600 mb-2">
                      {format(new Date(announcement.createdAt), 'MM.dd', { locale: ko })}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {announcement.content.length > 50 
                        ? `${announcement.content.substring(0, 50)}...` 
                        : announcement.content
                      }
                    </p>
                  </div>
                ))}
              </div>
            )}
          </motion.section>

          {/* 빠른 작업 */}
          <motion.section variants={itemVariants} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="text-green-600" size={20} />
              빠른 작업
            </h3>
            <div className="space-y-3">
              <Link 
                to="/daily-report"
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FileText className="text-blue-600" size={20} />
                <span className="text-sm font-medium text-gray-900">일일 보고서 작성</span>
              </Link>
              <Link 
                to="/suggestions"
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <MessageSquare className="text-green-600" size={20} />
                <span className="text-sm font-medium text-gray-900">건의사항 작성</span>
              </Link>
              <Link 
                to="/schedule"
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Calendar className="text-purple-600" size={20} />
                <span className="text-sm font-medium text-gray-900">일정 관리</span>
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;