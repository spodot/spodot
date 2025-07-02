import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Team } from '../types';
// Supabase 클라이언트 임포트
import { supabase } from '../supabaseClient';
import type { Database } from '../types/database.types';
// 권한 시스템 import
import { UserRole } from '../types/permissions';

// 사용자 성별 타입
export type Gender = 'male' | 'female' | 'other';

// 사용자 상태 타입
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended';

// 알림 유형 타입
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

// 사용자 기본 인터페이스
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileImage?: string;
  password?: string;
}

// 고객 인터페이스 (별도 관리)
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  emergencyContact?: string;
  membershipType?: string;
  membershipStart?: string;
  membershipEnd?: string;
  weight?: number;
  height?: number;
  goals?: string;
  healthNotes?: string;
  assignedTrainerId?: string;
  assignedTrainerName?: string;
}

// 트레이너 인터페이스 (별도 관리)
export interface Trainer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  dateOfBirth?: string;
  gender?: Gender;
  address?: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  schedule?: {
    monday?: { start: string; end: string };
    tuesday?: { start: string; end: string };
    wednesday?: { start: string; end: string };
    thursday?: { start: string; end: string };
    friday?: { start: string; end: string };
    saturday?: { start: string; end: string };
    sunday?: { start: string; end: string };
  };
  hourlyRate?: number;
  clientCount?: number;
  schedulePreference?: {
    availableDays: string[];
    preferredHours: {
      start: string;
      end: string;
    };
  };
  experience?: string;
}

// 직원 인터페이스 - 새로운 권한 시스템 사용
export interface Staff extends User {
  id: string;
  employeeId?: string;
  team?: Team | null;
  position?: string;
  hireDate?: string;
  department?: string;
  permissions?: string[]; // 개별 설정된 권한 배열
  name: string;
  email: string;
  phone: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  profileImage?: string;
}

// 알림 인터페이스
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

// 필터 옵션 인터페이스
interface UserFilterOptions {
  role?: UserRole | 'all' | 'trainer';
  status?: UserStatus | 'all';
  searchQuery?: string;
  trainerId?: string;
}

interface UserContextProps {
  users: User[];
  clients?: Client[];
  trainers?: Trainer[];
  staff?: Staff[];
  filteredUsers?: User[];
  notifications?: Notification[];
  unreadNotificationsCount?: number;
  loadingStaff?: boolean;
  staffError?: Error | null;

  // 필터링
  filterUsers?: (options: UserFilterOptions) => void;

  // CRUD 기능
  addUser?: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateUser?: (id: string, userData: Partial<User>) => void;
  deleteUser?: (id: string) => Promise<boolean>;
  getUserById?: (id: string) => User | undefined;

  // 고객 특정 기능
  addClient?: (client: Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => string;
  updateClient?: (id: string, clientData: Partial<Client>) => void;
  assignTrainer?: (clientId: string, trainerId: string, trainerName: string) => void;

  // 트레이너 특정 기능
  addTrainer?: (trainer: Omit<Trainer, 'id' | 'createdAt' | 'updatedAt' | 'role'>) => string;
  updateTrainer?: (id: string, trainerData: Partial<Trainer>) => void;
  getTrainerClients?: (trainerId: string) => Client[];

  // 직원 특정 기능
  addStaff?: (staff: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateStaff?: (id: string, staffData: Partial<Staff>) => Promise<boolean>;
  updatePermissions?: (id: string, permissions: string[]) => void;

  // 알림 기능
  createNotification?: (notification: Omit<Notification, 'id' | 'createdAt' | 'isRead'>) => string;
  markNotificationAsRead?: (notificationId: string) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (notificationId: string) => void;
  getUserNotifications?: (userId: string) => Notification[];
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  // 초기 사용자 목록 - 빈 배열로 시작
  const initialUsers: User[] = [];
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // 직원(Staff) 목록 상태 관리
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffError, setStaffError] = useState<Error | null>(null);

  // 트레이너 목록 상태 관리
  const [trainersList, setTrainersList] = useState<Trainer[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(true);

  useEffect(() => {
    fetchStaff();
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    setLoadingTrainers(true);
    try {
      // Supabase에서 trainers 테이블 조회
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'trainer');

      if (error) {
        console.error('Error fetching trainers:', error);
        setLoadingTrainers(false);
        return;
      }

      console.log('📋 데이터베이스에서 조회된 트레이너들:', data);

      // 데이터 형식 변환
      const transformedTrainers = data.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        status: (user.status as UserStatus) || 'active',
        createdAt: user.created_at || new Date().toISOString(),
        updatedAt: user.updated_at || new Date().toISOString(),
        specialties: ['헬스', '요가', '필라테스'], // 기본값
        hourlyRate: 50000, // 기본값
        clientCount: 0, // 기본값
        bio: '',
        certifications: [],
        experience: ''
      }));

      console.log('🔄 변환된 트레이너 데이터:', transformedTrainers);
      setTrainersList(transformedTrainers as Trainer[]);
    } catch (err) {
      console.error('트레이너 데이터 가져오기 오류:', err);
    } finally {
      setLoadingTrainers(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      setStaffError(null);
      
      console.log('📋 직원 데이터 가져오기 시작...');
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .in('role', ['admin', 'fitness', 'tennis', 'golf', 'reception'])
        .order('name');

      if (error) {
        console.error('Error fetching staff:', error);
        setStaffError(error);
        setLoadingStaff(false);
        return;
      }

      // 데이터가 null이거나 빈 배열인 경우 처리
      if (!data || !Array.isArray(data)) {
        console.warn('📋 직원 데이터가 null이거나 배열이 아닙니다:', data);
        setStaffList([]);
        setLoadingStaff(false);
        return;
      }

      console.log('📋 데이터베이스에서 조회된 사용자들:', data);

      // 데이터 형식 변환 - null 체크 강화
      const transformedStaff = data
        .filter(user => user && typeof user === 'object') // null/undefined 필터링
        .map(user => {
          try {
            return {
              id: user.id || '',
              name: user.name || '이름 없음',
              email: user.email || '',
              phone: user.phone || '',
              role: (user.role as UserRole) || 'fitness',
              status: (user.status as UserStatus) || 'active',
              department: user.department || '',
              position: user.position || '',
              permissions: Array.isArray(user.permissions) 
                ? user.permissions.filter(p => p && typeof p === 'string') as string[] 
                : [],
              createdAt: user.created_at || new Date().toISOString(),
              updatedAt: user.updated_at || new Date().toISOString(),
              lastLogin: user.last_login || undefined,
              profileImage: user.profile_image || undefined
            };
          } catch (transformError) {
            console.error('데이터 변환 중 오류:', transformError, user);
            // 변환 실패시 기본값으로 객체 생성
            return {
              id: user?.id || `error-${Date.now()}`,
              name: user?.name || '데이터 오류',
              email: user?.email || '',
              phone: '',
              role: 'fitness' as UserRole,
              status: 'inactive' as UserStatus,
              department: '',
              position: '',
              permissions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        })
        .filter(staff => staff && staff.id); // 유효한 데이터만 필터링

      console.log('🔄 변환된 직원 데이터:', transformedStaff);
      setStaffList(transformedStaff as Staff[]);
    } catch (err) {
      console.error('직원 데이터 가져오기 오류:', err);
      setStaffError(err as Error);
      // 에러 발생시 빈 배열로 설정하여 UI 깨짐 방지
      setStaffList([]);
    } finally {
      setLoadingStaff(false);
    }
  };

  // 직원 추가 함수
  const addStaffMember = async (staffData: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
      console.log('직원 추가 시도:', staffData);
      
      // 입력 데이터 유효성 검사
      if (!staffData || !staffData.name || !staffData.email) {
        console.error('필수 데이터가 누락되었습니다:', staffData);
        alert('이름과 이메일은 필수 입력 항목입니다.');
        return null;
      }
      
      // 기본 사용자 데이터 추가 - role을 그대로 사용
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            name: staffData.name,
            email: staffData.email,
            password: staffData.password || '123456', // 기본 비밀번호
            role: staffData.role || 'fitness', // 기본값 설정
            phone: staffData.phone || '',
            department: staffData.department || '',
            position: staffData.position || '',
            status: staffData.status || 'active',
            permissions: Array.isArray(staffData.permissions) ? staffData.permissions : []
          }
        ])
        .select();

      if (error) {
        console.error('직원 추가 중 오류:', error);
        const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
        alert('직원 추가 오류: ' + errorMessage);
        return null;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('직원 추가 실패: 데이터가 반환되지 않음');
        alert('직원 추가 실패: 데이터가 반환되지 않았습니다.');
        return null;
      }

      const newUserData = data[0];
      if (!newUserData || !newUserData.id) {
        console.error('직원 추가 실패: 유효하지 않은 데이터');
        alert('직원 추가 실패: 유효하지 않은 데이터가 반환되었습니다.');
        return null;
      }

      console.log('직원 추가 성공:', newUserData);
      
      // 반환된 데이터로 새 직원 정보 구성
      const newStaff = {
        ...staffData,
        id: newUserData.id,
        role: (newUserData.role as UserRole) || staffData.role || 'fitness',
        createdAt: newUserData.created_at || new Date().toISOString(),
        updatedAt: newUserData.updated_at || new Date().toISOString(),
      };

      // 상태 업데이트
      setStaffList(prevStaff => [...(prevStaff || []), newStaff as Staff]);

      // 직원 목록 새로고침
      await fetchStaff();

      // 성공 시 ID 반환
      return newUserData.id;
    } catch (err) {
      console.error('직원 추가 오류:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert('직원 추가 오류: ' + errorMessage);
      return null;
    }
  };

  // 직원 수정 함수
  const updateStaffMember = async (id: string, staffData: Partial<Staff>): Promise<boolean> => {
    try {
      // 입력 데이터 유효성 검사
      if (!id || !staffData) {
        console.error('필수 데이터가 누락되었습니다:', { id, staffData });
        alert('직원 ID와 수정할 데이터가 필요합니다.');
        return false;
      }

      // Supabase에 업데이트
      const updateData: any = {};
      
      // null이 아닌 값만 업데이트 데이터에 포함
      if (staffData.name !== undefined) updateData.name = staffData.name;
      if (staffData.email !== undefined) updateData.email = staffData.email;
      if (staffData.phone !== undefined) updateData.phone = staffData.phone;
      if (staffData.role !== undefined) updateData.role = staffData.role;
      if (staffData.status !== undefined) updateData.status = staffData.status;
      if (staffData.department !== undefined) updateData.department = staffData.department;
      if (staffData.position !== undefined) updateData.position = staffData.position;
      if (staffData.permissions !== undefined) {
        updateData.permissions = Array.isArray(staffData.permissions) ? staffData.permissions : [];
      }
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('직원 업데이트 오류:', error);
        const errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
        alert('직원 업데이트 오류: ' + errorMessage);
        return false;
      }

      // 로컬 상태 업데이트
      setStaffList(prevStaff => {
        if (!Array.isArray(prevStaff)) return [];
        
        return prevStaff.map(staff => 
          staff && staff.id === id 
            ? { ...staff, ...staffData, updatedAt: new Date().toISOString() } 
            : staff
        ).filter(staff => staff); // null/undefined 제거
      });

      // 직원 목록 새로고침
      await fetchStaff();

      return true;
    } catch (err) {
      console.error('직원 수정 오류:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert('직원 수정 오류: ' + errorMessage);
      return false;
    }
  };

  // 직원 삭제 함수
  const deleteStaffMember = async (id: string): Promise<boolean> => {
    try {
      console.log('직원 삭제 시도:', id);
      
      // 1. 먼저 해당 직원에게 할당된 모든 tasks의 assigned_to를 null로 설정
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ assigned_to: null })
        .eq('assigned_to', id);

      if (tasksError) {
        console.error('업무 재할당 오류:', tasksError);
        const errorMessage = tasksError.message || '업무 재할당 중 오류가 발생했습니다.';
        alert('직원 삭제 오류 (업무 재할당): ' + errorMessage);
        return false;
      }

      console.log('해당 직원의 업무 재할당 완료');

      // 2. 직원의 상태를 먼저 inactive로 변경 (soft delete 방식)
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('직원 상태 업데이트 오류:', updateError);
        const errorMessage = updateError.message || '직원 상태 업데이트 중 오류가 발생했습니다.';
        alert('직원 삭제 오류 (상태 업데이트): ' + errorMessage);
        return false;
      }

      console.log('직원 상태 비활성화 완료');

      // 3. 실제 데이터베이스에서 삭제 시도
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('직원 삭제 오류:', deleteError);
        // 삭제에 실패하면 상태만 비활성화된 상태로 유지
        console.log('데이터베이스 삭제 실패, 상태만 비활성화로 유지');
        alert('직원이 비활성화되었습니다. (데이터베이스 제약조건으로 인해 완전 삭제는 불가)');
      } else {
        console.log('직원 삭제 성공:', id);
        alert('직원이 성공적으로 삭제되었습니다.');
      }

      // 4. 로컬 상태에서 제거
      setStaffList(prevStaff => prevStaff.filter(staff => staff.id !== id));
      
      // 5. 직원 목록 새로고침
      await fetchStaff();
      
      return true;
    } catch (err) {
      console.error('직원 삭제 오류:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert('직원 삭제 오류: ' + errorMessage);
      return false;
    }
  };

  // 권한 업데이트 함수
  const updatePermission = (id: string, permissions: string[]) => {
    setStaffList(prevStaff => prevStaff.map(staff => 
      staff.id === id ? { ...staff, permissions } : staff
    ));
  };

  // 사용자 필터링 함수
  const filterUsers = (options: UserFilterOptions) => {
    try {
      // 옵션이 null이거나 undefined인 경우 처리
      const safeOptions = options || {};
      const { role, status, searchQuery, trainerId } = safeOptions;

      let filtered = [...(staffList || [])]; // staffList 사용 (Staff 타입)

      // 역할 필터링 (트레이너 포함)
      if (role && role !== 'all') {
        if (role === 'trainer') {
          // 트레이너 역할 필터링 - fitness 역할 중 트레이너 직책을 가진 사용자
          filtered = filtered.filter(staff => 
            staff && 
            staff.role === 'fitness' && 
            staff.position && 
            staff.position.includes('트레이너')
          );
        } else {
          filtered = filtered.filter(staff => staff && staff.role === role);
        }
      }

      // 상태 필터링
      if (status && status !== 'all') {
        filtered = filtered.filter(staff => staff && staff.status === status);
      }

      // 검색 쿼리 필터링
      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(staff => 
          staff && (
            (staff.name && staff.name.toLowerCase().includes(query)) ||
            (staff.email && staff.email.toLowerCase().includes(query)) ||
            (staff.phone && staff.phone.includes(query))
          )
        );
      }

      // null/undefined 값 제거
      filtered = filtered.filter(staff => staff && staff.id);

      // User 타입으로 변환하여 설정
      const userFiltered = filtered.map(staff => ({
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        role: staff.role,
        status: staff.status,
        createdAt: staff.createdAt,
        updatedAt: staff.updatedAt,
        lastLogin: staff.lastLogin,
        profileImage: staff.profileImage
      }));

      setFilteredUsers(userFiltered);
    } catch (err) {
      console.error('사용자 필터링 중 오류:', err);
      // 에러 발생시 빈 배열로 설정
      setFilteredUsers([]);
    }
  };

  return (
    <UserContext.Provider
      value={{
        users,
        staff: staffList,
        trainers: trainersList,
        filteredUsers,
        loadingStaff,
        staffError,
        // 직원 관련 함수
        addStaff: addStaffMember,
        updateStaff: updateStaffMember,
        deleteUser: deleteStaffMember,
        updatePermissions: updatePermission,
        // 필터링 함수
        filterUsers,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser는 UserProvider 내부에서 사용해야 합니다');
  }
  return context;
}