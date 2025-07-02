import { supabase } from '../lib/supabase';
import { showError, showSuccess } from '../utils/notifications';

export interface UploadResult {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  bucket: string;
  path: string;
  uploadedAt: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class FileUploadService {
  private static instance: FileUploadService;

  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  // 파일 타입별 버킷 설정
  private getBucketName(fileType: string): string {
    if (fileType.startsWith('image/')) return 'images';
    if (fileType.includes('pdf')) return 'documents';
    if (fileType.includes('video/')) return 'videos';
    return 'files';
  }

  // 파일명 안전화
  private sanitizeFileName(fileName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    
    const safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9가-힣\-_]/g, '_')
      .substring(0, 50);
    
    return `${timestamp}_${randomString}_${safeName}.${extension}`;
  }

  // 파일 유효성 검사
  private validateFile(file: File): void {
    const maxFileSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'video/mp4', 'video/avi', 'video/mov'
    ];

    if (file.size > maxFileSize) {
      throw new Error('파일 크기는 10MB를 초과할 수 없습니다.');
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error('지원하지 않는 파일 형식입니다.');
    }
  }

  // 이미지 압축
  private async compressImage(file: File, maxWidth: number = 1920, quality: number = 0.8): Promise<File> {
    if (!file.type.startsWith('image/')) {
      return file;
    }

    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  }

  // 단일 파일 업로드
  async uploadFile(file: File, folder: string = 'general'): Promise<UploadResult> {
    try {
      this.validateFile(file);
      const processedFile = await this.compressImage(file);
      
      const bucket = this.getBucketName(file.type);
      const fileName = this.sanitizeFileName(file.name);
      const filePath = `${folder}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, processedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`파일 업로드 실패: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const result: UploadResult = {
        id: data.path,
        name: file.name,
        url: urlData.publicUrl,
        size: processedFile.size,
        type: file.type,
        bucket,
        path: filePath,
        uploadedAt: new Date().toISOString()
      };

      showSuccess(`${file.name} 업로드 완료`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '파일 업로드 중 오류가 발생했습니다';
      showError(errorMessage);
      throw error;
    }
  }

  // 다중 파일 업로드
  async uploadMultipleFiles(files: File[], folder: string = 'general'): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    let successCount = 0;
    
    for (const file of files) {
      try {
        const result = await this.uploadFile(file, folder);
        results.push(result);
        successCount++;
      } catch (error) {
        console.error(`파일 "${file.name}" 업로드 실패:`, error);
      }
    }

    if (successCount > 0) {
      showSuccess(`${successCount}개 파일 업로드 완료`);
    }

    return results;
  }

  // 파일 삭제
  async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        throw new Error(`파일 삭제 실패: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('파일 삭제 실패:', error);
      return false;
    }
  }

  // 파일 다운로드
  async downloadFile(bucket: string, path: string, fileName?: string): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error || !data) {
        throw new Error('파일을 찾을 수 없습니다');
      }

      // 브라우저에서 파일 다운로드
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || path.split('/').pop() || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '파일 다운로드 중 오류가 발생했습니다';
      showError(errorMessage);
      throw error;
    }
  }

  // 서명된 URL 생성
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error || !data?.signedUrl) {
        throw new Error('URL 생성 실패');
      }

      return data.signedUrl;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'URL 생성 중 오류가 발생했습니다';
      showError(errorMessage);
      throw error;
    }
  }

  // 파일 목록 조회
  async listFiles(bucket: string, folder?: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder);

      if (error) {
        throw new Error(`파일 목록 조회 실패: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('파일 목록 조회 실패:', error);
      return [];
    }
  }

  // 파일 정보 조회
  async getFileInfo(bucket: string, path: string): Promise<any> {
    try {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);

      return data;
    } catch (error) {
      console.error('파일 정보 조회 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 export
export const fileUploadService = FileUploadService.getInstance(); 