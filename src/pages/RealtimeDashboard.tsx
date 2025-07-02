import { useState } from 'react';
import { RealtimeClassSchedules } from '../components/realtime/RealtimeClassSchedules';
import { RealtimeClassEnrollments } from '../components/realtime/RealtimeClassEnrollments';

export function RealtimeDashboard() {
  const [activeTab, setActiveTab] = useState<'schedules' | 'enrollments'>('schedules');

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">실시간 대시보드</h1>
        <p className="mt-2 text-sm text-gray-600">
          수업 일정 및 등록 현황을 실시간으로 확인할 수 있습니다.
        </p>
      </header>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('schedules')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'schedules'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            수업 일정
          </button>
          <button
            onClick={() => setActiveTab('enrollments')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === 'enrollments'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
            `}
          >
            수업 등록 현황
          </button>
        </nav>
      </div>

      {/* 실시간 데이터 컴포넌트 */}
      <div className="mt-4">
        {activeTab === 'schedules' && (
          <RealtimeClassSchedules />
        )}
        
        {activeTab === 'enrollments' && (
          <RealtimeClassEnrollments />
        )}
      </div>

      {/* 실시간 데이터 안내 */}
      <div className="mt-10 p-4 bg-blue-50 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1 md:flex md:justify-between">
            <p className="text-sm text-blue-700">
              표시된 데이터는 Supabase Realtime 기능을 통해 자동으로 업데이트됩니다. 다른 관리자가 변경한 내용이 즉시 반영됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 