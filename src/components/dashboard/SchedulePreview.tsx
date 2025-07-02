import { useState } from 'react';
import { motion } from 'framer-motion';

// 임시 일정 데이터
const scheduleData = [
  { 
    id: 1, 
    clientName: '홍길동', 
    type: 'PT', 
    time: '09:00 - 10:00',
    status: 'upcoming'
  },
  { 
    id: 2, 
    clientName: '김영희', 
    type: 'PT', 
    time: '10:30 - 11:30',
    status: 'upcoming'
  },
  { 
    id: 3, 
    clientName: '이철수', 
    type: 'PT', 
    time: '13:00 - 14:00',
    status: 'current'
  },
  { 
    id: 4, 
    clientName: '박지민', 
    type: 'OT', 
    time: '15:00 - 15:30',
    status: 'upcoming'
  },
  { 
    id: 5, 
    clientName: '정민호', 
    type: 'PT', 
    time: '16:00 - 17:00',
    status: 'upcoming'
  }
];

const SchedulePreview = () => {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {scheduleData.map((session) => (
        <motion.div
          key={session.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setExpandedItem(expandedItem === session.id ? null : session.id)}
          className={`relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
            session.status === 'current'
              ? 'border-green-200 bg-green-50'
              : 'border-slate-200 hover:bg-slate-50:bg-slate-700/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-medium text-slate-600">
                  {session.clientName.charAt(0)}
                </div>
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {session.clientName}
                </p>
                <p className="text-xs text-slate-500">
                  {session.type} 세션
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900">
                {session.time}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                session.status === 'current'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {session.status === 'current' ? '진행 중' : '예정됨'}
              </span>
            </div>
          </div>

          {expandedItem === session.id && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 border-t border-slate-200"
            >
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-slate-500">마지막 세션:</p>
                  <p className="font-medium text-slate-900">3일 전</p>
                </div>
                <div>
                  <p className="text-slate-500">남은 세션:</p>
                  <p className="font-medium text-slate-900">12 회</p>
                </div>
                <div>
                  <p className="text-slate-500">중점 영역:</p>
                  <p className="font-medium text-slate-900">상체 및 코어</p>
                </div>
                <div>
                  <p className="text-slate-500">담당 트레이너:</p>
                  <p className="font-medium text-slate-900">김철수</p>
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button className="btn btn-sm btn-outline flex-1">세부정보</button>
                <button className="btn btn-sm btn-primary flex-1">일정변경</button>
              </div>
            </motion.div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default SchedulePreview;