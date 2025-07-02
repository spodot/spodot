import React, { useState, useMemo, useEffect } from 'react';
import { useAnnouncement } from '../../contexts/AnnouncementContext';
import { Announcement } from '../../types/index';
import { Megaphone, X, ChevronDown, ChevronUp } from 'lucide-react';

const GlobalAnnouncementBanner: React.FC = () => {
  const { announcements, loading } = useAnnouncement();
  const [isDismissedLocally, setIsDismissedLocally] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true); // New state for expand/collapse

  const bannerAnnouncementsToDisplay: Announcement[] = useMemo(() => {
    if (loading || !announcements || announcements.length === 0) {
      return [];
    }
    const bannerAnnouncements = announcements.filter(ann => ann.isPublished && ann.showInBanner);

    // Sort by updatedAt (descending), then by createdAt (descending) if updatedAt is the same or undefined
    bannerAnnouncements.sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt) : new Date(a.createdAt);
      const dateB = b.updatedAt ? new Date(b.updatedAt) : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    return bannerAnnouncements; // Return all potential banner announcements, sorted
  }, [announcements, loading]);

  // For now, we'll still display only one (the latest) if multiple are selected for banner
  // This can be changed later to a carousel or other multi-display format.
  const currentBannerToShow = bannerAnnouncementsToDisplay.length > 0 ? bannerAnnouncementsToDisplay[0] : null;

  useEffect(() => {
    if (currentBannerToShow && sessionStorage.getItem(`bannerDismissed_${currentBannerToShow.id}`) === 'true') {
      setIsDismissedLocally(true);
    } else if (currentBannerToShow) {
      setIsDismissedLocally(false);
      // Potentially reset expanded state when announcement changes, or use a different strategy
      // For now, let's keep isExpanded state independent of announcement changes unless dismissed.
    }
  }, [currentBannerToShow]);

  if (isDismissedLocally || !currentBannerToShow) {
    return null;
  }

  const handleDismiss = () => {
    if (currentBannerToShow) {
      sessionStorage.setItem(`bannerDismissed_${currentBannerToShow.id}`, 'true');
    }
    setIsDismissedLocally(true);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`bg-blue-600 text-white p-3 text-sm shadow-md transition-all duration-300 ease-in-out`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center min-w-0 ${isExpanded ? 'flex-1' : ''}`}>
          <Megaphone className="w-5 h-5 mr-3 flex-shrink-0" />
          {isExpanded ? (
            <p className="truncate">
              <span className="font-semibold">공지사항:</span> {currentBannerToShow.title}
              {currentBannerToShow.content && `: ${currentBannerToShow.content}`}
            </p>
          ) : (
            <p className="font-semibold truncate">공지사항: {currentBannerToShow.title}</p> // Show only title when collapsed
          )}
        </div>
        <div className="flex items-center ml-4 flex-shrink-0">
          <button 
            onClick={toggleExpand}
            className="text-white hover:bg-blue-700 p-1 rounded-full mr-2"
            aria-label={isExpanded ? "배너 접기" : "배너 펴기"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleDismiss} 
            className="text-white hover:bg-blue-700 p-1 rounded-full"
            aria-label="공지사항 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalAnnouncementBanner;
