import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// 일정 유형
export type SessionType = 'PT' | 'OT' | 'GROUP' | 'CONSULT';

// 반복 유형
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

// 일정 인터페이스
export interface Schedule {
  id: string;
  clientName: string;
  clientId?: string;
  trainerId: string;
  trainerName: string;
  type: SessionType;
  date: string; // 'YYYY-MM-DD' 형식
  startTime: string; // 'HH:MM' 형식
  endTime: string; // 'HH:MM' 형식
  notes?: string;
  recurrence?: RecurrenceType;
  recurrenceEndDate?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ScheduleContextType {
  schedules: Schedule[];
  filteredSchedules: Schedule[];
  loading: boolean;
  error: string | null;
  filterSchedules: (options: FilterOptions) => void;
  addSchedule: (schedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'>) => Promise<string | null>;
  updateSchedule: (id: string, schedule: Partial<Schedule>) => Promise<boolean>;
  deleteSchedule: (id: string) => Promise<boolean>;
  markScheduleComplete: (id: string, isCompleted: boolean) => Promise<boolean>;
  fetchSchedules: () => Promise<void>;
}

interface FilterOptions {
  date?: string;
  trainerId?: string;
  clientId?: string;
  type?: SessionType;
  searchQuery?: string;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 localStorage 데이터를 Supabase로 마이그레이션
  const migrateLocalStorageData = useCallback(async () => {
    const savedSchedules = localStorage.getItem('schedules');
    if (!savedSchedules) return;

    try {
      const localSchedules: Schedule[] = JSON.parse(savedSchedules);
      console.log(`📦 로컬 스토리지에서 ${localSchedules.length}개의 일정을 발견했습니다.`);
      
      if (localSchedules.length === 0) {
        localStorage.removeItem('schedules');
        return;
      }

      // 기존 Supabase 데이터 확인
      const { data: existingSchedules } = await supabase
        .from('schedules')
        .select('id')
        .limit(1);

      // 이미 Supabase에 데이터가 있으면 마이그레이션 하지 않음
      if (existingSchedules && existingSchedules.length > 0) {
        console.log('✅ Supabase에 이미 일정 데이터가 있어 마이그레이션을 건너뜁니다.');
        localStorage.removeItem('schedules');
        return;
      }

      let migratedCount = 0;
      for (const localSchedule of localSchedules) {
        try {
          const { error: insertError } = await supabase
            .from('schedules')
            .insert({
              client_name: localSchedule.clientName,
              client_id: localSchedule.clientId,
              trainer_id: localSchedule.trainerId,
              trainer_name: localSchedule.trainerName,
              type: localSchedule.type,
              date: localSchedule.date,
              start_time: localSchedule.startTime,
              end_time: localSchedule.endTime,
              notes: localSchedule.notes,
              recurrence: localSchedule.recurrence || 'none',
              recurrence_end_date: localSchedule.recurrenceEndDate,
              is_completed: localSchedule.isCompleted
            });

          if (insertError) {
            console.error(`일정 마이그레이션 실패: ${localSchedule.clientName}`, insertError);
            continue;
          }

          migratedCount++;
        } catch (err) {
          console.error(`일정 "${localSchedule.clientName}" 마이그레이션 중 오류:`, err);
        }
      }

      console.log(`✅ ${migratedCount}개의 일정이 성공적으로 마이그레이션되었습니다.`);
      
      // 마이그레이션 완료 후 localStorage 정리
      localStorage.removeItem('schedules');
      
    } catch (err) {
      console.error('일정 마이그레이션 실패:', err);
    }
  }, []);

  // Supabase에서 Schedule 데이터를 가져와서 내부 인터페이스로 변환
  const convertSupabaseScheduleToSchedule = (supabaseSchedule: any): Schedule => {
    return {
      id: supabaseSchedule.id,
      clientName: supabaseSchedule.client_name,
      clientId: supabaseSchedule.client_id,
      trainerId: supabaseSchedule.trainer_id,
      trainerName: supabaseSchedule.trainer_name,
      type: supabaseSchedule.type,
      date: supabaseSchedule.date,
      startTime: supabaseSchedule.start_time,
      endTime: supabaseSchedule.end_time,
      notes: supabaseSchedule.notes,
      recurrence: supabaseSchedule.recurrence || 'none',
      recurrenceEndDate: supabaseSchedule.recurrence_end_date,
      isCompleted: supabaseSchedule.is_completed || false,
      createdAt: supabaseSchedule.created_at || new Date().toISOString(),
      updatedAt: supabaseSchedule.updated_at || new Date().toISOString()
    };
  };

  // Supabase에서 일정 데이터 가져오기
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: supabaseSchedules, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      if (supabaseSchedules) {
        const convertedSchedules = supabaseSchedules.map(convertSupabaseScheduleToSchedule);
        setSchedules(convertedSchedules);
        setFilteredSchedules(convertedSchedules);
      } else {
        // 데이터가 없으면 샘플 데이터 생성
        await generateSampleSchedulesInSupabase();
        // 다시 가져오기
        const { data: newData } = await supabase
          .from('schedules')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (newData) {
          const convertedSchedules = newData.map(convertSupabaseScheduleToSchedule);
          setSchedules(convertedSchedules);
          setFilteredSchedules(convertedSchedules);
        }
      }
    } catch (err) {
      console.error('일정 데이터 가져오기 실패:', err);
      setError('일정을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 샘플 일정을 Supabase에 생성
  const generateSampleSchedulesInSupabase = async () => {
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const dayAfterTomorrow = addDays(today, 2);
    const nextWeek = addDays(today, 7);
    const nextWeek2 = addDays(today, 8);
    
    const sampleSchedules = [
      // 오늘 일정
      {
        client_name: '김영희',
        client_id: 'client-1',
        trainer_id: 'trainer-1',
        trainer_name: '박지민 트레이너',
        type: 'PT' as const,
        date: format(today, 'yyyy-MM-dd'),
        start_time: '10:00',
        end_time: '11:00',
        notes: '체중 감량 프로그램 3일차',
        is_completed: false
      },
      {
        client_name: '이철수',
        client_id: 'client-2',
        trainer_id: 'trainer-1',
        trainer_name: '박지민 트레이너',
        type: 'PT' as const,
        date: format(today, 'yyyy-MM-dd'),
        start_time: '14:00',
        end_time: '15:00',
        notes: '근력 강화 훈련',
        is_completed: false
      },
      {
        client_name: '박수정',
        client_id: 'client-5',
        trainer_id: 'trainer-3',
        trainer_name: '김지연 트레이너',
        type: 'PT' as const,
        date: format(today, 'yyyy-MM-dd'),
        start_time: '16:00',
        end_time: '17:00',
        notes: '재활 운동 프로그램',
        is_completed: true
      },
      // 내일 일정
      {
        client_name: '강준호',
        client_id: 'client-3',
        trainer_id: 'trainer-2',
        trainer_name: '최준호 트레이너',
        type: 'OT' as const,
        date: format(tomorrow, 'yyyy-MM-dd'),
        start_time: '11:00',
        end_time: '12:00',
        notes: '초기 상담 및 신체 측정',
        is_completed: false
      },
      {
        client_name: '그룹 수업 (10명)',
        trainer_id: 'trainer-2',
        trainer_name: '최준호 트레이너',
        type: 'GROUP' as const,
        date: format(tomorrow, 'yyyy-MM-dd'),
        start_time: '18:00',
        end_time: '19:00',
        notes: '요가 클래스',
        is_completed: false
      },
      {
        client_name: '정민수',
        client_id: 'client-6',
        trainer_id: 'trainer-4',
        trainer_name: '이성호 트레이너',
        type: 'PT' as const,
        date: format(tomorrow, 'yyyy-MM-dd'),
        start_time: '09:00',
        end_time: '10:00',
        notes: '웨이트 트레이닝 기초',
        is_completed: false
      },
      // 모레 일정
      {
        client_name: '황미영',
        client_id: 'client-4',
        trainer_id: 'trainer-3',
        trainer_name: '김지연 트레이너',
        type: 'CONSULT' as const,
        date: format(dayAfterTomorrow, 'yyyy-MM-dd'),
        start_time: '15:00',
        end_time: '16:00',
        notes: '영양 상담',
        is_completed: false
      },
      {
        client_name: '조현우',
        client_id: 'client-7',
        trainer_id: 'trainer-1',
        trainer_name: '박지민 트레이너',
        type: 'PT' as const,
        date: format(dayAfterTomorrow, 'yyyy-MM-dd'),
        start_time: '13:00',
        end_time: '14:00',
        notes: '체력 향상 프로그램',
        is_completed: false
      },
      // 다음 주 일정
      {
        client_name: '최서연',
        client_id: 'client-8',
        trainer_id: 'trainer-4',
        trainer_name: '이성호 트레이너',
        type: 'GROUP' as const,
        date: format(nextWeek, 'yyyy-MM-dd'),
        start_time: '19:00',
        end_time: '20:00',
        notes: '필라테스 중급반',
        is_completed: false
      },
      {
        client_name: '박민지',
        client_id: 'client-9',
        trainer_id: 'trainer-2',
        trainer_name: '최준호 트레이너',
        type: 'PT' as const,
        date: format(nextWeek2, 'yyyy-MM-dd'),
        start_time: '16:00',
        end_time: '17:00',
        notes: '코어 강화 프로그램',
        is_completed: false
      }
    ];

    try {
      const { error } = await supabase
        .from('schedules')
        .insert(sampleSchedules);

      if (error) {
        console.error('샘플 일정 생성 실패:', error);
      } else {
        console.log('✅ 샘플 일정이 성공적으로 생성되었습니다.');
      }
    } catch (err) {
      console.error('샘플 일정 생성 중 오류:', err);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    // localStorage 마이그레이션 먼저 실행 후 데이터 가져오기
    migrateLocalStorageData().finally(() => {
      fetchSchedules();
    });
  }, [migrateLocalStorageData, fetchSchedules]);
  
  // 일정 필터링
  const filterSchedules = (options: FilterOptions) => {
    let filtered = [...schedules];
    
    if (options.date) {
      filtered = filtered.filter(schedule => schedule.date === options.date);
    }
    
    if (options.trainerId) {
      filtered = filtered.filter(schedule => schedule.trainerId === options.trainerId);
    }
    
    if (options.clientId) {
      filtered = filtered.filter(schedule => schedule.clientId === options.clientId);
    }
    
    if (options.type) {
      filtered = filtered.filter(schedule => schedule.type === options.type);
    }
    
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(schedule => 
        schedule.clientName.toLowerCase().includes(query) ||
        schedule.trainerName.toLowerCase().includes(query) ||
        (schedule.notes && schedule.notes.toLowerCase().includes(query))
      );
    }
    
    setFilteredSchedules(filtered);
  };
  
  // 일정 추가
  const addSchedule = async (newSchedule: Omit<Schedule, 'id' | 'createdAt' | 'updatedAt' | 'isCompleted'>): Promise<string | null> => {
    try {
      const { data: newSupabaseSchedule, error: insertError } = await supabase
        .from('schedules')
        .insert({
          client_name: newSchedule.clientName,
          client_id: newSchedule.clientId,
          trainer_id: newSchedule.trainerId,
          trainer_name: newSchedule.trainerName,
          type: newSchedule.type,
          date: newSchedule.date,
          start_time: newSchedule.startTime,
          end_time: newSchedule.endTime,
          notes: newSchedule.notes,
          recurrence: newSchedule.recurrence || 'none',
          recurrence_end_date: newSchedule.recurrenceEndDate,
          is_completed: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('일정 추가 실패:', insertError);
        setError('일정 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newSupabaseSchedule) {
        const convertedSchedule = convertSupabaseScheduleToSchedule(newSupabaseSchedule);
    
    // 반복 일정 처리
        const allSchedules = generateRecurrentSchedules(convertedSchedule);
        
        // 추가 반복 일정이 있으면 Supabase에 추가
        if (allSchedules.length > 1) {
          const additionalSchedules = allSchedules.slice(1).map(schedule => ({
            client_name: schedule.clientName,
            client_id: schedule.clientId,
            trainer_id: schedule.trainerId,
            trainer_name: schedule.trainerName,
            type: schedule.type,
            date: schedule.date,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            notes: schedule.notes,
            recurrence: schedule.recurrence || 'none',
            recurrence_end_date: schedule.recurrenceEndDate,
            is_completed: false
          }));

          await supabase
            .from('schedules')
            .insert(additionalSchedules);
        }

        // 상태 업데이트
        await fetchSchedules();
        return newSupabaseSchedule.id;
      }

      return null;
    } catch (err) {
      console.error('일정 추가 중 오류:', err);
      setError('일정 추가 중 오류가 발생했습니다.');
      return null;
    }
  };
  
  // 반복 일정 생성
  const generateRecurrentSchedules = (schedule: Schedule): Schedule[] => {
    if (!schedule.recurrence || schedule.recurrence === 'none') {
      return [schedule];
    }
    
    const schedules: Schedule[] = [schedule];
    const startDate = new Date(schedule.date);
    const endDate = schedule.recurrenceEndDate ? new Date(schedule.recurrenceEndDate) : addDays(startDate, 365);

    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      let nextDate: Date;

      switch (schedule.recurrence) {
        case 'daily':
          nextDate = addDays(currentDate, 1);
          break;
        case 'weekly':
          nextDate = addDays(currentDate, 7);
          break;
        case 'monthly':
          nextDate = new Date(currentDate);
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        default:
          return schedules;
      }

      if (nextDate <= endDate) {
      schedules.push({
        ...schedule,
          id: `${schedule.id}-${format(nextDate, 'yyyy-MM-dd')}`,
          date: format(nextDate, 'yyyy-MM-dd'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      currentDate = nextDate;
    }
    
    return schedules;
  };
  
  // 일정 수정
  const updateSchedule = async (id: string, updatedData: Partial<Schedule>): Promise<boolean> => {
    try {
      console.log('updateSchedule 호출:', { id, updatedData });
      
      const updatePayload: any = {};
      
      if (updatedData.clientName !== undefined) updatePayload.client_name = updatedData.clientName;
      if (updatedData.clientId !== undefined) updatePayload.client_id = updatedData.clientId;
      if (updatedData.trainerId !== undefined) updatePayload.trainer_id = updatedData.trainerId;
      if (updatedData.trainerName !== undefined) updatePayload.trainer_name = updatedData.trainerName;
      if (updatedData.type !== undefined) updatePayload.type = updatedData.type;
      if (updatedData.date !== undefined) updatePayload.date = updatedData.date;
      if (updatedData.startTime !== undefined) updatePayload.start_time = updatedData.startTime;
      if (updatedData.endTime !== undefined) updatePayload.end_time = updatedData.endTime;
      if (updatedData.notes !== undefined) updatePayload.notes = updatedData.notes;
      if (updatedData.recurrence !== undefined) updatePayload.recurrence = updatedData.recurrence;
      if (updatedData.recurrenceEndDate !== undefined) updatePayload.recurrence_end_date = updatedData.recurrenceEndDate;
      if (updatedData.isCompleted !== undefined) updatePayload.is_completed = updatedData.isCompleted;

      console.log('Supabase 업데이트 payload:', updatePayload);

      const { error: updateError } = await supabase
        .from('schedules')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        console.error('일정 수정 실패:', updateError);
        setError('일정 수정 중 오류가 발생했습니다.');
        return false;
      }

      console.log('Supabase 업데이트 성공, 데이터 재조회 중...');
      
      // 상태 업데이트
      await fetchSchedules();
      return true;
    } catch (err) {
      console.error('일정 수정 중 오류:', err);
      setError('일정 수정 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 일정 삭제
  const deleteSchedule = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('일정 삭제 실패:', deleteError);
        setError('일정 삭제 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchSchedules();
      return true;
    } catch (err) {
      console.error('일정 삭제 중 오류:', err);
      setError('일정 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 일정 완료 상태 변경
  const markScheduleComplete = async (id: string, isCompleted: boolean): Promise<boolean> => {
    console.log('markScheduleComplete 호출:', { id, isCompleted });
    const result = await updateSchedule(id, { isCompleted });
    console.log('markScheduleComplete 결과:', result);
    return result;
  };
  
  const contextValue: ScheduleContextType = {
        schedules, 
        filteredSchedules, 
    loading,
    error,
        filterSchedules, 
        addSchedule, 
        updateSchedule, 
        deleteSchedule, 
    markScheduleComplete,
    fetchSchedules
  };

  return (
    <ScheduleContext.Provider value={contextValue}>
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
}; 