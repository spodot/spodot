import { supabase } from '../lib/supabase';
import { Member } from '../types';

// 모든 회원 조회
export const getAllMembers = async (): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*, membership_types(name), trainers(first_name, last_name)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('회원 목록 조회 에러:', error);
    throw error;
  }

  return data || [];
};

// 회원 상세 조회
export const getMemberById = async (id: string): Promise<Member | null> => {
  const { data, error } = await supabase
    .from('members')
    .select('*, membership_types(name), trainers(first_name, last_name)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('회원 상세 조회 에러:', error);
    throw error;
  }

  return data;
};

// 회원 등록
export const createMember = async (memberData: Omit<Member, 'id' | 'created_at' | 'updated_at'>): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .insert([memberData])
    .select()
    .single();

  if (error) {
    console.error('회원 등록 에러:', error);
    throw error;
  }

  return data;
};

// 회원 정보 수정
export const updateMember = async (id: string, memberData: Partial<Member>): Promise<Member> => {
  const { data, error } = await supabase
    .from('members')
    .update(memberData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('회원 정보 수정 에러:', error);
    throw error;
  }

  return data;
};

// 회원 삭제
export const deleteMember = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('회원 삭제 에러:', error);
    throw error;
  }
};

// 회원 검색
export const searchMembers = async (query: string): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*, membership_types(name), trainers(first_name, last_name)')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('회원 검색 에러:', error);
    throw error;
  }

  return data || [];
};

// 회원 상태별 조회
export const getMembersByStatus = async (status: string): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*, membership_types(name), trainers(first_name, last_name)')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('회원 상태별 조회 에러:', error);
    throw error;
  }

  return data || [];
};

// 회원권 타입별 조회
export const getMembersByMembershipType = async (membershipTypeId: string): Promise<Member[]> => {
  const { data, error } = await supabase
    .from('members')
    .select('*, membership_types(name), trainers(first_name, last_name)')
    .eq('membership_type', membershipTypeId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('회원권 타입별 조회 에러:', error);
    throw error;
  }

  return data || [];
};

// 회원 통계 조회
export const getMembersStats = async (): Promise<any> => {
  // 활성 회원 수
  const { count: activeCount, error: activeError } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // 총 회원 수
  const { count: totalCount, error: totalError } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true });

  // 이번 달 신규 회원 수
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
  const { count: newCount, error: newError } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .gte('join_date', firstDayOfMonth);

  if (activeError || totalError || newError) {
    console.error('회원 통계 조회 에러:', activeError || totalError || newError);
    throw activeError || totalError || newError;
  }

  return {
    active: activeCount,
    total: totalCount,
    new: newCount
  };
}; 