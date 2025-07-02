import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { subscribeToTable, RealtimePayload, unsubscribeAll } from '../../lib/realtime';

// 클래스 일정 타입
interface ClassSchedule {
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

// 조인된 클래스 일정 타입 확장
interface ExtendedClassSchedule extends ClassSchedule {
  class_types?: {
    name: string;
    color: string;
  };
  trainers?: {
    first_name: string;
    last_name: string;
  };
  rooms?: {
    name: string;
  };
}

export function RealtimeClassSchedules() {
  const [classSchedules, setClassSchedules] = useState<ExtendedClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로딩
  useEffect(() => {
    async function fetchClassSchedules() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('class_schedules')
          .select(`
            *,
            class_types(name, color),
            trainers(first_name, last_name),
            rooms(name)
          `)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          throw error;
        }

        if (data) {
          setClassSchedules(data);
        }
      } catch (error) {
        console.error('수업 일정을 가져오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClassSchedules();
  }, []);

  // Supabase 실시간 구독 설정
  useEffect(() => {
    // 실시간 구독 설정
    const unsubscribe = subscribeToTable<ClassSchedule>(
      'class_schedules',
      async (payload: RealtimePayload<ClassSchedule>) => {
        console.log('수업 일정 변경:', payload);

        // 변경사항 발생 시 전체 목록 다시 가져오기
        const { data } = await supabase
          .from('class_schedules')
          .select(`
            *,
            class_types(name, color),
            trainers(first_name, last_name),
            rooms(name)
          `)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (data) {
          setClassSchedules(data);
        }
      }
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      unsubscribe();
    };
  }, []);

  // 날짜 포맷팅 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  // 시간 포맷팅 함수
  const formatTime = (timeStr: string) => {
    // timeStr이 "14:30:00" 형식일 경우 처리
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = timeParts[1];
    
    return `${hours}:${minutes}`;
  };

  // 상태에 따른 스타일 클래스
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 번역
  const translateStatus = (status: string): string => {
    switch (status) {
      case 'scheduled':
        return '예정됨';
      case 'in-progress':
        return '진행 중';
      case 'completed':
        return '완료됨';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">수업 일정을 불러오는 중...</div>;
  }

  if (classSchedules.length === 0) {
    return <div className="p-4 text-center">등록된 수업 일정이 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">수업 일정 (실시간)</h2>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">수업</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">날짜</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">시간</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">트레이너</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">장소</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">상태</th>
              <th className="px-3 py-3.5 text-center text-sm font-semibold text-gray-900">인원</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {classSchedules.map((schedule) => (
              <tr key={schedule.id}>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div 
                    className="font-medium flex items-center" 
                    style={{ color: schedule.class_types?.color }}
                  >
                    {schedule.class_types?.name}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(schedule.date)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {schedule.trainers?.first_name} {schedule.trainers?.last_name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {schedule.rooms?.name}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusClass(schedule.status)}`}>
                    {translateStatus(schedule.status)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 text-center">
                  {schedule.enrolled_count} / {schedule.capacity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 