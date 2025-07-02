import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, FileIcon, Download, Eye, AlertCircle } from 'lucide-react';
import { fileUploadService, UploadResult } from '../../services/fileUploadService';
import { showError, showInfo } from '../../utils/notifications';

interface FileUploadProps {
  onFilesUploaded: (files: UploadResult[]) => void;
  onFileRemoved?: (fileId: string) => void;
  existingFiles?: UploadResult[];
  maxFiles?: number;
  allowedTypes?: string[];
  folder?: string;
  multiple?: boolean;
  className?: string;
  accept?: string;
  disabled?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onFileRemoved,
  existingFiles = [],
  maxFiles = 5,
  allowedTypes = ['image/*', 'application/pdf', '.doc', '.docx', '.txt'],
  folder = 'general',
  multiple = true,
  className = '',
  accept,
  disabled = false
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 파일 크기 포맷팅
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  // 파일 타입 아이콘 결정
  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('doc')) return '📝';
    if (fileType.includes('video')) return '🎥';
    return '📁';
  }, []);

  // 파일 선택 처리
  const handleFileSelect = useCallback(async (files: FileList | File[]) => {
    if (disabled || uploading) return;

    const fileArray = Array.from(files);
    const currentFileCount = existingFiles.length;
    
    // 파일 수 제한 체크
    if (currentFileCount + fileArray.length > maxFiles) {
      showError(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`);
      return;
    }

    setUploading(true);
    
    try {
      const uploadedFiles: UploadResult[] = [];
      
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const progressKey = `${file.name}-${i}`;
        
        try {
          // 진행률 업데이트 (시뮬레이션)
          setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));
          
          // 실제 파일 업로드
          const result = await fileUploadService.uploadFile(file, folder);
          uploadedFiles.push(result);
          
          // 진행률 완료
          setUploadProgress(prev => ({ ...prev, [progressKey]: 100 }));
          
          // 약간의 지연으로 사용자가 진행률을 볼 수 있게 함
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`파일 "${file.name}" 업로드 실패:`, error);
          showError(`${file.name} 업로드 실패`);
        } finally {
          // 진행률 제거
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[progressKey];
            return newProgress;
          });
        }
      }
      
      if (uploadedFiles.length > 0) {
        onFilesUploaded(uploadedFiles);
        showInfo(`${uploadedFiles.length}개 파일 업로드 완료`);
      }
      
    } catch (error) {
      console.error('파일 업로드 실패:', error);
      showError('파일 업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [disabled, uploading, existingFiles.length, maxFiles, folder, onFilesUploaded]);

  // 드래그 앤 드롭 이벤트
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !uploading) {
      setDragOver(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled || uploading) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [disabled, uploading, handleFileSelect]);

  // 파일 입력 클릭
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // 파일 제거
  const handleRemoveFile = useCallback(async (file: UploadResult) => {
    try {
      // Supabase Storage에서 파일 삭제
      await fileUploadService.deleteFile(file.bucket, file.path);
      
      // 부모 컴포넌트에 알림
      onFileRemoved?.(file.id);
      
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      showError('파일 삭제 중 오류가 발생했습니다');
    }
  }, [onFileRemoved]);

  // 파일 다운로드
  const handleDownloadFile = useCallback(async (file: UploadResult) => {
    try {
      await fileUploadService.downloadFile(file.bucket, file.path, file.name);
    } catch (error) {
      console.error('파일 다운로드 실패:', error);
      showError('파일 다운로드 중 오류가 발생했습니다');
    }
  }, []);

  // 파일 미리보기
  const handlePreviewFile = useCallback((file: UploadResult) => {
    if (file.type.startsWith('image/')) {
      window.open(file.url, '_blank');
    } else {
      // 다른 파일 타입은 다운로드
      handleDownloadFile(file);
    }
  }, [handleDownloadFile]);

  const acceptString = accept || allowedTypes.join(',');

  return (
    <div className={`file-upload-container ${className}`}>
      {/* 파일 업로드 영역 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
          ${dragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
          ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={acceptString}
          onChange={handleInputChange}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-3">
          <Upload className={`w-12 h-12 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <div>
            <p className="text-lg font-medium text-gray-700">
              {uploading ? '업로드 중...' : '파일을 선택하거나 드래그하세요'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {allowedTypes.join(', ')} 파일 지원 (최대 {maxFiles}개, 각 10MB 이하)
            </p>
          </div>
          
          {!disabled && !uploading && (
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              파일 선택
            </button>
          )}
        </div>
      </div>

      {/* 업로드 진행률 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">업로드 진행률</h4>
          {Object.entries(uploadProgress).map(([key, progress]) => (
            <div key={key} className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* 업로드된 파일 목록 */}
      {existingFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <FileIcon className="w-4 h-4 mr-1" />
            첨부된 파일 ({existingFiles.length})
          </h4>
          
          <div className="space-y-2">
            {existingFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <span className="text-2xl">{getFileIcon(file.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePreviewFile(file)}
                    className="p-1 text-blue-600 hover:bg-blue-50:bg-blue-900/20 rounded transition-colors"
                    title={file.type.startsWith('image/') ? '미리보기' : '다운로드'}
                  >
                    {file.type.startsWith('image/') ? <Eye className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  </button>
                  
                  {onFileRemoved && (
                    <button
                      onClick={() => handleRemoveFile(file)}
                      className="p-1 text-red-600 hover:bg-red-50:bg-red-900/20 rounded transition-colors"
                      title="파일 삭제"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 경고 메시지 */}
      {existingFiles.length >= maxFiles && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-800">
            최대 파일 수({maxFiles}개)에 도달했습니다. 추가 업로드를 위해서는 기존 파일을 삭제해주세요.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 