import { useEffect } from 'react';
import { notificationService } from '../services/notificationService';

export const useNotificationScheduler = () => {
  useEffect(() => {
    // 앱 시작시 한 번 실행
    notificationService.runDailyScheduler();

    // 1시간마다 마감일 체크 (실제 운영에서는 하루에 한 번 정도로 조정)
    const interval = setInterval(() => {
      notificationService.runDailyScheduler();
    }, 60 * 60 * 1000); // 1시간 = 60분 * 60초 * 1000ms

    // 정리 함수
    return () => {
      clearInterval(interval);
    };
  }, []);

  // 수동으로 스케줄러 실행하는 함수 제공
  const runSchedulerNow = () => {
    notificationService.runDailyScheduler();
  };

  return { runSchedulerNow };
}; 