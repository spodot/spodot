import { supabase } from '../lib/supabase';
import { UploadResult } from './fileUploadService';
import { showError, showSuccess } from '../utils/notifications';

export interface FileAttachment {
  id: string;
  entityType: 'task' | 'report' | 'announcement' | 'daily_report';
  entityId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  bucketName: string;
  filePath: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
}

export class FileAttachmentService {
  private static instance: FileAttachmentService;

  static getInstance(): FileAttachmentService {
    if (!FileAttachmentService.instance) {
      FileAttachmentService.instance = new FileAttachmentService();
    }
    return FileAttachmentService.instance;
  }

  // 파일 첨부 정보 저장
  async saveAttachment(
    entityType: FileAttachment['entityType'],
    entityId: string,
    uploadResult: UploadResult,
    userId?: string,
    userName?: string
  ): Promise<FileAttachment | null> {
    try {
      const attachmentData = {
        entity_type: entityType,
        entity_id: entityId,
        file_name: uploadResult.name,
        original_name: uploadResult.name,
        file_size: uploadResult.size,
        file_type: uploadResult.type,
        file_url: uploadResult.url,
        bucket_name: uploadResult.bucket,
        file_path: uploadResult.path,
        uploaded_by: userId,
        uploaded_by_name: userName
      };

      const { data, error } = await supabase
        .from('file_attachments')
        .insert(attachmentData)
        .select()
        .single();

      if (error) {
        throw new Error(`파일 첨부 정보 저장 실패: ${error.message}`);
      }

      return {
        id: data.id,
        entityType: data.entity_type,
        entityId: data.entity_id,
        fileName: data.file_name,
        originalName: data.original_name,
        fileSize: data.file_size,
        fileType: data.file_type,
        fileUrl: data.file_url,
        bucketName: data.bucket_name,
        filePath: data.file_path,
        uploadedBy: data.uploaded_by,
        uploadedByName: data.uploaded_by_name,
        uploadedAt: data.uploaded_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

    } catch (error) {
      console.error('파일 첨부 정보 저장 실패:', error);
      showError('파일 첨부 정보 저장 중 오류가 발생했습니다');
      return null;
    }
  }

  // 다중 파일 첨부 정보 저장
  async saveMultipleAttachments(
    entityType: FileAttachment['entityType'],
    entityId: string,
    uploadResults: UploadResult[],
    userId?: string,
    userName?: string
  ): Promise<FileAttachment[]> {
    const attachments: FileAttachment[] = [];
    
    for (const uploadResult of uploadResults) {
      const attachment = await this.saveAttachment(entityType, entityId, uploadResult, userId, userName);
      if (attachment) {
        attachments.push(attachment);
      }
    }

    if (attachments.length > 0) {
      showSuccess(`${attachments.length}개 파일 첨부 정보 저장 완료`);
    }

    return attachments;
  }

  // 엔티티의 첨부파일 목록 조회
  async getAttachmentsByEntity(
    entityType: FileAttachment['entityType'],
    entityId: string
  ): Promise<FileAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`첨부파일 목록 조회 실패: ${error.message}`);
      }

      return (data || []).map(item => ({
        id: item.id,
        entityType: item.entity_type,
        entityId: item.entity_id,
        fileName: item.file_name,
        originalName: item.original_name,
        fileSize: item.file_size,
        fileType: item.file_type,
        fileUrl: item.file_url,
        bucketName: item.bucket_name,
        filePath: item.file_path,
        uploadedBy: item.uploaded_by,
        uploadedByName: item.uploaded_by_name,
        uploadedAt: item.uploaded_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

    } catch (error) {
      console.error('첨부파일 목록 조회 실패:', error);
      return [];
    }
  }

  // 첨부파일 삭제
  async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('id', attachmentId);

      if (error) {
        throw new Error(`첨부파일 삭제 실패: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('첨부파일 삭제 실패:', error);
      showError('첨부파일 삭제 중 오류가 발생했습니다');
      return false;
    }
  }

  // 엔티티의 모든 첨부파일 삭제
  async deleteAllAttachmentsByEntity(
    entityType: FileAttachment['entityType'],
    entityId: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('file_attachments')
        .delete()
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (error) {
        throw new Error(`엔티티 첨부파일 삭제 실패: ${error.message}`);
      }

      return true;
    } catch (error) {
      console.error('엔티티 첨부파일 삭제 실패:', error);
      return false;
    }
  }

  // 특정 사용자가 업로드한 첨부파일 조회
  async getAttachmentsByUser(userId: string): Promise<FileAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('*')
        .eq('uploaded_by', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`사용자 첨부파일 조회 실패: ${error.message}`);
      }

      return (data || []).map(item => ({
        id: item.id,
        entityType: item.entity_type,
        entityId: item.entity_id,
        fileName: item.file_name,
        originalName: item.original_name,
        fileSize: item.file_size,
        fileType: item.file_type,
        fileUrl: item.file_url,
        bucketName: item.bucket_name,
        filePath: item.file_path,
        uploadedBy: item.uploaded_by,
        uploadedByName: item.uploaded_by_name,
        uploadedAt: item.uploaded_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

    } catch (error) {
      console.error('사용자 첨부파일 조회 실패:', error);
      return [];
    }
  }

  // 파일 타입별 첨부파일 통계
  async getAttachmentStats(): Promise<{ [fileType: string]: number }> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('file_type');

      if (error) {
        throw new Error(`첨부파일 통계 조회 실패: ${error.message}`);
      }

      const stats: { [fileType: string]: number } = {};
      
      (data || []).forEach(item => {
        const fileType = item.file_type.split('/')[0]; // 'image/jpeg' -> 'image'
        stats[fileType] = (stats[fileType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('첨부파일 통계 조회 실패:', error);
      return {};
    }
  }

  // 스토리지 사용량 조회
  async getStorageUsage(): Promise<{ totalFiles: number; totalSize: number }> {
    try {
      const { data, error } = await supabase
        .from('file_attachments')
        .select('file_size');

      if (error) {
        throw new Error(`스토리지 사용량 조회 실패: ${error.message}`);
      }

      const totalFiles = data?.length || 0;
      const totalSize = (data || []).reduce((sum, item) => sum + (item.file_size || 0), 0);

      return { totalFiles, totalSize };
    } catch (error) {
      console.error('스토리지 사용량 조회 실패:', error);
      return { totalFiles: 0, totalSize: 0 };
    }
  }

  // 첨부파일 수 업데이트 (트리거가 있지만 수동 동기화용)
  async updateAttachmentCount(
    entityType: FileAttachment['entityType'],
    entityId: string
  ): Promise<boolean> {
    try {
      const attachments = await this.getAttachmentsByEntity(entityType, entityId);
      const count = attachments.length;

      let tableName = '';
      switch (entityType) {
        case 'task':
          tableName = 'tasks';
          break;
        case 'daily_report':
          tableName = 'daily_reports';
          break;
        case 'announcement':
          tableName = 'announcements';
          break;
        case 'report':
          tableName = 'reports';
          break;
      }

      if (tableName) {
        const { error } = await supabase
          .from(tableName)
          .update({ attachment_count: count })
          .eq('id', entityId);

        if (error) {
          throw new Error(`첨부파일 수 업데이트 실패: ${error.message}`);
        }
      }

      return true;
    } catch (error) {
      console.error('첨부파일 수 업데이트 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 export
export const fileAttachmentService = FileAttachmentService.getInstance(); 