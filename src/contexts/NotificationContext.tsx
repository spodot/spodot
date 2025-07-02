import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabaseApiService } from '../services/supabaseApi';
import { Announcement, Task, Suggestion } from '../types/index';

// 알림 유형 타입
export type NotificationType = 'info' | 'warning' | 'success' | 'error';

interface MenuBadges {
  announcements: number;
  tasks: number;
  dailyReports: number;
  manuals: number;
  notifications: number;
  suggestions: number;
}

interface NotificationContextType {
  badges: MenuBadges;
  refreshBadges: () => Promise<void>;
  updateBadge: (menu: keyof MenuBadges, count: number) => void;
  markAsRead: (menu: keyof MenuBadges, itemId?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [badges, setBadges] = useState<MenuBadges>({
    announcements: 0,
    tasks: 0,
    dailyReports: 0,
    manuals: 0,
    notifications: 0,
    suggestions: 0,
  });

  const refreshBadges = async () => {
    try {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) return;

      // 병렬로 모든 뱃지 카운트 조회
      const [
        unreadAnnouncements,
        myPendingTasks,
        todayReports,
        newManuals,
        unreadNotifications,
        pendingSuggestions
      ] = await Promise.all([
        getUnreadAnnouncementsCount(currentUserId),
        getMyPendingTasksCount(currentUserId),
        getTodayReportsCount(),
        getNewManualsCount(),
        getUnreadNotificationsCount(currentUserId),
        getPendingSuggestionsCount()
      ]);

      setBadges({
        announcements: unreadAnnouncements,
        tasks: myPendingTasks,
        dailyReports: todayReports,
        manuals: newManuals,
        notifications: unreadNotifications,
        suggestions: pendingSuggestions,
      });
    } catch (error) {
      console.error('Failed to refresh badges:', error);
    }
  };

  const updateBadge = (menu: keyof MenuBadges, count: number) => {
    setBadges(prev => ({ ...prev, [menu]: count }));
  };

  const markAsRead = (menu: keyof MenuBadges, itemId?: string) => {
    setBadges(prev => ({ 
      ...prev, 
      [menu]: Math.max(0, prev[menu] - 1) 
    }));
  };

  // 초기 로드 및 주기적 업데이트
  useEffect(() => {
    refreshBadges();
    
    // 30초마다 뱃지 업데이트
    const interval = setInterval(refreshBadges, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{ badges, refreshBadges, updateBadge, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// 각 뱃지 카운트 조회 함수들
async function getUnreadAnnouncementsCount(userId: string): Promise<number> {
  try {
    const response = await supabaseApiService.announcements.getAll();
    const announcements = response.data;
    
    // 사용자가 읽지 않은 공지사항 수 (active하고 읽지 않은 것들)
    const unreadCount = announcements.filter((ann: any) => 
      ann.isActive !== false && (!ann.readBy || !ann.readBy.includes(userId))
    ).length;
    
    return unreadCount;
  } catch (error) {
    console.error('Failed to get unread announcements count:', error);
    return 0;
  }
}

async function getMyPendingTasksCount(userId: string): Promise<number> {
  try {
    const response = await supabaseApiService.tasks.getAll();
    
    // 나에게 할당된 대기 중인 업무 수
    const myPendingTasks = response.data.filter((task: any) => 
      task.assigneeId === userId && task.status === 'pending'
    ).length;
    
    return myPendingTasks;
  } catch (error) {
    console.error('Failed to get pending tasks count:', error);
    return 0;
  }
}

async function getTodayReportsCount(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await supabaseApiService.dailyReports.getAll({
      dateFrom: today,
      dateTo: today
    });
    
    // 오늘 작성된 보고서 수 (새로운 보고서 표시)
    return response.data.length;
  } catch (error) {
    console.error('Failed to get today reports count:', error);
    return 0;
  }
}

async function getNewManualsCount(): Promise<number> {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const response = await supabaseApiService.manuals.getAll();
    
    // 최근 7일 내 작성된 메뉴얼 수
    const newManuals = response.data.filter(manual => 
      new Date(manual.createdAt) > weekAgo
    ).length;
    
    return newManuals;
  } catch (error) {
    console.error('Failed to get new manuals count:', error);
    return 0;
  }
}

async function getUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    const response = await supabaseApiService.notifications.getAll();
    const notifications = response.data;
    
    // 읽지 않은 알림 수
    const unreadCount = notifications.filter(notification => 
      !notification.isRead
    ).length;
    
    return unreadCount;
  } catch (error) {
    console.error('Failed to get unread notifications count:', error);
    return 0;
  }
}

async function getPendingSuggestionsCount(): Promise<number> {
  try {
    const response = await supabaseApiService.suggestions.getAll({ 
      status: 'pending' 
    });
    
    // 대기 중인 건의사항 수 (관리자용)
    return response.data.length;
  } catch (error) {
    console.error('Failed to get pending suggestions count:', error);
    return 0;
  }
} 