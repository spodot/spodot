import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Announcement } from '../types/index';
import { supabase } from '../supabaseClient';
import { v4 as uuidv4 } from 'uuid'; // UUID 생성을 위해 import
import { notificationService } from '../services/notificationService';

interface AnnouncementContextType {
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  loading: boolean;
  error: string | null;
  fetchAnnouncements: () => Promise<void>;
  addAnnouncement: (newAnnouncementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAnnouncement: (updatedAnnouncementData: Partial<Announcement> & { id: string }) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(undefined);

// 초기 샘플 데이터
const sampleAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '시스템 점검 안내',
    content: '시스템 점검으로 인해 일시적으로 서비스 이용이 제한될 수 있습니다.',
    authorId: '1',
    authorName: '관리자',
    priority: 'high',
    tags: ['시스템', '점검'],
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isPinned: true,
    isActive: true,
    targetRoles: ['all'],
    readBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: []
  },
  {
    id: '2',
    title: '운영시간 변경 안내',
    content: '4월부터 피트니스 센터 운영시간이 변경됩니다. 자세한 내용은 공지사항을 확인해주세요.',
    authorId: '1',
    authorName: '관리자',
    priority: 'medium',
    tags: ['운영시간', '변경'],
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isPinned: false,
    isActive: true,
    targetRoles: ['all'],
    readBy: [],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    attachments: []
  }
];

export const AnnouncementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // localStorage에서 공지사항 데이터 가져오기
      const storedAnnouncements = localStorage.getItem('announcements');
      if (storedAnnouncements) {
        setAnnouncements(JSON.parse(storedAnnouncements));
      } else {
        // 처음 실행시에만 샘플 데이터 설정
        setAnnouncements(sampleAnnouncements);
        localStorage.setItem('announcements', JSON.stringify(sampleAnnouncements));
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      // setError('공지사항을 불러오는 중 오류가 발생했습니다.'); // 초기 로딩 에러 메시지 제거
      setError(null); // 에러 상태 초기화
      setAnnouncements(sampleAnnouncements);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const addAnnouncement = async (newAnnouncementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const newAnnouncement: Announcement = {
        ...newAnnouncementData,
        id: uuidv4(), // 고유 ID 생성
        createdAt: now,
        updatedAt: now
      };
      
      // 로컬 상태 업데이트 및 localStorage에 저장
      const updatedAnnouncements = [newAnnouncement, ...announcements];
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));

      // 🚀 자동 알림: 공지사항 등록시 대상 역할의 모든 사용자에게 알림
      await notificationService.notifyAnnouncementCreated({
        id: newAnnouncement.id,
        title: newAnnouncement.title,
        authorName: newAnnouncement.authorName,
        targetRoles: newAnnouncement.targetRoles,
        priority: newAnnouncement.priority
      });
    } catch (err) {
      console.error('Error adding announcement:', err);
      setError('공지사항 추가 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAnnouncement = async (updatedAnnouncementData: Partial<Announcement> & { id: string }) => {
    setLoading(true);
    setError(null);
    try {
      const updates = {
        ...updatedAnnouncementData,
        updatedAt: new Date().toISOString()
      };
      
      // 로컬 상태 업데이트 및 localStorage에 저장
      const updatedAnnouncements = announcements.map((announcement) =>
        announcement.id === updatedAnnouncementData.id 
          ? { ...announcement, ...updates } 
          : announcement
      );
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    } catch (err) {
      console.error('Error updating announcement:', err);
      setError('공지사항 업데이트 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // 로컬 상태 업데이트 및 localStorage에 저장
      const updatedAnnouncements = announcements.filter((announcement) => announcement.id !== id);
      setAnnouncements(updatedAnnouncements);
      localStorage.setItem('announcements', JSON.stringify(updatedAnnouncements));
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('공지사항 삭제 중 오류가 발생했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnnouncementContext.Provider value={{ announcements, setAnnouncements, loading, error, fetchAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement }}>
      {children}
    </AnnouncementContext.Provider>
  );
};

export const useAnnouncement = () => {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error('useAnnouncement must be used within an AnnouncementProvider');
  }
  return context;
};

// HMR Fast Refresh 호환성을 위한 기본 export
export default { AnnouncementProvider, useAnnouncement };