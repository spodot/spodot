export type UserRole = 'admin' | 'reception' | 'fitness' | 'tennis' | 'golf';
export type Team = 'Reception' | 'Fitness' | 'Golf' | 'Tennis';

export interface User {
  id: string;                 // UUID, Primary Key
  employeeId?: string;        // 사번 (고유할 수 있음, 선택적으로 사용)
  name: string;               // 이름
  email: string;              // 이메일 (로그인 ID, 고유)
  password?: string;           // 비밀번호 (새 사용자 생성 시 필요, 응답에는 포함되지 않음)
  role: UserRole;             // 역할 ('admin', 'staff')
  team: Team | null;          // 소속 팀 ('Reception', 'Fitness', 'Golf', 'Tennis', 또는 null)
  position: string;           // 팀 내 직급 (예: '매니저', '트레이너', '안내데스크')
  hireDate?: string;           // 입사일 (ISO 8601 date string, 예: 'YYYY-MM-DD')
  phoneNumber?: string;        // 연락처 (선택 사항)
  profileImageUrl?: string;    // 프로필 이미지 URL (선택 사항)
  isActive: boolean;          // 계정 활성 상태 (기본 true)
  createdAt: string;          // 생성 시각 (ISO 8601 datetime string)
  updatedAt: string;          // 마지막 수정 시각 (ISO 8601 datetime string)
}

// 공지사항 타입 (기존에 논의되었던 내용 유지 또는 필요시 여기에 통합)
export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO 8601 datetime string
  updatedAt: string; // ISO 8601 datetime string
  authorId?: string; // 작성자 User ID (선택 사항)
  isPublished: boolean;
}

// 작업(Task) 관련 타입 (예시, 추후 구체화)
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done' | 'archived';
  priority: 'low' | 'medium' | 'high';
  assigneeId?: string; // 담당자 User ID
  reporterId?: string; // 보고자 User ID
  dueDate?: string;    // 마감일 (ISO 8601 date string)
  createdAt: string;
  updatedAt: string;
}

// 건의사항(Suggestion) 관련 타입 (예시, 추후 구체화)
export interface Suggestion {
  id: string;
  title: string;
  content: string;
  category?: string; // 건의사항 분류 (예: '시설', '서비스', '업무개선')
  status: 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'implemented';
  submittedBy: string; // 제출자 User ID
  createdAt: string;
  updatedAt: string;
  adminComment?: string; // 관리자 답변
}
