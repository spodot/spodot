// 사용자 역할 정의 (부서별)
export type UserRole = 'admin' | 'reception' | 'fitness' | 'tennis' | 'golf';

// 세부 직책 정의 (각 부서에서 사용 가능)
export type UserPosition = 
  | '팀장' | '부팀장' | '매니저' | '과장'
  | '시니어 트레이너' | '트레이너' | '퍼스널 트레이너' | '인턴 트레이너'
  | '리셉션 매니저' | '리셉션 직원'
  | '코치' | '테니스 코치' | '어시스턴트 코치'
  | '프로' | '골프 프로' | '어시스턴트 프로'
  | '사원' | '인턴';

// 회원 타입 정의
export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  emergency_contact?: string;
  join_date: string;
  membership_type: string;
  membership_start?: string;
  membership_end?: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  trainer_id?: string;
  notes?: string;
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

// 회원권 타입 정의
export interface MembershipType {
  id: string;
  name: string;
  description: string;
  duration_months: number;
  price: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 트레이너 타입 정의
export interface Trainer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialization: string[];
  bio?: string;
  certification?: string[];
  working_hours?: {
    days: string[];
    start_time: string;
    end_time: string;
  };
  status: 'active' | 'inactive';
  profile_image?: string;
  created_at: string;
  updated_at: string;
}

// 예약 타입 정의
export interface Appointment {
  id: string;
  member_id: string;
  trainer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  type: 'personal' | 'group' | 'assessment';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 결제 타입 정의
export interface Payment {
  id: string;
  member_id: string;
  amount: number;
  payment_date: string;
  payment_method: 'card' | 'cash' | 'bank_transfer' | 'other';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  invoice_number?: string;
  created_at: string;
  updated_at: string;
}

// 수업 유형 정의
export interface ClassType {
  id: string;
  name: string;
  description: string;
  duration: number; // 분 단위
  capacity: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all-levels';
  category: string;
  color: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 수업 일정 정의
export interface ClassSchedule {
  id: string;
  class_type_id: string;
  trainer_id: string;
  room_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  enrolled_count: number;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// 회원 수업 등록 정의
export interface ClassEnrollment {
  id: string;
  class_schedule_id: string;
  member_id: string;
  status: 'enrolled' | 'attended' | 'no-show' | 'cancelled';
  enrollment_date: string;
  payment_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// PT 세션 정의
export interface PTSession {
  id: string;
  member_id: string;
  trainer_id: string;
  date: string;
  start_time: string;
  end_time: string;
  location?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  feedback?: string;
  created_at: string;
  updated_at: string;
}

// 시설/방 정의
export interface Room {
  id: string;
  name: string;
  capacity: number;
  description?: string;
  equipment?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 첨부파일 타입 정의
export interface Attachment {
  name: string; // 파일명
  url: string;  // 파일 URL
  type?: string; // mime type (image/png 등)
}

// 공지사항 타입 정의
export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  expiryDate?: string;
  endDate?: string; // 만료일 (expiryDate와 동일한 의미)
  category?: string; // 카테고리
  isPinned: boolean;
  isActive: boolean;
  targetRoles: string[];
  readBy: string[];
  createdAt: string;
  updatedAt: string;
  showInBanner?: boolean;
  attachments?: {
    id: string;
    name: string;
    url: string;
    size: number;
  }[];
  images?: {
    id: string;
    name: string;
    url: string;
    size: number;
    uploadedAt: string;
  }[];
}

// 공통 타입 정의 - 새로운 부서별 역할 시스템 사용
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  position?: UserPosition;
  avatar?: string;
  team?: string;
  isActive?: boolean;
  permissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  assigneeName: string;
  assignerId: string;
  assignerName: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  category: string;
  tags: string[];
  comments: TaskComment[];
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface DailyReport {
  id: string;
  authorId: string;
  authorName: string;
  date: string;
  tasks: {
    id: string;
    title: string;
    status: 'completed' | 'in_progress' | 'pending';
    description: string;
  }[];
  issues: string;
  tomorrow: string;
  images: {
    id: string;
    url: string;
    name: string;
    description?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface Manual {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  isPublished: boolean;
  version: number;
  lastEditedBy?: string;
}

export interface SalesEntry {
  id: string;
  date: string;
  authorId: string;
  authorName: string;
  revenue: number;
  membershipSales: number;
  ptSales: number;
  supplySales: number;
  vendingSales: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  membershipType: 'basic' | 'premium' | 'vip';
  membershipStart: string;
  membershipEnd: string;
  status: 'active' | 'expired' | 'suspended';
  personalTrainer?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Suggestion {
  id: string;
  title: string;
  content: string;
  category: 'facility' | 'service' | 'program' | 'other';
  authorId: string;
  authorName: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'implemented';
  priority: 'low' | 'medium' | 'high';
  adminResponse?: string;
  adminResponseBy?: string;
  adminResponseAt?: string;
  createdAt: string;
  updatedAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 필터 및 검색 타입
export interface FilterOptions {
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  authorId?: string;
  tags?: string[];
}

// 통계 타입
export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  totalUsers: number;
  activeCustomers: number;
  monthlyRevenue: number;
  dailyReports: number;
  announcements: number;
  suggestions: number;
}

// 알림 타입
export interface Notification {
  id: string;
  type: 'task' | 'announcement' | 'suggestion' | 'system';
  title: string;
  message: string;
  userId: string;
  isRead: boolean;
  relatedId?: string; // 관련 데이터의 ID
  relatedType?: 'task' | 'announcement' | 'suggestion';
  createdAt: string;
}