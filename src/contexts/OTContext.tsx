import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface OTMember {
  id: number;
  name: string;
  phone: string;
  email?: string;
  registeredAt: string;
  status: 'pending' | 'assigned' | 'completed';
  preferredDays?: string[];
  preferredTimes?: string[];
  notes?: string;
  otCount: number;
  totalSessions?: number;
  assignedStaffId?: string;
}

export interface OTProgress {
  id: string;
  memberId: number;
  staffId: number;
  totalSessions: number;
  completedSessions: number;
  contactMade: boolean;
  contactDate?: string;
  contactNotes?: string;
  sessions: {
    id: string;
    date: string;
    time: string;
    completed: boolean;
    notes?: string;
  }[];
}

interface OTContextType {
  otMembers: OTMember[];
  otProgress: { [key: string]: OTProgress };
  loading: boolean;
  error: string | null;
  addOTMember: (member: Omit<OTMember, 'id' | 'registeredAt'>) => Promise<number | null>;
  updateOTMember: (id: number, updates: Partial<OTMember>) => Promise<boolean>;
  deleteOTMember: (id: number) => Promise<boolean>;
  updateProgress: (progressId: string, updates: Partial<OTProgress>) => Promise<boolean>;
  addProgress: (memberId: number, staffId: number, totalSessions: number) => Promise<string | null>;
  addSession: (progressId: string, session: Omit<OTProgress['sessions'][0], 'id'>) => Promise<string | null>;
  updateSession: (progressId: string, sessionId: string, updates: Partial<OTProgress['sessions'][0]>) => Promise<boolean>;
  fetchOTMembers: () => Promise<void>;
  fetchOTProgress: () => Promise<void>;
}

const OTContext = createContext<OTContextType | undefined>(undefined);

// 초기 데이터
const INITIAL_OT_MEMBERS: OTMember[] = [
  { 
    id: 1, 
    name: '김철수', 
    phone: '010-1111-2222',
    email: 'kim@example.com',
    registeredAt: '2024-01-15', 
    status: 'pending',
    preferredDays: ['월요일', '수요일', '금요일'],
    preferredTimes: ['오후 2시-4시'],
    notes: '무릎 부상 있음, 강도 조절 필요',
    otCount: 8,
    totalSessions: 8
  },
  { 
    id: 2, 
    name: '박지민', 
    phone: '010-3333-4444',
    email: 'park@example.com',
    registeredAt: '2024-01-20', 
    status: 'assigned',
    preferredDays: ['화요일', '목요일'],
    preferredTimes: ['저녁 7시-9시'],
    notes: '직장인, 저녁 시간대만 가능',
    otCount: 8,
    totalSessions: 8,
    assignedStaffId: '1'
  },
  { 
    id: 3, 
    name: '이영희', 
    phone: '010-5555-6666',
    email: 'lee@example.com',
    registeredAt: '2024-01-25', 
    status: 'pending',
    preferredDays: ['평일'],
    preferredTimes: ['오전 10시-12시'],
    notes: '주부, 오전 시간대 선호',
    otCount: 12,
    totalSessions: 12
  },
  { 
    id: 4, 
    name: '정우성', 
    phone: '010-7777-8888',
    email: 'jung@example.com',
    registeredAt: '2024-02-01', 
    status: 'completed',
    preferredDays: ['주말'],
    preferredTimes: ['오후 1시-3시'],
    notes: '주말만 가능',
    otCount: 12,
    totalSessions: 12,
    assignedStaffId: '2'
  },
  { 
    id: 5, 
    name: '김지연', 
    phone: '010-9999-0000',
    email: 'kimj@example.com',
    registeredAt: '2024-02-05', 
    status: 'pending',
    preferredDays: ['목요일', '토요일'],
    preferredTimes: ['저녁 6시-8시'],
    notes: '학생, 저녁 시간대 선호',
    otCount: 6,
    totalSessions: 6
  },
];



const INITIAL_PROGRESS: { [key: string]: OTProgress } = {
  '2-1': {
    id: '2-1',
    memberId: 2,
    staffId: 1,
    totalSessions: 8,
    completedSessions: 3,
    contactMade: true,
    contactDate: '2024-01-21',
    contactNotes: '첫 상담 완료, 화목 저녁 시간으로 일정 확정',
    sessions: [
      { id: '1', date: '2024-01-23', time: '19:00', completed: true, notes: '기초 체력 측정' },
      { id: '2', date: '2024-01-25', time: '19:00', completed: true, notes: '상체 운동 위주' },
      { id: '3', date: '2024-01-30', time: '19:00', completed: true, notes: '하체 운동 진행' },
      { id: '4', date: '2024-02-01', time: '19:00', completed: false },
      { id: '5', date: '2024-02-06', time: '19:00', completed: false },
    ]
  },
  '4-2': {
    id: '4-2',
    memberId: 4,
    staffId: 2,
    totalSessions: 12,
    completedSessions: 12,
    contactMade: true,
    contactDate: '2024-02-02',
    contactNotes: '주말 오후 시간으로 일정 조율 완료',
    sessions: []
  }
};

export const OTProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [otMembers, setOtMembers] = useState<OTMember[]>([]);
  const [otProgress, setOtProgress] = useState<{ [key: string]: OTProgress }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 localStorage 데이터를 Supabase로 마이그레이션
  const migrateLocalStorageData = useCallback(async () => {
    const savedMembers = localStorage.getItem('otMembers');
    const savedProgress = localStorage.getItem('otProgress');
    
    try {
      // OT 멤버 마이그레이션
      if (savedMembers) {
        const localMembers: OTMember[] = JSON.parse(savedMembers);
        console.log(`📦 로컬 스토리지에서 ${localMembers.length}개의 OT 멤버를 발견했습니다.`);
        
        if (localMembers.length > 0) {
          // 기존 Supabase 데이터 확인
          const { data: existingMembers } = await supabase
            .from('ot_members')
            .select('id')
            .limit(1);

          if (!existingMembers || existingMembers.length === 0) {
            let migratedCount = 0;
            for (const localMember of localMembers) {
              try {
                const { error: insertError } = await supabase
                  .from('ot_members')
                  .insert({
                    name: localMember.name,
                    phone: localMember.phone,
                    email: localMember.email,
                    registered_at: localMember.registeredAt,
                    status: localMember.status,
                    preferred_days: localMember.preferredDays,
                    preferred_times: localMember.preferredTimes,
                    notes: localMember.notes,
                    ot_count: localMember.otCount,
                    total_sessions: localMember.totalSessions,
                    assigned_staff_id: localMember.assignedStaffId
                  });

                if (!insertError) {
                  migratedCount++;
                }
              } catch (err) {
                console.error(`OT 멤버 "${localMember.name}" 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 OT 멤버가 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem('otMembers');
      }

      // OT 진행 상황 마이그레이션
      if (savedProgress) {
        const localProgress: { [key: string]: any } = JSON.parse(savedProgress);
        console.log(`📦 로컬 스토리지에서 ${Object.keys(localProgress).length}개의 OT 진행상황을 발견했습니다.`);
        
        if (Object.keys(localProgress).length > 0) {
          // 기존 Supabase 데이터 확인
          const { data: existingProgress } = await supabase
            .from('ot_progress')
            .select('id')
            .limit(1);

          if (!existingProgress || existingProgress.length === 0) {
            let migratedCount = 0;
            for (const [key, progress] of Object.entries(localProgress)) {
              try {
                const { error: insertError } = await supabase
                  .from('ot_progress')
                  .insert({
                    member_id: progress.memberId,
                    staff_id: progress.staffId,
                    total_sessions: progress.totalSessions,
                    completed_sessions: progress.completedSessions,
                    contact_made: progress.contactMade,
                    contact_date: progress.contactDate,
                    contact_notes: progress.contactNotes
                  });

                if (!insertError) {
                  migratedCount++;
                }
              } catch (err) {
                console.error(`OT 진행상황 "${key}" 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 OT 진행상황이 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem('otProgress');
      }
      
    } catch (err) {
      console.error('OT 데이터 마이그레이션 실패:', err);
    }
  }, []);

  // Supabase에서 OTMember 데이터를 가져와서 내부 인터페이스로 변환
  const convertSupabaseOTMemberToOTMember = (supabaseOTMember: any): OTMember => {
    return {
      id: supabaseOTMember.id,
      name: supabaseOTMember.name,
      phone: supabaseOTMember.phone,
      email: supabaseOTMember.email,
      registeredAt: supabaseOTMember.registered_at,
      status: supabaseOTMember.status,
      preferredDays: supabaseOTMember.preferred_days,
      preferredTimes: supabaseOTMember.preferred_times,
      notes: supabaseOTMember.notes,
      otCount: supabaseOTMember.ot_count,
      totalSessions: supabaseOTMember.total_sessions,
      assignedStaffId: supabaseOTMember.assigned_staff_id
    };
  };

  // Supabase에서 OTProgress 데이터를 가져와서 내부 인터페이스로 변환
  const convertSupabaseOTProgressToOTProgress = async (supabaseOTProgress: any): Promise<OTProgress> => {
    // 해당 진행상황의 세션들을 조회
    const { data: sessionsData } = await supabase
      .from('ot_sessions')
      .select('*')
      .eq('progress_id', supabaseOTProgress.id)
      .order('date', { ascending: true });

    const sessions = sessionsData ? sessionsData.map(session => ({
      id: session.id,
      date: session.date,
      time: session.time,
      completed: session.completed,
      notes: session.notes
    })) : [];

    return {
      id: supabaseOTProgress.id,
      memberId: supabaseOTProgress.member_id,
      staffId: supabaseOTProgress.staff_id,
      totalSessions: supabaseOTProgress.total_sessions,
      completedSessions: supabaseOTProgress.completed_sessions,
      contactMade: supabaseOTProgress.contact_made,
      contactDate: supabaseOTProgress.contact_date,
      contactNotes: supabaseOTProgress.contact_notes,
      sessions
    };
  };

  // Supabase에서 OT 멤버 데이터 가져오기
  const fetchOTMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: supabaseOTMembers, error: fetchError } = await supabase
        .from('ot_members')
        .select('*')
        .order('registered_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (supabaseOTMembers && supabaseOTMembers.length > 0) {
        const convertedMembers = supabaseOTMembers.map(convertSupabaseOTMemberToOTMember);
        setOtMembers(convertedMembers);
      } else {
        // 데이터가 없으면 샘플 데이터 생성
        await generateSampleOTMembersInSupabase();
        // 다시 가져오기
        const { data: newData } = await supabase
          .from('ot_members')
          .select('*')
          .order('registered_at', { ascending: false });
        
        if (newData) {
          const convertedMembers = newData.map(convertSupabaseOTMemberToOTMember);
          setOtMembers(convertedMembers);
        }
      }
    } catch (err) {
      console.error('OT 멤버 데이터 가져오기 실패:', err);
      setError('OT 멤버를 불러오는 중 오류가 발생했습니다.');
    }
  }, []);

  // Supabase에서 OT 진행상황 데이터 가져오기
  const fetchOTProgress = useCallback(async () => {
    try {
      const { data: supabaseOTProgress, error: fetchError } = await supabase
        .from('ot_progress')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (supabaseOTProgress && supabaseOTProgress.length > 0) {
        const convertedProgress: { [key: string]: OTProgress } = {};
        
        for (const progress of supabaseOTProgress) {
          const converted = await convertSupabaseOTProgressToOTProgress(progress);
          const key = `${converted.memberId}-${converted.staffId}`;
          convertedProgress[key] = converted;
        }
        
        setOtProgress(convertedProgress);
      } else {
        // 데이터가 없으면 샘플 데이터 생성
        await generateSampleOTProgressInSupabase();
        // 다시 가져오기
        const { data: newData } = await supabase
          .from('ot_progress')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (newData) {
          const convertedProgress: { [key: string]: OTProgress } = {};
          
          for (const progress of newData) {
            const converted = await convertSupabaseOTProgressToOTProgress(progress);
            const key = `${converted.memberId}-${converted.staffId}`;
            convertedProgress[key] = converted;
          }
          
          setOtProgress(convertedProgress);
        }
      }
    } catch (err) {
      console.error('OT 진행상황 데이터 가져오기 실패:', err);
      setError('OT 진행상황을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 샘플 OT 멤버를 Supabase에 생성
  const generateSampleOTMembersInSupabase = async () => {
    const sampleMembers = [
      { 
        name: '김철수', 
        phone: '010-1111-2222',
        email: 'kim@example.com',
        registered_at: '2024-01-15', 
        status: 'pending' as const,
        preferred_days: ['월요일', '수요일', '금요일'],
        preferred_times: ['오후 2시-4시'],
        notes: '무릎 부상 있음, 강도 조절 필요',
        ot_count: 8,
        total_sessions: 8
      },
      { 
        name: '박지민', 
        phone: '010-3333-4444',
        email: 'park@example.com',
        registered_at: '2024-01-20', 
        status: 'assigned' as const,
        preferred_days: ['화요일', '목요일'],
        preferred_times: ['저녁 7시-9시'],
        notes: '직장인, 저녁 시간대만 가능',
        ot_count: 8,
        total_sessions: 8,
        assigned_staff_id: '1'
      },
      { 
        name: '이영희', 
        phone: '010-5555-6666',
        email: 'lee@example.com',
        registered_at: '2024-01-25', 
        status: 'pending' as const,
        preferred_days: ['평일'],
        preferred_times: ['오전 10시-12시'],
        notes: '주부, 오전 시간대 선호',
        ot_count: 12,
        total_sessions: 12
      },
      { 
        name: '정우성', 
        phone: '010-7777-8888',
        email: 'jung@example.com',
        registered_at: '2024-02-01', 
        status: 'completed' as const,
        preferred_days: ['주말'],
        preferred_times: ['오후 1시-3시'],
        notes: '주말만 가능',
        ot_count: 12,
        total_sessions: 12,
        assigned_staff_id: '2'
      },
      { 
        name: '김지연', 
        phone: '010-9999-0000',
        email: 'kimj@example.com',
        registered_at: '2024-02-05', 
        status: 'pending' as const,
        preferred_days: ['목요일', '토요일'],
        preferred_times: ['저녁 6시-8시'],
        notes: '학생, 저녁 시간대 선호',
        ot_count: 6,
        total_sessions: 6
      }
    ];

    try {
      const { error } = await supabase
        .from('ot_members')
        .insert(sampleMembers);

      if (error) {
        console.error('샘플 OT 멤버 생성 실패:', error);
      } else {
        console.log('✅ 샘플 OT 멤버가 성공적으로 생성되었습니다.');
      }
    } catch (err) {
      console.error('샘플 OT 멤버 생성 중 오류:', err);
    }
  };

  // 샘플 OT 진행상황을 Supabase에 생성
  const generateSampleOTProgressInSupabase = async () => {
    const sampleProgress = [
      {
        member_id: 2,
        staff_id: 1,
        total_sessions: 8,
        completed_sessions: 3,
        contact_made: true,
        contact_date: '2024-01-21',
        contact_notes: '첫 상담 완료, 화목 저녁 시간으로 일정 확정'
      },
      {
        member_id: 4,
        staff_id: 2,
        total_sessions: 12,
        completed_sessions: 12,
        contact_made: true,
        contact_date: '2024-02-02',
        contact_notes: '주말 오후 시간으로 일정 조율 완료'
      }
    ];

    try {
      const { error } = await supabase
        .from('ot_progress')
        .insert(sampleProgress);

      if (error) {
        console.error('샘플 OT 진행상황 생성 실패:', error);
      } else {
        console.log('✅ 샘플 OT 진행상황이 성공적으로 생성되었습니다.');
      }
    } catch (err) {
      console.error('샘플 OT 진행상황 생성 중 오류:', err);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    // localStorage 마이그레이션 먼저 실행 후 데이터 가져오기
    migrateLocalStorageData().finally(() => {
      Promise.all([fetchOTMembers(), fetchOTProgress()]);
    });
  }, [migrateLocalStorageData, fetchOTMembers, fetchOTProgress]);

  // OT 멤버 추가
  const addOTMember = async (memberData: Omit<OTMember, 'id' | 'registeredAt'>): Promise<number | null> => {
    try {
      const { data: newMember, error: insertError } = await supabase
        .from('ot_members')
        .insert({
          name: memberData.name,
          phone: memberData.phone,
          email: memberData.email,
          registered_at: new Date().toISOString().split('T')[0],
          status: 'pending',
          preferred_days: memberData.preferredDays,
          preferred_times: memberData.preferredTimes,
          notes: memberData.notes,
          ot_count: memberData.otCount,
          total_sessions: memberData.totalSessions,
          assigned_staff_id: memberData.assignedStaffId
        })
        .select()
        .single();

      if (insertError) {
        console.error('OT 멤버 추가 실패:', insertError);
        setError('OT 멤버 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newMember) {
        await fetchOTMembers();
        return newMember.id;
      }

      return null;
    } catch (err) {
      console.error('OT 멤버 추가 중 오류:', err);
      setError('OT 멤버 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  // OT 멤버 업데이트
  const updateOTMember = async (id: number, updates: Partial<OTMember>): Promise<boolean> => {
    try {
      const updatePayload: any = {};
      
      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.phone !== undefined) updatePayload.phone = updates.phone;
      if (updates.email !== undefined) updatePayload.email = updates.email;
      if (updates.status !== undefined) updatePayload.status = updates.status;
      if (updates.preferredDays !== undefined) updatePayload.preferred_days = updates.preferredDays;
      if (updates.preferredTimes !== undefined) updatePayload.preferred_times = updates.preferredTimes;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes;
      if (updates.otCount !== undefined) updatePayload.ot_count = updates.otCount;
      if (updates.totalSessions !== undefined) updatePayload.total_sessions = updates.totalSessions;
      if (updates.assignedStaffId !== undefined) updatePayload.assigned_staff_id = updates.assignedStaffId;

      const { error: updateError } = await supabase
        .from('ot_members')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        console.error('OT 멤버 수정 실패:', updateError);
        setError('OT 멤버 수정 중 오류가 발생했습니다.');
        return false;
      }

      await fetchOTMembers();
      return true;
    } catch (err) {
      console.error('OT 멤버 수정 중 오류:', err);
      setError('OT 멤버 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  // OT 멤버 삭제
  const deleteOTMember = async (id: number): Promise<boolean> => {
    try {
      // 관련 진행상황과 세션도 함께 삭제
      const { data: progressData } = await supabase
        .from('ot_progress')
        .select('id')
        .eq('member_id', id);

      if (progressData) {
        for (const progress of progressData) {
          await supabase
            .from('ot_sessions')
            .delete()
            .eq('progress_id', progress.id);
        }
        
        await supabase
          .from('ot_progress')
          .delete()
          .eq('member_id', id);
      }

      const { error: deleteError } = await supabase
        .from('ot_members')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('OT 멤버 삭제 실패:', deleteError);
        setError('OT 멤버 삭제 중 오류가 발생했습니다.');
        return false;
      }

      await Promise.all([fetchOTMembers(), fetchOTProgress()]);
      return true;
    } catch (err) {
      console.error('OT 멤버 삭제 중 오류:', err);
      setError('OT 멤버 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 진행상황 추가
  const addProgress = async (memberId: number, staffId: number, totalSessions: number): Promise<string | null> => {
    try {
      const { data: newProgress, error: insertError } = await supabase
        .from('ot_progress')
        .insert({
          member_id: memberId,
          staff_id: staffId,
          total_sessions: totalSessions,
          completed_sessions: 0,
          contact_made: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('OT 진행상황 추가 실패:', insertError);
        setError('OT 진행상황 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newProgress) {
        await fetchOTProgress();
        return newProgress.id;
      }

      return null;
    } catch (err) {
      console.error('OT 진행상황 추가 중 오류:', err);
      setError('OT 진행상황 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  // 진행상황 업데이트
  const updateProgress = async (progressId: string, updates: Partial<OTProgress>): Promise<boolean> => {
    try {
      const updatePayload: any = {};
      
      if (updates.totalSessions !== undefined) updatePayload.total_sessions = updates.totalSessions;
      if (updates.completedSessions !== undefined) updatePayload.completed_sessions = updates.completedSessions;
      if (updates.contactMade !== undefined) updatePayload.contact_made = updates.contactMade;
      if (updates.contactDate !== undefined) updatePayload.contact_date = updates.contactDate;
      if (updates.contactNotes !== undefined) updatePayload.contact_notes = updates.contactNotes;

      const { error: updateError } = await supabase
        .from('ot_progress')
        .update(updatePayload)
        .eq('id', progressId);

      if (updateError) {
        console.error('OT 진행상황 수정 실패:', updateError);
        setError('OT 진행상황 수정 중 오류가 발생했습니다.');
        return false;
      }

      await fetchOTProgress();
      return true;
    } catch (err) {
      console.error('OT 진행상황 수정 중 오류:', err);
      setError('OT 진행상황 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  // 세션 추가
  const addSession = async (progressId: string, sessionData: Omit<OTProgress['sessions'][0], 'id'>): Promise<string | null> => {
    try {
      const { data: newSession, error: insertError } = await supabase
        .from('ot_sessions')
        .insert({
          progress_id: progressId,
          date: sessionData.date,
          time: sessionData.time,
          completed: sessionData.completed || false,
          notes: sessionData.notes
        })
        .select()
        .single();

      if (insertError) {
        console.error('OT 세션 추가 실패:', insertError);
        setError('OT 세션 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newSession) {
        await fetchOTProgress();
        return newSession.id;
      }

      return null;
    } catch (err) {
      console.error('OT 세션 추가 중 오류:', err);
      setError('OT 세션 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  // 세션 업데이트
  const updateSession = async (progressId: string, sessionId: string, updates: Partial<OTProgress['sessions'][0]>): Promise<boolean> => {
    try {
      const updatePayload: any = {};
      
      if (updates.date !== undefined) updatePayload.date = updates.date;
      if (updates.time !== undefined) updatePayload.time = updates.time;
      if (updates.completed !== undefined) updatePayload.completed = updates.completed;
      if (updates.notes !== undefined) updatePayload.notes = updates.notes;

      const { error: updateError } = await supabase
        .from('ot_sessions')
        .update(updatePayload)
        .eq('id', sessionId);

      if (updateError) {
        console.error('OT 세션 수정 실패:', updateError);
        setError('OT 세션 수정 중 오류가 발생했습니다.');
        return false;
      }

      await fetchOTProgress();
      return true;
    } catch (err) {
      console.error('OT 세션 수정 중 오류:', err);
      setError('OT 세션 수정 중 오류가 발생했습니다.');
      return false;
    }
  };

  const contextValue: OTContextType = {
    otMembers,
    otProgress,
    loading,
    error,
    addOTMember,
    updateOTMember,
    deleteOTMember,
    updateProgress,
    addProgress,
    addSession,
    updateSession,
    fetchOTMembers,
    fetchOTProgress
  };

  return (
    <OTContext.Provider value={contextValue}>
      {children}
    </OTContext.Provider>
  );
};

export const useOT = () => {
  const context = useContext(OTContext);
  if (!context) {
    throw new Error('useOT must be used within an OTProvider');
  }
  return context;
}; 