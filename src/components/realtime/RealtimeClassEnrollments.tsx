import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { subscribeToTable, RealtimePayload } from '../../lib/realtime';

// 수업 등록 타입
interface ClassEnrollment {
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

// 조인된 수업 등록 타입 확장
interface ExtendedClassEnrollment extends ClassEnrollment {
  members?: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  class_schedules?: {
    date: string;
    start_time: string;
    end_time: string;
    class_types?: {
      name: string;
      color: string;
    };
  };
}

export function RealtimeClassEnrollments() {
  const [enrollments, setEnrollments] = useState<ExtendedClassEnrollment[]>([]);
  const [loading, setLoading] = useState(true);

  // 초기 데이터 로딩
  useEffect(() => {
    async function fetchClassEnrollments() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('class_enrollments')
          .select(`
            *,
            members(first_name, last_name, email, phone),
            class_schedules(
              date, 
              start_time, 
              end_time,
              class_types(name, color)
            )
          `)
          .order('enrollment_date', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          setEnrollments(data);
        }
      } catch (error) {
        console.error('수업 등록 정보를 가져오는 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchClassEnrollments();
  }, []);

  // Supabase 실시간 구독 설정
  useEffect(() => {
    // 실시간 구독 설정
    const unsubscribe = subscribeToTable<ClassEnrollment>(
      'class_enrollments',
      async (payload: RealtimePayload<ClassEnrollment>) => {
        console.log('수업 등록 변경:', payload);
        
        // 변경사항 발생 시 전체 목록 다시 가져오기
        const { data } = await supabase
          .from('class_enrollments')
          .select(`
            *,
            members(first_name, last_name, email, phone),
            class_schedules(
              date, 
              start_time, 
              end_time,
              class_types(name, color)
            )
          `)
          .order('enrollment_date', { ascending: false });

        if (data) {
          setEnrollments(data);
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
      case 'enrolled':
        return 'bg-blue-100 text-blue-800';
      case 'attended':
        return 'bg-green-100 text-green-800';
      case 'no-show':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상태 번역
  const translateStatus = (status: string): string => {
    switch (status) {
      case 'enrolled':
        return '등록됨';
      case 'attended':
        return '참석함';
      case 'no-show':
        return '불참';
      case 'cancelled':
        return '취소됨';
      default:
        return status;
    }
  };

  if (loading) {
    return <div className="p-4 text-center">수업 등록 정보를 불러오는 중...</div>;
  }

  if (enrollments.length === 0) {
    return <div className="p-4 text-center">등록된 수업 신청이 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">수업 등록 현황 (실시간)</h2>
      
      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">회원</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">수업</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">일정</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">등록일</th>
              <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">상태</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id}>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div className="font-medium text-gray-900">
                    {enrollment.members?.first_name} {enrollment.members?.last_name}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {enrollment.members?.email}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <div 
                    className="font-medium" 
                    style={{ color: enrollment.class_schedules?.class_types?.color }}
                  >
                    {enrollment.class_schedules?.class_types?.name}
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {enrollment.class_schedules?.date ? (
                    <>
                      {formatDate(enrollment.class_schedules.date)}
                      <div className="text-xs">
                        {formatTime(enrollment.class_schedules.start_time)} - 
                        {formatTime(enrollment.class_schedules.end_time)}
                      </div>
                    </>
                  ) : '정보 없음'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(enrollment.enrollment_date)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${getStatusClass(enrollment.status)}`}>
                    {translateStatus(enrollment.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 