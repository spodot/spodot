import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAnnouncement } from '../../contexts/AnnouncementContext';
import { useAuth } from '../../contexts/AuthContext';
import { Announcement } from '../../types/index'; 
import { format, parseISO } from 'date-fns';
import { Edit3, Trash2, PlusCircle, CheckSquare, Square, Upload, X, Image as ImageIcon, AlertTriangle } from 'lucide-react';



const AnnouncementsManagement: React.FC = () => {
  const { user } = useAuth();
  const {
    announcements,
    loading,
    error,
    fetchAnnouncements, 
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
  } = useAnnouncement();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // 삭제 관련 상태
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  // 검색/필터 상태
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 카테고리/태그 입력 상태
  const [categoryInput, setCategoryInput] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  
  // 이미지 첨부 상태
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 성능 최적화: useMemo로 필터링
  const filteredAnnouncements = useMemo(() => announcements.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.title?.toLowerCase().includes(q) ||
      a.content?.toLowerCase().includes(q) ||
      (a.targetRoles || []).some(role => role.toLowerCase().includes(q)) ||
      (a.isActive ? '게시됨' : '게시 안됨').includes(q) ||
      (a.tags || []).some(tag => tag.toLowerCase().includes(q))
    );
  }), [announcements, search]);

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setCurrentAnnouncement({ ...announcement });
      setCategoryInput(''); // category는 tags에 포함
      setTagsInput((announcement.tags || []).join(','));
      setIsEditMode(true);
    } else {
      setCurrentAnnouncement({ 
        title: '', 
        content: '', 
        targetRoles: ['all'], 
        tags: [],
        priority: 'medium',
        isPinned: false,
        isActive: true,
        authorId: user?.id || '',
        authorName: user?.name || ''
      });
      setCategoryInput('');
      setTagsInput('');
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAnnouncement(null);
    setIsEditMode(false);
    // 이미지 관련 상태 초기화
    setSelectedImages([]);
    setImagePreviewUrls([]);
  };

  // 이미지를 Base64로 변환 (실제 업로드 대신 localStorage에 저장)
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // 이미지 압축 함수 추가
  const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // 비율 유지하면서 크기 조정
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        // 이미지 그리기
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // 압축된 이미지를 Blob으로 변환
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file); // 압축 실패시 원본 반환
          }
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 이미지 선택 처리 (압축 기능 추가)
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      alert('이미지 파일만 선택할 수 있습니다.');
    }
    
    // 파일 크기 검증 (5MB 제한)
    const oversizedFiles = imageFiles.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(`다음 파일들이 5MB를 초과합니다: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }
    
    // 최대 5개까지만 허용
    const maxImages = 5;
    const totalImages = selectedImages.length + imageFiles.length;
    
    if (totalImages > maxImages) {
      alert(`최대 ${maxImages}개의 이미지만 첨부할 수 있습니다.`);
      return;
    }
    
    try {
      // 이미지 압축 처리
      const compressedFiles = await Promise.all(
        imageFiles.map(file => compressImage(file))
      );
      
      setSelectedImages(prev => [...prev, ...compressedFiles]);
      
      // 미리보기 URL 생성
      const newPreviewUrls = compressedFiles.map(file => URL.createObjectURL(file));
      setImagePreviewUrls(prev => [...prev, ...newPreviewUrls]);
      
      // 압축 완료 알림
      const originalSize = imageFiles.reduce((sum, file) => sum + file.size, 0);
      const compressedSize = compressedFiles.reduce((sum, file) => sum + file.size, 0);
      const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);
      
      if (savedPercent > 10) {
        console.log(`🗜️ 이미지 압축 완료: ${savedPercent}% 용량 절약`);
      }
    } catch (error) {
      console.error('이미지 압축 실패:', error);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  // 이미지 제거
  const handleImageRemove = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // 메모리 누수 방지를 위해 URL 해제
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      // 기존 handleImageSelect 로직 재사용
      const fakeEvent = {
        target: { files: imageFiles }
      } as any;
      await handleImageSelect(fakeEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (currentAnnouncement) {
      const { name, value } = e.target;
      setCurrentAnnouncement({ ...currentAnnouncement, [name]: value });
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!currentAnnouncement || !currentAnnouncement.title?.trim() || !currentAnnouncement.content?.trim()) {
      alert('제목과 내용은 필수 항목입니다.'); 
      return;
    }

    try {
      const category = categoryInput.trim();
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      
      // 이미지 처리
      const imageData = await Promise.all(
        selectedImages.map(async (file, index) => {
          const base64 = await convertImageToBase64(file);
          return {
            id: `img-${Date.now()}-${index}`,
            name: file.name,
            url: base64, // Base64 데이터 URL
            size: file.size,
            uploadedAt: new Date().toISOString()
          };
        })
      );
      
      if (isEditMode && currentAnnouncement.id) {
        const existingImages = currentAnnouncement.images || [];
        await updateAnnouncement({ 
          ...currentAnnouncement, 
          category, 
          tags,
          images: [...existingImages, ...imageData]
        } as Partial<Announcement> & { id: string });
      } else {
        const newAnnouncementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'> = {
          title: currentAnnouncement.title,
          content: currentAnnouncement.content,
          targetRoles: currentAnnouncement.targetRoles || ['all'],
          tags,
          priority: currentAnnouncement.priority || 'medium',
          isPinned: currentAnnouncement.isPinned || false,
          isActive: currentAnnouncement.isActive || true,
          authorId: currentAnnouncement.authorId || user?.id || '',
          authorName: currentAnnouncement.authorName || user?.name || '',
          readBy: [],
          attachments: currentAnnouncement.attachments || [],
          images: imageData
        };
        await addAnnouncement(newAnnouncementData);
      }
      handleCloseModal();
    } catch (saveError) {
      console.error('Failed to save announcement:', saveError);
      alert('공지사항 저장에 실패했습니다.'); 
    }
  };

  // 삭제 모달 관련 함수들
  const handleOpenDeleteModal = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setAnnouncementToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    
    try {
      await deleteAnnouncement(announcementToDelete.id);
      handleCloseDeleteModal();
    } catch (deleteError) {
      console.error('Failed to delete announcement:', deleteError);
      alert('공지사항 삭제에 실패했습니다.'); 
    }
  };

  const handleSetForBanner = async (targetAnnouncement: Announcement) => {
    if (!targetAnnouncement) return;
    
    try {
      // Toggle the showInBanner status for the target announcement
      await updateAnnouncement({ 
        ...targetAnnouncement, 
        showInBanner: !targetAnnouncement.showInBanner 
      });
    } catch (e) {
      console.error("Failed to update banner status for announcement:", e);
      // Handle error (e.g., show a notification to the user)
    }
  };

  // 공지 클릭 시 읽음 처리
  const handleAnnouncementClick = (announcement: Announcement) => {
    handleOpenModal(announcement);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalOpen && event.target instanceof HTMLElement && event.target.id === 'announcement-modal-overlay') {
        handleCloseModal();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isModalOpen]);

  // 모달 열릴 때 제목 input에 자동 포커스
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        const el = document.getElementById('title');
        if (el) (el as HTMLInputElement).focus();
      }, 100);
    }
  }, [isModalOpen]);

  if (loading && announcements.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="ml-3 text-lg text-slate-700">공지사항을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-screen p-6 text-center">
        <h2 className="text-2xl font-semibold text-red-700 mb-2">오류 발생</h2>
        <p className="text-slate-600 mb-4">{error}</p>
        <button
          onClick={() => fetchAnnouncements()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">공지사항 관리</h1>
        <p className="text-slate-600 mt-1">이곳에서 전체 공지사항을 관리할 수 있습니다.</p>
      </header>

      {/* 검색 입력창 */}
      <div className="mb-4 flex items-center">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="제목, 내용, 대상, 상태로 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); searchInputRef.current?.focus(); }}
            className="ml-2 text-slate-400 hover:text-slate-700"
            aria-label="검색 초기화"
          >
            ×
          </button>
        )}
      </div>

      <div className="mb-6 flex justify-end">
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <PlusCircle size={20} className="mr-2" />
          새 공지사항 추가
        </button>
      </div>

      {filteredAnnouncements.length === 0 && !loading && (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold text-slate-700 mb-2">검색 결과가 없습니다.</h3>
          <p className="text-slate-500">검색어를 지우거나, 새 공지사항을 추가해보세요.</p>
          {announcements.length === 0 && <p className="text-slate-400 mt-2">아직 등록된 공지사항이 없습니다.</p>}
        </div>
      )}

      {filteredAnnouncements.length > 0 && (
        <section className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">제목</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">대상</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">상태</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">작성일</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">배너 지정</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-slate-600 uppercase tracking-wider">관리</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {filteredAnnouncements.map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handleAnnouncementClick(announcement)}>
                      <div className="text-sm font-semibold text-slate-900 truncate max-w-xs" title={announcement.title}>
                        {announcement.title}
                        {!(announcement.readBy || []).includes(user?.id || '') && (
                          <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-red-500 text-white rounded-full align-middle">NEW</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs" title={announcement.content}>{announcement.content.substring(0, 50) + (announcement.content.length > 50 ? '...' : '')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {announcement.targetRoles?.join(', ') || '전체'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${announcement.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {announcement.isActive ? '게시됨' : '게시 안됨'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                      {format(parseISO(announcement.createdAt), 'yyyy-MM-dd HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button 
                        onClick={() => handleSetForBanner(announcement)}
                        className={`p-2 rounded-md transition-colors duration-150 
                                    ${announcement.showInBanner 
                                      ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        title={announcement.showInBanner ? "배너에서 내리기" : "배너로 지정하기"}
                      >
                        {announcement.showInBanner ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2">
                      <button 
                        onClick={() => handleOpenModal(announcement)}
                        className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded-full hover:bg-blue-100"
                        title="수정"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={() => handleOpenDeleteModal(announcement)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1 rounded-full hover:bg-red-100"
                        title="삭제"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Announcement Add/Edit Modal */}
      {isModalOpen && currentAnnouncement && (
        <div 
          id="announcement-modal-overlay"
          className="fixed inset-0 bg-black bg-opacity-60 flex items-start justify-center p-4 z-[100] transition-opacity duration-300 ease-in-out overflow-y-auto"
        >
          <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-lg transform transition-all duration-300 ease-in-out scale-100 opacity-100 my-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-slate-800">
                {isEditMode ? '공지사항 수정' : '새 공지사항 작성'}
              </h3>
              <button 
                onClick={handleCloseModal} 
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full -mr-2"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSaveAnnouncement(); }} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={currentAnnouncement.title || ''}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-400 transition-all"
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              <div>
                <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
                  내용 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={8}
                  value={currentAnnouncement.content || ''}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-400 transition-all resize-y"
                  placeholder="공지사항 내용을 입력하세요..."
                />
              </div>

              <div>
                <label htmlFor="targetRoles" className="block text-sm font-medium text-slate-700 mb-1">
                  대상
                </label>
                <select
                  id="targetRoles"
                  name="targetRoles"
                  value={currentAnnouncement.targetRoles?.join(',') || 'all'}
                  onChange={e => setTagsInput(e.target.value)}
                  className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                >
                  <option value="all">전체</option>
                  <option value="members">회원</option>
                  <option value="staff">직원</option>
                  {/* Add more specific roles/groups if needed */}
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-slate-700 mb-1">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm placeholder-slate-400 transition-all"
                  placeholder="예: 점검,중요,긴급"
                />
              </div>

              {/* 이미지 첨부 섹션 */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  이미지 첨부 (최대 5개)
                </label>
                
                {/* 드래그 앤 드롭 영역 */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                    isDragOver 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Upload className={`w-8 h-8 ${isDragOver ? 'text-blue-500' : 'text-slate-400'}`} />
                    <div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        이미지 선택
                      </button>
                      <span className="text-slate-500"> 또는 여기에 드래그하세요</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      JPG, PNG, GIF 파일만 가능 (각 파일 최대 5MB, 최대 5개)
                    </p>
                  </div>
                </div>

                {/* 숨겨진 파일 입력 */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* 이미지 미리보기 */}
                {imagePreviewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`미리보기 ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageRemove(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                          {selectedImages[index]?.name.substring(0, 10)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 기존 이미지 표시 (수정 모드일 때) */}
                {isEditMode && currentAnnouncement.images && currentAnnouncement.images.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">기존 이미지</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {currentAnnouncement.images.map((image, index) => (
                        <div key={image.id} className="relative group">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-24 object-cover rounded-lg border border-slate-200"
                          />
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                            {image.name.substring(0, 10)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-400 transition-all"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 border border-transparent rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-all"
                >
                  {isEditMode ? '변경사항 저장' : '공지사항 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && announcementToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">공지사항 삭제</h3>
                <p className="text-sm text-gray-500">이 작업은 되돌릴 수 없습니다.</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">
                <strong>제목:</strong> {announcementToDelete.title}
              </p>
              <p className="text-sm text-gray-600">
                <strong>내용:</strong> {announcementToDelete.content.substring(0, 100)}
                {announcementToDelete.content.length > 100 && '...'}
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                취소
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsManagement;
