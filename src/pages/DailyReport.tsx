import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Megaphone,
  CalendarDays,
  PlusSquare,
  Upload,
  X,
  Image as ImageIcon,
  FileImage,
  Trash2,
  History,
  FileText,
  Eye,
  Edit3,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useReport } from '../contexts/ReportContext';
import AddReportForm from '../components/forms/AddReportForm';
import { useAuth } from '../contexts/AuthContext';
import { showSuccess, showError, showWarning, showInfo, logger } from '../utils/notifications';
import { handleError, handleValidationError, handleFileError } from '../utils/errorHandler';
import FileUpload from '../components/common/FileUpload';
import { UploadResult } from '../services/fileUploadService';

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
  size: number;
}

const DailyReport = () => {
  const { user } = useAuth();
  const { reports, createReport } = useReport();
  
  const [reportTitle, setReportTitle] = useState('');
  const [completedTasks, setCompletedTasks] = useState('');
  const [inProgressTasks, setInProgressTasks] = useState('');
  const [plannedTasks, setPlannedTasks] = useState('');
  const [issuesSuggestions, setIssuesSuggestions] = useState('');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date();
  const formattedDate = today.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  const defaultDateValue = today.toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(defaultDateValue);
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 내가 작성한 일일 보고서 필터링
  const myDailyReports = reports
    .filter(report => 
      report.type === 'daily' && 
      report.createdBy === user?.id
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 상태별 아이콘 반환
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Edit3 className="h-4 w-4 text-gray-500" />;
      case 'submitted':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'reviewed':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  // 상태별 텍스트 반환
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft':
        return '임시저장';
      case 'submitted':
        return '제출완료';
      case 'approved':
        return '승인완료';
      case 'rejected':
        return '반려';
      case 'reviewed':
        return '검토중';
      default:
        return '알 수 없음';
    }
  };

  // 상태별 배경색 반환
  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'submitted':
        return 'bg-blue-100 text-blue-700';
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      case 'reviewed':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 임시저장 데이터 복원
  useEffect(() => {
    const savedDraft = localStorage.getItem(`dailyReport_draft_${defaultDateValue}`);
    if (savedDraft) {
      try {
        const draftData = JSON.parse(savedDraft);
        setReportTitle(draftData.title || '');
        setCompletedTasks(draftData.completed || '');
        setInProgressTasks(draftData.inProgress || '');
        setPlannedTasks(draftData.planned || '');
        setIssuesSuggestions(draftData.issues || '');
        setLastSavedTime(draftData.lastSaved || null);
        // 이미지는 보안상 복원하지 않음
      } catch (error) {
        logger.error('임시저장 데이터 복원 실패', error);
      }
    }
  }, [defaultDateValue]);

  // 자동 저장 (5초마다)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (reportTitle || completedTasks || inProgressTasks || plannedTasks || issuesSuggestions) {
        const draftData = {
          title: reportTitle,
          completed: completedTasks,
          inProgress: inProgressTasks,
          planned: plannedTasks,
          issues: issuesSuggestions,
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem(`dailyReport_draft_${defaultDateValue}`, JSON.stringify(draftData));
        setLastSavedTime(draftData.lastSaved);
      }
    }, 5000); // 5초마다 자동 저장

    return () => clearInterval(autoSaveInterval);
  }, [reportTitle, completedTasks, inProgressTasks, plannedTasks, issuesSuggestions, defaultDateValue]);

  // 이미지 업로드 처리
  const handleImageUpload = (files: FileList | null) => {
    if (!files) return;

    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach(file => {
      // 파일 타입 검증
      if (!validImageTypes.includes(file.type)) {
        handleFileError(file.name, 'file_type');
        return;
      }

      // 파일 크기 검증
      if (file.size > maxFileSize) {
        handleFileError(file.name, 'file_size');
        return;
      }

      // 중복 파일 검증
      if (uploadedImages.some(img => img.name === file.name && img.size === file.size)) {
        showWarning(`${file.name}은 이미 업로드된 파일입니다.`);
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      const newImage: UploadedImage = {
        id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: imageUrl,
        name: file.name,
        size: file.size
      };

      setUploadedImages(prev => [...prev, newImage]);
    });
  };

  // 이미지 삭제
  const removeImage = (imageId: string) => {
    setUploadedImages(prev => {
      const imageToRemove = prev.find(img => img.id === imageId);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== imageId);
    });
  };

  // 파일 업로드 핸들러
  const handleFilesUploaded = (files: UploadResult[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemoved = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // 드래그 앤 드롭 처리
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    handleImageUpload(files);
  };

  // 파일 사이즈 포맷팅
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async () => {
    if (!user) {
      handleError(new Error('로그인이 필요합니다'), {
        action: 'submit_report',
        userId: undefined,
        userRole: undefined
      });
      return;
    }

    // 필수 입력값 검증
    if (!reportTitle?.trim()) {
      handleValidationError('제목', 'required');
      return;
    }

    if (!completedTasks?.trim() && !inProgressTasks?.trim() && !plannedTasks?.trim()) {
      handleValidationError('업무 내용', '최소 하나의 업무 항목은 입력해야 합니다');
      return;
    }

    const reportContent = {
      완료한업무: completedTasks,
      진행중인업무: inProgressTasks,
      예정된업무: plannedTasks,
      특이사항및건의사항: issuesSuggestions,
      첨부이미지: uploadedImages.map(img => ({
        name: img.name,
        size: img.size
      })),
      첨부파일: uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        url: file.url,
        size: file.size,
        type: file.type
      }))
    };

    try {
      const reportId = await createReport({
        title: reportTitle || `${formattedDate} 일일 업무 보고`,
        content: JSON.stringify(reportContent),
        type: 'daily',
        category: 'operational',
        status: 'submitted',
        createdBy: user.id,
        createdByName: user.name || user.email,
      });

      if (reportId) {
        // 제출 완료 후 임시저장 데이터 삭제
        localStorage.removeItem(`dailyReport_draft_${defaultDateValue}`);
        
        showSuccess('보고서가 성공적으로 제출되었습니다.');
        
        // 폼 초기화
        setReportTitle('');
        setCompletedTasks('');
        setInProgressTasks('');
        setPlannedTasks('');
        setIssuesSuggestions('');
        setUploadedImages([]);
        setUploadedFiles([]);
        setLastSavedTime(null);
        
        // 내역 탭으로 이동
        setActiveTab('history');
      } else {
        handleError(new Error('보고서 제출 실패'), {
          action: 'submit_report',
          userId: user.id,
          userRole: user.role
        });
      }
    } catch (error) {
      handleError(error, {
        action: 'submit_report',
        userId: user.id,
        userRole: user.role
      });
    }
  };

  const handleSaveDraft = () => {
    // 임시 저장 로직
    const draftData = {
      title: reportTitle,
      completed: completedTasks,
      inProgress: inProgressTasks,
      planned: plannedTasks,
      issues: issuesSuggestions,
      lastSaved: new Date().toISOString()
    };
    
    localStorage.setItem(`dailyReport_draft_${defaultDateValue}`, JSON.stringify(draftData));
    setLastSavedTime(draftData.lastSaved);
    
    logger.debug('임시 저장', draftData);
    showInfo(`보고서가 임시 저장되었습니다.\n저장 시간: ${new Date().toLocaleTimeString('ko-KR')}`);
  };

  return (
    <div className="p-6 bg-slate-100 min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        {/* 페이지 제목은 이미지에 없지만 일관성을 위해 좌측에 표시 */}
        <h1 className="text-3xl font-bold text-slate-800">일일 업무 보고</h1> 
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600">{formattedDate}</span>
        </div>
      </header>

      {/* Notice Banner */}
      <div className="bg-blue-600 text-white p-3 rounded-lg flex items-center space-x-3 mb-6 shadow-md">
        <Megaphone size={24} className="flex-shrink-0" />
        <p className="text-sm font-medium">공지사항: 이번 주 금요일 오후 3시에 전체 회의가 있습니다. 모든 직원은 참석해주세요.</p>
      </div>

      {/* Daily Report Section */}
      <section className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h2 className="text-xl font-semibold text-slate-700 mb-3 sm:mb-0">일일 업무 보고</h2>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <input 
                type="date" 
                defaultValue={defaultDateValue} 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pl-10"
              />
              <CalendarDays className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            </div>
            <button 
              onClick={() => setIsAddReportModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <PlusSquare size={18} />
              <span>새 보고서</span>
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex mb-6 border-b border-slate-200">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'create'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <PlusSquare size={16} />
              <span>보고서 작성</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 font-medium text-sm rounded-t-lg ${
              activeTab === 'history'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center space-x-2">
              <History size={16} />
              <span>내 보고 내역 ({myDailyReports.length})</span>
            </div>
          </button>
        </div>

        {/* 보고서 작성 탭 */}
        {activeTab === 'create' && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <div className="mb-6">
            <label htmlFor="reportTitle" className="block mb-1.5 text-sm font-medium text-slate-700">제목</label>
            <input 
              type="text" 
              id="reportTitle" 
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
              placeholder="업무 보고 제목을 입력하세요"
              required
            />
              {lastSavedTime && (
                <div className="mt-2 flex items-center text-xs text-slate-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  마지막 자동 저장: {new Date(lastSavedTime).toLocaleString('ko-KR')}
                </div>
              )}
          </div>

          <div className="mb-6">
            <label htmlFor="completedTasks" className="block mb-1.5 text-sm font-medium text-slate-700">오늘 완료한 업무</label>
            <textarea 
              id="completedTasks" 
              rows={5} 
              value={completedTasks}
              onChange={(e) => setCompletedTasks(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
              placeholder="오늘 완료한 업무를 상세히 작성하세요..."
            />
          </div>

          <div className="mb-6">
            <label htmlFor="inProgressTasks" className="block mb-1.5 text-sm font-medium text-slate-700">진행 중인 업무</label>
            <textarea 
              id="inProgressTasks" 
              rows={5} 
              value={inProgressTasks}
              onChange={(e) => setInProgressTasks(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
              placeholder="현재 진행 중인 업무와 진행 상황을 작성하세요..."
            />
          </div>

          <div className="mb-6">
            <label htmlFor="plannedTasks" className="block mb-1.5 text-sm font-medium text-slate-700">내일 예정된 업무</label>
            <textarea 
              id="plannedTasks" 
              rows={5} 
              value={plannedTasks}
              onChange={(e) => setPlannedTasks(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
              placeholder="내일 예정된 업무 계획을 작성하세요..."
            />
          </div>

          <div className="mb-8">
            <label htmlFor="issuesSuggestions" className="block mb-1.5 text-sm font-medium text-slate-700">특이사항 및 건의사항</label>
            <textarea 
              id="issuesSuggestions" 
              rows={5} 
              value={issuesSuggestions}
              onChange={(e) => setIssuesSuggestions(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-3"
              placeholder="업무 중 특이사항이나 건의사항이 있으면 작성하세요..."
            />
          </div>

          {/* 파일 첨부 섹션 */}
          <div className="mb-8">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              파일 첨부 (선택사항)
            </label>
            <FileUpload
              onFilesUploaded={handleFilesUploaded}
              onFileRemoved={handleFileRemoved}
              existingFiles={uploadedFiles}
              maxFiles={5}
              allowedTypes={['image/*', 'application/pdf', '.doc', '.docx', '.txt']}
              folder="daily_reports"
              multiple={true}
              className="mb-4"
            />
          </div>

          {/* 기존 이미지 업로드 (임시 유지) */}
          <div className="mb-8">
            <label className="block mb-2 text-sm font-medium text-slate-700">
              이미지 업로드 (기존 방식)
            </label>
            <div className="space-y-4">
              {/* 파일 업로드 영역 */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                  <p className="text-sm text-slate-600 mb-2">
                    <span className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                      파일을 선택하거나
                    </span>{' '}
                    드래그해서 업로드하세요
                  </p>
                  <p className="text-xs text-slate-500">
                    JPG, PNG, GIF, WebP (최대 5MB)
                  </p>
                </div>
              </div>

              {/* 업로드된 이미지 미리보기 */}
              {uploadedImages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-slate-700 flex items-center">
                    <FileImage className="h-4 w-4 mr-1" />
                    업로드된 이미지 ({uploadedImages.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedImages.map((image) => (
                      <div key={image.id} className="relative group">
                        <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(image.id);
                            }}
                            className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 px-1">
                          <p className="text-xs font-medium text-slate-700 truncate">
                            {image.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(image.size)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button 
              type="button"
              onClick={handleSaveDraft}
              className="px-6 py-2.5 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors"
            >
              임시저장
            </button>
            <button 
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              제출하기
            </button>
          </div>
        </form>
        )}

        {/* 내 보고 내역 탭 */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            {myDailyReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <p className="text-slate-600 text-lg font-medium mb-2">아직 작성한 보고서가 없습니다</p>
                <p className="text-slate-500 text-sm mb-4">첫 번째 일일 업무 보고서를 작성해보세요</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                >
                  보고서 작성하기
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-slate-600">
                    총 {myDailyReports.length}개의 보고서
                  </p>
                </div>
                
                <div className="grid gap-4">
                  {myDailyReports.map((report) => {
                    const reportContent = (() => {
                      try {
                        return JSON.parse(report.content);
                      } catch {
                        return { 완료한업무: report.content };
                      }
                    })();

                    return (
                      <div
                        key={report.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800 mb-1">
                              {report.title}
                            </h3>
                            <p className="text-sm text-slate-600">
                              {new Date(report.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                weekday: 'short'
                              })}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(report.status)}`}>
                              {getStatusIcon(report.status)}
                              <span className="ml-1">{getStatusText(report.status)}</span>
                            </span>
                            <button
                              onClick={() => {
                                setSelectedReport(report);
                                setShowDetailModal(true);
                              }}
                              className="text-slate-400 hover:text-slate-600 transition-colors"
                              title="상세 보기"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {reportContent.완료한업무 && (
                            <div>
                              <span className="font-medium text-slate-700">완료한 업무: </span>
                              <span className="text-slate-600">
                                {reportContent.완료한업무.length > 100 
                                  ? `${reportContent.완료한업무.substring(0, 100)}...` 
                                  : reportContent.완료한업무
                                }
                              </span>
                            </div>
                          )}
                          
                          {reportContent.진행중인업무 && (
                            <div>
                              <span className="font-medium text-slate-700">진행 중인 업무: </span>
                              <span className="text-slate-600">
                                {reportContent.진행중인업무.length > 100 
                                  ? `${reportContent.진행중인업무.substring(0, 100)}...` 
                                  : reportContent.진행중인업무
                                }
                              </span>
                            </div>
                          )}
                          
                          {reportContent.예정된업무 && (
                            <div>
                              <span className="font-medium text-slate-700">예정된 업무: </span>
                              <span className="text-slate-600">
                                {reportContent.예정된업무.length > 100 
                                  ? `${reportContent.예정된업무.substring(0, 100)}...` 
                                  : reportContent.예정된업무
                                }
                              </span>
                            </div>
                          )}
                          
                          {reportContent.특이사항및건의사항 && (
                            <div>
                              <span className="font-medium text-slate-700">특이사항: </span>
                              <span className="text-slate-600">
                                {reportContent.특이사항및건의사항.length > 100 
                                  ? `${reportContent.특이사항및건의사항.substring(0, 100)}...` 
                                  : reportContent.특이사항및건의사항
                                }
                              </span>
                            </div>
                          )}
                          
                          {reportContent.첨부이미지 && reportContent.첨부이미지.length > 0 && (
                            <div className="flex items-center text-slate-500">
                              <ImageIcon className="h-4 w-4 mr-1" />
                              <span>첨부 이미지 {reportContent.첨부이미지.length}개</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-slate-200 text-xs text-slate-500">
                          작성일: {new Date(report.createdAt).toLocaleString('ko-KR')}
                          {report.submittedAt && (
                            <span className="ml-4">
                              제출일: {new Date(report.submittedAt).toLocaleString('ko-KR')}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Add Report Modal */}
      {isAddReportModalOpen && (
        <AddReportForm 
          onClose={() => setIsAddReportModalOpen(false)} 
          defaultType="daily"
          initialDate={selectedDate} 
        />
      )}

      {/* Report Detail Modal */}
      {showDetailModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-slate-900">보고서 상세 보기</h2>
              </div>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedReport(null);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {(() => {
                const reportContent = (() => {
                  try {
                    return JSON.parse(selectedReport.content);
                  } catch {
                    return { 완료한업무: selectedReport.content };
                  }
                })();

                return (
                  <div className="space-y-6">
                    {/* Report Header */}
                    <div className="border-b border-slate-200 pb-4">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-2xl font-bold text-slate-900">{selectedReport.title}</h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBgColor(selectedReport.status)}`}>
                          {getStatusIcon(selectedReport.status)}
                          <span className="ml-2">{getStatusText(selectedReport.status)}</span>
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-slate-600">
                        <div className="flex items-center">
                          <CalendarDays size={16} className="mr-1" />
                          <span>
                            {new Date(selectedReport.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock size={16} className="mr-1" />
                          <span>작성일: {new Date(selectedReport.createdAt).toLocaleString('ko-KR')}</span>
                        </div>
                        {selectedReport.submittedAt && (
                          <div className="flex items-center">
                            <CheckCircle size={16} className="mr-1" />
                            <span>제출일: {new Date(selectedReport.submittedAt).toLocaleString('ko-KR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Report Content */}
                    <div className="grid gap-6">
                      {reportContent.완료한업무 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                            <CheckCircle size={20} className="mr-2" />
                            완료한 업무
                          </h4>
                          <div className="text-green-700 leading-relaxed whitespace-pre-wrap">
                            {reportContent.완료한업무}
                          </div>
                        </div>
                      )}

                      {reportContent.진행중인업무 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center">
                            <Clock size={20} className="mr-2" />
                            진행 중인 업무
                          </h4>
                          <div className="text-blue-700 leading-relaxed whitespace-pre-wrap">
                            {reportContent.진행중인업무}
                          </div>
                        </div>
                      )}

                      {reportContent.예정된업무 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
                            <CalendarDays size={20} className="mr-2" />
                            예정된 업무
                          </h4>
                          <div className="text-yellow-700 leading-relaxed whitespace-pre-wrap">
                            {reportContent.예정된업무}
                          </div>
                        </div>
                      )}

                      {reportContent.특이사항및건의사항 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                            <AlertCircle size={20} className="mr-2" />
                            특이사항 및 건의사항
                          </h4>
                          <div className="text-orange-700 leading-relaxed whitespace-pre-wrap">
                            {reportContent.특이사항및건의사항}
                          </div>
                        </div>
                      )}

                      {reportContent.첨부이미지 && reportContent.첨부이미지.length > 0 && (
                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <h4 className="text-lg font-semibold text-slate-800 mb-3 flex items-center">
                            <ImageIcon size={20} className="mr-2" />
                            첨부 이미지 ({reportContent.첨부이미지.length}개)
                          </h4>
                          <div className="space-y-2">
                            {reportContent.첨부이미지.map((image: any, index: number) => (
                              <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded border">
                                <FileImage size={20} className="text-slate-500" />
                                <div className="flex-1">
                                  <p className="font-medium text-slate-700">{image.name}</p>
                                  <p className="text-sm text-slate-500">{image.size ? `${(image.size / 1024 / 1024).toFixed(2)}MB` : '크기 정보 없음'}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-slate-200">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedReport(null);
                }}
                className="px-6 py-2 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReport;
