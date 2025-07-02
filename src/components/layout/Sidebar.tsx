import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PermissionGate, { AdminOnly, OperationTeam, CanCreateTasks, CanViewAllTasks, CanManageUsers, CanManageAnnouncements, CanManageMembers } from '@/components/auth/PermissionGate';
import { departmentNames } from '@/types/permissions';
import { 
  Briefcase, 
  LayoutDashboard, 
  ListChecks, 
  List, 
  FileText, 
  MessageSquare, 
  Megaphone, 
  BookOpen,
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  Users,
  ClipboardList,
  Archive,
  Phone,
  CalendarDays,
  UserCheck,
  TrendingUp,
  CreditCard,
  Dumbbell,
  Coffee,
  PieChart,
  Clock,
  Shield
} from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';

type SidebarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  isMobile: boolean;
};

interface MenuBadgeProps {
  count: number;
}

function MenuBadge({ count }: MenuBadgeProps) {
  if (count === 0) return null;
  
  return (
    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}

interface SidebarLinkProps {
  name: string;
  path: string;
  icon: JSX.Element;
  badge: number;
  open: boolean;
  isMobile: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarLink = ({ name, path, icon, badge, open, isMobile, setOpen }: SidebarLinkProps) => {
  const navigate = useNavigate();
  
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        clsx(
          'flex items-center px-4 py-3 rounded-lg transition-colors',
          isActive
            ? 'bg-primary text-white'
            : 'hover:bg-indigo-900/30 text-indigo-100',
          !open && 'justify-center px-2'
        )
      }
      onClick={(e) => {
        if (isMobile) {
          e.preventDefault();
          setOpen(false);
          setTimeout(() => {
            navigate(path);
          }, 10);
        }
      }}
      title={!open ? name : ''}
    >
      <span className={clsx(!open && 'mr-0', open && 'mr-3')}>{icon}</span>
      {open && <span className="truncate">{name}</span>}
      <MenuBadge count={badge} />
    </NavLink>
  );
};

interface AccordionHeaderProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  open: boolean;
}

const AccordionHeader = ({ title, isExpanded, onToggle, open }: AccordionHeaderProps) => {
  if (!open) return null;
  
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between mt-4 mb-2 px-4 py-2 hover:bg-indigo-900/30 rounded-lg transition-colors"
    >
      <h3 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
        {title}
      </h3>
      <ChevronDown 
        size={16} 
        className={clsx(
          'text-indigo-300 transition-transform duration-200',
          isExpanded ? 'rotate-0' : '-rotate-90'
        )}
      />
    </button>
  );
};

const Sidebar = ({ open, setOpen, isMobile }: SidebarProps) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { badges } = useNotification();
  
  // 아코디언 상태 관리
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    sales: true,
    operations: true,
    system: true
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div
      className={clsx(
        'fixed inset-y-0 left-0 z-50 bg-indigo-900 text-white transform',
        'flex flex-col overflow-hidden shadow-xl',
        'transition-all duration-300 ease-in-out',
        isMobile
          ? open
            ? 'w-[80%] min-w-[260px] max-w-[300px] translate-x-0'
            : 'w-0 -translate-x-full'
          : open
            ? 'w-64'
            : 'w-20'
      )}
      style={{
        willChange: 'transform',
        touchAction: 'manipulation'
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-indigo-800">
        <div className="flex items-center overflow-hidden">
          {open && <span className="font-bold text-lg whitespace-nowrap overflow-hidden">스포닷 업무 관리</span>}
        </div>
        <button 
          onClick={() => setOpen(!open)}
          className="flex-shrink-0 text-indigo-300 hover:text-white transition-colors hidden lg:flex"
        >
          {open ? 
            <ChevronLeft size={24} /> : 
            <ChevronRight size={24} />
          }
        </button>
      </div>

      <div className="py-4 flex-1 overflow-y-auto">
        {open ? (
          <div className="px-4 mb-6">
            <div className="flex items-center px-2 py-3 rounded-lg bg-indigo-800/50">
              <div className="ml-0 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-indigo-300">
                    {user?.role ? departmentNames[user.role] : '기타'}
                  </p>
                  {user?.position && (
                    <>
                      <span className="text-xs text-indigo-400">•</span>
                      <p className="text-xs text-yellow-300">{user.position}</p>
                    </>
                  )}
                </div>

              </div>
            </div>
          </div>
        ) : (
          <div className="px-2 mb-6 flex justify-center"></div>
        )}

        <nav className="px-2 space-y-1">
          {/* 일반 메뉴 */}
          <AccordionHeader 
            title="일반 메뉴"
            isExpanded={expandedSections.general}
            onToggle={() => toggleSection('general')}
            open={open}
          />
          
          {expandedSections.general && (
            <>
              {/* 대시보드 - 모든 사용자 */}
              <SidebarLink 
                name="대시보드" 
                path="/" 
                icon={<LayoutDashboard size={22} />} 
                badge={0}
                open={open}
                isMobile={isMobile}
                setOpen={setOpen}
              />

              {/* 내 업무 - 업무 관련 권한이 있는 사용자 */}
              <PermissionGate permission="tasks.view_assigned">
                <SidebarLink 
                  name="내 업무" 
                  path="/my-tasks" 
                  icon={<ListChecks size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 팀 업무 보기 - 팀 업무 조회 권한이 있는 사용자 */}
              <PermissionGate permission="tasks.view_department">
                <SidebarLink 
                  name="팀 업무 보기" 
                  path="/all-tasks" 
                  icon={<List size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 일일 업무 보고 - 보고서 작성 권한이 있는 사용자 */}
              <PermissionGate permission="reports.create">
                <SidebarLink 
                  name="일일 업무 보고" 
                  path="/daily-report" 
                  icon={<FileText size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 일정 관리 - 일정 조회 권한이 있는 사용자 */}
              <PermissionGate permission={['schedules.view_all', 'schedules.view_department', 'schedules.view_own']}>
                <SidebarLink 
                  name="일정 관리" 
                  path="/schedule" 
                  icon={<Clock size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 공지사항 */}
              <PermissionGate permission="announcements.read">
                <SidebarLink 
                  name="공지사항" 
                  path="/announcements" 
                  icon={<Megaphone size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 매뉴얼 */}
              <PermissionGate permission="manuals.read">
                <SidebarLink 
                  name="매뉴얼" 
                  path="/manuals" 
                  icon={<BookOpen size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 건의사항 */}
              <PermissionGate permission="suggestions.create">
                <SidebarLink 
                  name="건의사항" 
                  path="/suggestions" 
                  icon={<MessageSquare size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>
            </>
          )}

          {/* 매출 관리 */}
          <AccordionHeader 
            title="매출 관리"
            isExpanded={expandedSections.sales}
            onToggle={() => toggleSection('sales')}
            open={open}
          />
          
          {expandedSections.sales && (
            <>
              {/* 매출 등록 */}
              <PermissionGate permission="sales.create">
                <SidebarLink 
                  name="매출 등록" 
                  path="/sales-entry" 
                  icon={<span className="text-xl font-bold">₩</span>} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 매출보고 작성 */}
              <PermissionGate permission="sales.view_department">
                <SidebarLink 
                  name="매출보고 작성" 
                  path="/sales-report-create" 
                  icon={<FileText size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 매출 보고서 */}
              <PermissionGate permission="sales.view_own">
                <SidebarLink 
                  name="매출 보고서" 
                  path="/sales-report-user" 
                  icon={<TrendingUp size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>

              {/* 자판기 관리 */}
              <PermissionGate permission="vending.view_own">
                <SidebarLink 
                  name="자판기 관리" 
                  path="/vending-sales" 
                  icon={<Coffee size={22} />} 
                  badge={0}
                  open={open}
                  isMobile={isMobile}
                  setOpen={setOpen}
                />
              </PermissionGate>
            </>
          )}

          {/* 운영 관리 */}
          <PermissionGate permission={['members.view_department', 'customers.view_all', 'trainers.view_all']}>
            <AccordionHeader 
              title="운영 관리"
              isExpanded={expandedSections.operations}
              onToggle={() => toggleSection('operations')}
              open={open}
            />
            
            {expandedSections.operations && (
              <>
                {/* 회원 관리 */}
                <PermissionGate permission="members.view_department">
                  <SidebarLink 
                    name="회원 관리" 
                    path="/members" 
                    icon={<Users size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 고객 관리 */}
                <PermissionGate permission="customers.view_all">
                  <SidebarLink 
                    name="고객 관리" 
                    path="/customers" 
                    icon={<ClipboardList size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 트레이너 관리 */}
                <PermissionGate permission="trainers.view_all">
                  <SidebarLink 
                    name="트레이너 관리" 
                    path="/trainers" 
                    icon={<UserCheck size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* OT 배정 */}
                <PermissionGate permission="ot.view_assigned">
                  <SidebarLink 
                    name="OT 배정" 
                    path="/ot-assignment" 
                    icon={<Dumbbell size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 이용권 관리 */}
                <PermissionGate permission="pass.view_all">
                  <SidebarLink 
                    name="이용권 관리" 
                    path="/pass-management" 
                    icon={<CreditCard size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>
              </>
            )}
          </PermissionGate>

          {/* 시스템 관리 */}
          <PermissionGate permission={['users.view_all', 'admin.task_management', 'admin.announcements', 'admin.reports', 'admin.suggestions']}>
            <AccordionHeader 
              title="시스템 관리"
              isExpanded={expandedSections.system}
              onToggle={() => toggleSection('system')}
              open={open}
            />
            
            {expandedSections.system && (
              <>
                {/* 직원 관리 */}
                <PermissionGate permission="users.view_all">
                  <SidebarLink 
                    name="직원 관리" 
                    path="/admin/staff" 
                    icon={<Users size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 업무 관리 */}
                <PermissionGate permission="admin.task_management">
                  <SidebarLink 
                    name="업무 관리" 
                    path="/admin/tasks" 
                    icon={<ListChecks size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 공지사항 관리 */}
                <PermissionGate permission="admin.announcements">
                  <SidebarLink 
                    name="공지사항 관리" 
                    path="/admin/announcements" 
                    icon={<Megaphone size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 보고서 관리 */}
                <PermissionGate permission="admin.reports">
                  <SidebarLink 
                    name="보고서 관리" 
                    path="/admin/reports" 
                    icon={<FileText size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 건의사항 관리 */}
                <PermissionGate permission="admin.suggestions">
                  <SidebarLink 
                    name="건의사항 관리" 
                    path="/admin/suggestions" 
                    icon={<MessageSquare size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>

                {/* 시스템 설정 */}
                <PermissionGate permission="users.view_all">
                  <SidebarLink 
                    name="시스템 설정" 
                    path="/admin-settings" 
                    icon={<Archive size={22} />} 
                    badge={0}
                    open={open}
                    isMobile={isMobile}
                    setOpen={setOpen}
                  />
                </PermissionGate>
              </>
            )}
          </PermissionGate>

          {/* 권한 테스트 (개발용) */}
          <SidebarLink 
            name="권한 테스트" 
            path="/permission-test" 
            icon={<Shield size={22} />} 
            badge={0}
            open={open}
            isMobile={isMobile}
            setOpen={setOpen}
          />
        </nav>

        {/* 로그아웃 버튼 */}
        <div className="mt-auto p-4 border-t border-indigo-800">
          <button
            onClick={logout}
            className={clsx(
              'flex items-center w-full px-4 py-3 text-indigo-100 hover:bg-indigo-900/30 rounded-lg transition-colors',
              !open && 'justify-center px-2'
            )}
            title={!open ? '로그아웃' : ''}
          >
            <LogOut size={22} className={clsx(!open && 'mr-0', open && 'mr-3')} />
            {open && <span>로그아웃</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;