import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 회원 타입 정의
export interface Member {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  join_date: string;
  membership_type: string;
  status: 'active' | 'inactive' | 'pending' | 'expired';
  created_at?: string;
  updated_at?: string;
}

interface MemberContextProps {
  members: Member[];
  loading: boolean;
  error: string | null;
  fetchMembers: () => Promise<void>;
  addMember: (member: Omit<Member, 'id'>) => Promise<{ data: Member | null; error: Error | null }>;
  updateMember: (id: string, member: Partial<Member>) => Promise<{ data: Member | null; error: Error | null }>;
  deleteMember: (id: string) => Promise<{ error: Error | null }>;
}

const MemberContext = createContext<MemberContextProps | undefined>(undefined);

export function MemberProvider({ children }: { children: ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 회원 목록 가져오기
  const fetchMembers = async () => {
    setLoading(true);
    try {
      // Supabase에서 데이터 가져오기 (더미 데이터로 대체)
      // const { data, error } = await supabase.from('members').select('*');

      // 더미 데이터
      const dummyMembers: Member[] = [
        {
          id: '1',
          first_name: '김',
          last_name: '철수',
          email: 'chulsoo@example.com',
          phone: '010-1234-5678',
          join_date: '2023-01-15',
          membership_type: '1년 정기권',
          status: 'active'
        },
        {
          id: '2',
          first_name: '이',
          last_name: '영희',
          email: 'younghee@example.com',
          phone: '010-8765-4321',
          join_date: '2023-02-20',
          membership_type: '6개월 정기권',
          status: 'active'
        },
        {
          id: '3',
          first_name: '박',
          last_name: '민수',
          email: 'minsu@example.com',
          phone: '010-5555-7777',
          join_date: '2023-03-10',
          membership_type: '3개월 정기권',
          status: 'inactive'
        }
      ];

      setMembers(dummyMembers);
      setError(null);
    } catch (err) {
      console.error('회원 목록 가져오기 오류:', err);
      // setError('회원 목록을 불러오는데 실패했습니다.'); // 초기 로딩 에러 메시지 제거
      setError(null); // 에러 상태 초기화
    } finally {
      setLoading(false);
    }
  };

  // 처음 로드 시 회원 목록 가져오기
  useEffect(() => {
    fetchMembers();
  }, []);

  // 회원 추가
  const addMember = async (member: Omit<Member, 'id'>) => {
    try {
      // 실제 구현에서는 Supabase를 이용해 데이터 추가
      // const { data, error } = await supabase.from('members').insert(member).select('*').single();
      
      // 더미 구현
      const newMember = {
        id: String(members.length + 1),
        ...member
      };
      
      setMembers([...members, newMember]);
      return { data: newMember, error: null };
    } catch (error) {
      console.error('회원 추가 오류:', error);
      return { data: null, error: error as Error };
    }
  };

  // 회원 업데이트
  const updateMember = async (id: string, updates: Partial<Member>) => {
    try {
      // 실제 구현에서는 Supabase를 이용해 데이터 업데이트
      // const { data, error } = await supabase.from('members').update(updates).eq('id', id).select('*').single();
      
      // 더미 구현
      const updatedMembers = members.map(member => 
        member.id === id ? { ...member, ...updates } : member
      );
      
      const updatedMember = updatedMembers.find(member => member.id === id) || null;
      setMembers(updatedMembers);
      
      return { data: updatedMember, error: null };
    } catch (error) {
      console.error('회원 업데이트 오류:', error);
      return { data: null, error: error as Error };
    }
  };

  // 회원 삭제
  const deleteMember = async (id: string) => {
    try {
      // 실제 구현에서는 Supabase를 이용해 데이터 삭제
      // const { error } = await supabase.from('members').delete().eq('id', id);
      
      // 더미 구현
      setMembers(members.filter(member => member.id !== id));
      
      return { error: null };
    } catch (error) {
      console.error('회원 삭제 오류:', error);
      return { error: error as Error };
    }
  };

  return (
    <MemberContext.Provider 
      value={{ 
        members, 
        loading, 
        error, 
        fetchMembers, 
        addMember, 
        updateMember, 
        deleteMember 
      }}
    >
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (context === undefined) {
    throw new Error('useMember는 MemberProvider 내부에서 사용해야 합니다');
  }
  return context;
} 