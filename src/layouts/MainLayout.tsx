import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import GlobalAnnouncementBanner from '@/components/layout/GlobalAnnouncementBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useAnnouncement } from '@/contexts/AnnouncementContext';
import type { Announcement } from '@/types/index';
import clsx from 'clsx';

const MainLayout = () => {
  const { user } = useAuth();
  const { announcements: globalAnnouncements } = useAnnouncement(); 
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (window.innerWidth < 1024) return false;
    
    const savedState = localStorage.getItem('sidebarOpen');
    return savedState !== null ? savedState === 'true' : true;
  });

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarOpen', sidebarOpen.toString());
    }
  }, [sidebarOpen, isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (!mobile) {
        const savedState = localStorage.getItem('sidebarOpen');
        setSidebarOpen(savedState !== null ? savedState === 'true' : true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      console.log(`사이드바 상태 변경 전: ${prev}, isMobile: ${isMobile}`);
      const newState = !prev;
      console.log(`사이드바 상태 변경 후: ${newState}, isMobile: ${isMobile}`);
      return newState;
    });
  };

  const mainContentClasses = clsx(
    "flex-1 flex flex-col overflow-hidden transition-margin duration-300 ease-in-out",
    {
      "ml-64": sidebarOpen && !isMobile,
      "ml-20": !sidebarOpen && !isMobile,
      "ml-0": isMobile,
    }
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} isMobile={isMobile} />

      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          style={{
            willChange: 'opacity',
            touchAction: 'manipulation'
          }}
        />
      )}

      <div className={mainContentClasses}>
        <GlobalAnnouncementBanner />
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-screen-2xl mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;