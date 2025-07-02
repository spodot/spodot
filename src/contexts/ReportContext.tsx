import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useUser } from './UserContext';
import { formatISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// 보고서 상태 타입
export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';

// 보고서 타입
export type ReportType = 'daily' | 'weekly' | 'monthly' | 'performance' | 'incident' | 'custom';

// 보고서 카테고리
export type ReportCategory = 'trainer' | 'facility' | 'client' | 'financial' | 'operational';

// 보고서 인터페이스
export interface Report {
  id: string;
  title: string;
  content: string;
  type: ReportType;
  category: ReportCategory;
  status: ReportStatus;
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  comments?: ReportComment[];
  attachments?: ReportAttachment[];
  metrics?: {
    [key: string]: number | string;
  };
  period?: {
    startDate: string;
    endDate: string;
  };
  tags?: string[];
}

// 보고서 댓글 인터페이스
export interface ReportComment {
  id: string;
  reportId: string;
  content: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
}

// 보고서 첨부파일 인터페이스
export interface ReportAttachment {
  id: string;
  reportId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

// 보고서 템플릿 인터페이스
export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  category: ReportCategory;
  structure: {
    sections: {
      title: string;
      description?: string;
      type: 'text' | 'metrics' | 'list' | 'table';
      required: boolean;
    }[];
    metrics?: {
      name: string;
      label: string;
      unit?: string;
      type: 'number' | 'percentage' | 'currency' | 'text';
      required: boolean;
    }[];
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 보고서 필터 옵션 인터페이스
interface ReportFilterOptions {
  type?: ReportType | 'all';
  category?: ReportCategory | 'all';
  status?: ReportStatus | 'all';
  startDate?: string;
  endDate?: string;
  createdBy?: string;
  assignedTo?: string;
  searchQuery?: string;
}

// 리포트 컨텍스트 인터페이스
interface ReportContextType {
  reports: Report[];
  templates: ReportTemplate[];
  filteredReports: Report[];
  loading: boolean;
  error: string | null;
  
  // 필터링
  filterReports: (options: ReportFilterOptions) => void;
  
  // 보고서 CRUD
  createReport: (report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateReport: (id: string, reportData: Partial<Report>) => Promise<boolean>;
  deleteReport: (id: string) => Promise<boolean>;
  getReportById: (id: string) => Report | undefined;
  
  // 보고서 상태 변경
  submitReport: (id: string) => Promise<boolean>;
  reviewReport: (id: string, reviewerId: string, reviewerName: string, approved: boolean) => Promise<boolean>;
  
  // 보고서 댓글
  addComment: (reportId: string, comment: Omit<ReportComment, 'id' | 'reportId' | 'createdAt'>) => Promise<string | null>;
  deleteComment: (reportId: string, commentId: string) => Promise<boolean>;
  
  // 보고서 첨부파일
  addAttachment: (reportId: string, attachment: Omit<ReportAttachment, 'id' | 'reportId' | 'uploadedAt'>) => Promise<string | null>;
  deleteAttachment: (reportId: string, attachmentId: string) => Promise<boolean>;
  
  // 템플릿 관리
  createTemplate: (template: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateTemplate: (id: string, templateData: Partial<ReportTemplate>) => Promise<boolean>;
  deleteTemplate: (id: string) => Promise<boolean>;
  getTemplateById: (id: string) => ReportTemplate | undefined;
  
  // 통계 및 분석
  getReportStatsByPeriod: (startDate: string, endDate: string) => {
    total: number;
    byStatus: Record<ReportStatus, number>;
    byType: Record<ReportType, number>;
    byCategory: Record<ReportCategory, number>;
  };
  getUserReportStats: (userId: string) => {
    created: number;
    submitted: number;
    approved: number;
    rejected: number;
  };

  // 데이터 새로고침
  fetchReports: () => Promise<void>;
  fetchTemplates: () => Promise<void>;
}

const ReportContext = createContext<ReportContextType | undefined>(undefined);

export const ReportProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { users } = useUser();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 localStorage 데이터를 Supabase로 마이그레이션
  const migrateLocalStorageData = useCallback(async () => {
    if (!user) return;

    const savedReports = localStorage.getItem('reports');
    const savedTemplates = localStorage.getItem('reportTemplates');
    
    try {
      // 보고서 마이그레이션
      if (savedReports) {
        const localReports: Report[] = JSON.parse(savedReports);
        console.log(`📦 로컬 스토리지에서 ${localReports.length}개의 보고서를 발견했습니다.`);
        
        if (localReports.length > 0) {
          // 기존 Supabase 데이터 확인
          const { data: existingReports } = await supabase
            .from('reports')
            .select('id')
            .limit(1);

          if (!existingReports || existingReports.length === 0) {
            let migratedCount = 0;
            for (const localReport of localReports) {
              try {
                const { error: insertError } = await supabase
                  .from('reports')
                  .insert({
                    title: localReport.title,
                    content: localReport.content,
                    type: localReport.type,
                    category: localReport.category,
                    status: localReport.status,
                    created_by: localReport.createdBy,
                    created_by_name: localReport.createdByName,
                    assigned_to: localReport.assignedTo,
                    assigned_to_name: localReport.assignedToName,
                    submitted_at: localReport.submittedAt,
                    reviewed_at: localReport.reviewedAt,
                    reviewed_by: localReport.reviewedBy,
                    reviewed_by_name: localReport.reviewedByName,
                    metrics: localReport.metrics,
                    period_start: localReport.period?.startDate,
                    period_end: localReport.period?.endDate,
                    tags: localReport.tags
                  });

                if (!insertError) {
                  migratedCount++;
                }
              } catch (err) {
                console.error(`보고서 "${localReport.title}" 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 보고서가 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem('reports');
      }

      // 템플릿 마이그레이션
      if (savedTemplates) {
        const localTemplates: ReportTemplate[] = JSON.parse(savedTemplates);
        console.log(`📦 로컬 스토리지에서 ${localTemplates.length}개의 템플릿을 발견했습니다.`);
        
        if (localTemplates.length > 0) {
          // 기존 Supabase 데이터 확인
          const { data: existingTemplates } = await supabase
            .from('report_templates')
            .select('id')
            .limit(1);

          if (!existingTemplates || existingTemplates.length === 0) {
            let migratedCount = 0;
            for (const localTemplate of localTemplates) {
              try {
                const { error: insertError } = await supabase
                  .from('report_templates')
                  .insert({
                    title: localTemplate.title,
                    description: localTemplate.description,
                    type: localTemplate.type,
                    category: localTemplate.category,
                    structure: localTemplate.structure,
                    created_by: localTemplate.createdBy
                  });

                if (!insertError) {
                  migratedCount++;
                }
              } catch (err) {
                console.error(`템플릿 "${localTemplate.title}" 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 템플릿이 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem('reportTemplates');
      }
      
    } catch (err) {
      console.error('보고서 마이그레이션 실패:', err);
    }
  }, [user]);

  // Supabase에서 Report 데이터를 가져와서 내부 인터페이스로 변환
  const convertSupabaseReportToReport = async (supabaseReport: any): Promise<Report> => {
    // 댓글 조회
    const { data: commentsData } = await supabase
      .from('report_comments')
      .select('*')
      .eq('report_id', supabaseReport.id)
      .order('created_at', { ascending: true });

    const comments: ReportComment[] = commentsData ? commentsData.map(comment => ({
      id: comment.id,
      reportId: comment.report_id,
      content: comment.content,
      createdBy: comment.created_by,
      createdByName: comment.created_by_name,
      createdAt: comment.created_at || new Date().toISOString()
    })) : [];

    return {
      id: supabaseReport.id,
      title: supabaseReport.title,
      content: supabaseReport.content,
      type: supabaseReport.type,
      category: supabaseReport.category,
      status: supabaseReport.status,
      createdBy: supabaseReport.created_by,
      createdByName: supabaseReport.created_by_name,
      assignedTo: supabaseReport.assigned_to,
      assignedToName: supabaseReport.assigned_to_name,
      createdAt: supabaseReport.created_at || new Date().toISOString(),
      updatedAt: supabaseReport.updated_at || new Date().toISOString(),
      submittedAt: supabaseReport.submitted_at,
      reviewedAt: supabaseReport.reviewed_at,
      reviewedBy: supabaseReport.reviewed_by,
      reviewedByName: supabaseReport.reviewed_by_name,
      comments,
      attachments: [], // 첨부파일은 별도 테이블로 구현 가능
      metrics: supabaseReport.metrics,
      period: supabaseReport.period_start && supabaseReport.period_end ? {
        startDate: supabaseReport.period_start,
        endDate: supabaseReport.period_end
      } : undefined,
      tags: supabaseReport.tags || []
    };
  };

  // Supabase에서 ReportTemplate 데이터를 가져와서 내부 인터페이스로 변환
  const convertSupabaseTemplateToTemplate = (supabaseTemplate: any): ReportTemplate => {
    return {
      id: supabaseTemplate.id,
      title: supabaseTemplate.title,
      description: supabaseTemplate.description,
      type: supabaseTemplate.type,
      category: supabaseTemplate.category,
      structure: supabaseTemplate.structure,
      createdBy: supabaseTemplate.created_by,
      createdAt: supabaseTemplate.created_at || new Date().toISOString(),
      updatedAt: supabaseTemplate.updated_at || new Date().toISOString()
    };
  };

  // Supabase에서 보고서 데이터 가져오기
  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: supabaseReports, error: fetchError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (supabaseReports && supabaseReports.length > 0) {
        const convertedReports = await Promise.all(
          supabaseReports.map(convertSupabaseReportToReport)
        );
        setReports(convertedReports);
        setFilteredReports(convertedReports);
      } else if (user) {
        // 데이터가 없으면 샘플 데이터 생성
        await generateSampleReportsInSupabase();
        // 다시 가져오기
        const { data: newData } = await supabase
          .from('reports')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (newData) {
          const convertedReports = await Promise.all(
            newData.map(convertSupabaseReportToReport)
          );
          setReports(convertedReports);
          setFilteredReports(convertedReports);
        }
      }
    } catch (err) {
      console.error('보고서 데이터 가져오기 실패:', err);
      setError('보고서를 불러오는 중 오류가 발생했습니다.');
    }
  }, [user]);

  // Supabase에서 템플릿 데이터 가져오기
  const fetchTemplates = useCallback(async () => {
    try {
      const { data: supabaseTemplates, error: fetchError } = await supabase
        .from('report_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (supabaseTemplates && supabaseTemplates.length > 0) {
        const convertedTemplates = supabaseTemplates.map(convertSupabaseTemplateToTemplate);
        setTemplates(convertedTemplates);
      } else if (user) {
        // 데이터가 없으면 샘플 템플릿 생성
        await generateSampleTemplatesInSupabase();
        // 다시 가져오기
        const { data: newData } = await supabase
          .from('report_templates')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (newData) {
          const convertedTemplates = newData.map(convertSupabaseTemplateToTemplate);
          setTemplates(convertedTemplates);
        }
      }
    } catch (err) {
      console.error('템플릿 데이터 가져오기 실패:', err);
      setError('템플릿을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 샘플 템플릿을 Supabase에 생성
  const generateSampleTemplatesInSupabase = async () => {
    if (!user) return;

    const sampleTemplates = [
      {
        title: '일일 트레이너 리포트',
        description: '트레이너의 일일 활동 및 성과를 기록하는 템플릿입니다.',
        type: 'daily' as const,
        category: 'trainer' as const,
        structure: {
          sections: [
            {
              title: '요약',
              description: '오늘의 활동 요약을 작성하세요.',
              type: 'text',
              required: true
            },
            {
              title: '진행된 세션',
              description: '오늘 완료한 세션 정보를 작성하세요.',
              type: 'table',
              required: true
            },
            {
              title: '특이사항',
              description: '특별히 보고할 사항이 있으면 작성하세요.',
              type: 'text',
              required: false
            }
          ],
          metrics: [
            {
              name: 'totalSessions',
              label: '총 세션 수',
              type: 'number',
              required: true
            },
            {
              name: 'clientsAttended',
              label: '참석 고객 수',
              type: 'number',
              required: true
            }
          ]
        },
        created_by: user.id
      },
      {
        title: '시설 점검 보고서',
        description: '헬스장 시설 및 장비 점검 결과를 기록하는 템플릿입니다.',
        type: 'daily' as const,
        category: 'facility' as const,
        structure: {
          sections: [
            {
              title: '점검 항목',
              description: '점검한 시설 및 장비를 나열하세요.',
              type: 'list',
              required: true
            },
            {
              title: '이상 사항',
              description: '발견된 문제점이나 수리가 필요한 항목을 작성하세요.',
              type: 'text',
              required: false
            }
          ],
          metrics: [
            {
              name: 'checkedItems',
              label: '점검 항목 수',
              type: 'number',
              required: true
            },
            {
              name: 'issuesFound',
              label: '발견된 문제 수',
              type: 'number',
              required: true
            }
          ]
        },
        created_by: user.id
      }
    ];

    try {
      const { error } = await supabase
        .from('report_templates')
        .insert(sampleTemplates);

      if (error) {
        console.error('샘플 템플릿 생성 실패:', error);
      } else {
        console.log('✅ 샘플 템플릿이 성공적으로 생성되었습니다.');
      }
    } catch (err) {
      console.error('샘플 템플릿 생성 중 오류:', err);
    }
  };
  
  // 샘플 보고서를 Supabase에 생성
  const generateSampleReportsInSupabase = async () => {
    if (!user) return;

    const sampleReports = [
      {
        title: '2024년 1월 15일 트레이너 일일 보고서',
        content: '오늘 총 8명의 고객과 개인 트레이닝을 진행했습니다...',
        type: 'daily' as const,
        category: 'trainer' as const,
        status: 'submitted' as const,
        created_by: user.id,
        created_by_name: user.name,
        metrics: {
          totalSessions: 8,
          clientsAttended: 8,
          revenue: 240000
        },
        period_start: '2024-01-15',
        period_end: '2024-01-15',
        tags: ['트레이닝', '일일보고']
      },
      {
        title: '헬스장 시설 점검 보고서 - 1월 둘째 주',
        content: '이번 주 시설 점검을 완료했습니다...',
        type: 'weekly' as const,
        category: 'facility' as const,
        status: 'approved' as const,
        created_by: user.id,
        created_by_name: user.name,
        metrics: {
          checkedItems: 25,
          issuesFound: 2
        },
        period_start: '2024-01-08',
        period_end: '2024-01-14',
        tags: ['시설점검', '주간보고']
      }
    ];

    try {
      const { error } = await supabase
        .from('reports')
        .insert(sampleReports);

      if (error) {
        console.error('샘플 보고서 생성 실패:', error);
      } else {
        console.log('✅ 샘플 보고서가 성공적으로 생성되었습니다.');
    }
    } catch (err) {
      console.error('샘플 보고서 생성 중 오류:', err);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (user) {
      // localStorage 마이그레이션 먼저 실행 후 데이터 가져오기
      migrateLocalStorageData().finally(() => {
        Promise.all([fetchReports(), fetchTemplates()]);
      });
    }
  }, [user, migrateLocalStorageData, fetchReports, fetchTemplates]);
  
  // 보고서 필터링
  const filterReports = (options: ReportFilterOptions) => {
    let filtered = [...reports];
    
    if (options.type && options.type !== 'all') {
      filtered = filtered.filter(report => report.type === options.type);
    }
    
    if (options.category && options.category !== 'all') {
      filtered = filtered.filter(report => report.category === options.category);
    }
    
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(report => report.status === options.status);
    }
    
    if (options.startDate) {
      filtered = filtered.filter(report => report.createdAt >= options.startDate!);
    }
    
    if (options.endDate) {
      filtered = filtered.filter(report => report.createdAt <= options.endDate!);
    }
    
    if (options.createdBy) {
      filtered = filtered.filter(report => report.createdBy === options.createdBy);
    }
    
    if (options.assignedTo) {
      filtered = filtered.filter(report => report.assignedTo === options.assignedTo);
    }
    
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(report => 
        report.title.toLowerCase().includes(query) ||
        report.content.toLowerCase().includes(query) ||
        report.createdByName.toLowerCase().includes(query)
      );
    }
    
    setFilteredReports(filtered);
  };
  
  // 보고서 조회
  const getReportById = (id: string) => {
    return reports.find(report => report.id === id);
  };
  
  // 템플릿 조회
  const getTemplateById = (id: string) => {
    return templates.find(template => template.id === id);
  };
  
  // 보고서 생성
  const createReport = async (reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
      const { data: newSupabaseReport, error: insertError } = await supabase
        .from('reports')
        .insert({
          title: reportData.title,
          content: reportData.content,
          type: reportData.type,
          category: reportData.category,
          status: reportData.status,
          created_by: reportData.createdBy,
          created_by_name: reportData.createdByName,
          assigned_to: reportData.assignedTo,
          assigned_to_name: reportData.assignedToName,
          submitted_at: reportData.submittedAt,
          reviewed_at: reportData.reviewedAt,
          reviewed_by: reportData.reviewedBy,
          reviewed_by_name: reportData.reviewedByName,
          metrics: reportData.metrics,
          period_start: reportData.period?.startDate,
          period_end: reportData.period?.endDate,
          tags: reportData.tags
        })
        .select()
        .single();

      if (insertError) {
        console.error('보고서 추가 실패:', insertError);
        setError('보고서 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newSupabaseReport) {
        // 상태 업데이트
        await fetchReports();
        return newSupabaseReport.id;
      }

      return null;
    } catch (err) {
      console.error('보고서 추가 중 오류:', err);
      setError('보고서 추가 중 오류가 발생했습니다.');
      return null;
    }
  };
  
  // 보고서 수정
  const updateReport = async (id: string, reportData: Partial<Report>): Promise<boolean> => {
    try {
      const updatePayload: any = {};
      
      if (reportData.title !== undefined) updatePayload.title = reportData.title;
      if (reportData.content !== undefined) updatePayload.content = reportData.content;
      if (reportData.type !== undefined) updatePayload.type = reportData.type;
      if (reportData.category !== undefined) updatePayload.category = reportData.category;
      if (reportData.status !== undefined) updatePayload.status = reportData.status;
      if (reportData.assignedTo !== undefined) updatePayload.assigned_to = reportData.assignedTo;
      if (reportData.assignedToName !== undefined) updatePayload.assigned_to_name = reportData.assignedToName;
      if (reportData.submittedAt !== undefined) updatePayload.submitted_at = reportData.submittedAt;
      if (reportData.reviewedAt !== undefined) updatePayload.reviewed_at = reportData.reviewedAt;
      if (reportData.reviewedBy !== undefined) updatePayload.reviewed_by = reportData.reviewedBy;
      if (reportData.reviewedByName !== undefined) updatePayload.reviewed_by_name = reportData.reviewedByName;
      if (reportData.metrics !== undefined) updatePayload.metrics = reportData.metrics;
      if (reportData.period !== undefined) {
        updatePayload.period_start = reportData.period?.startDate;
        updatePayload.period_end = reportData.period?.endDate;
      }
      if (reportData.tags !== undefined) updatePayload.tags = reportData.tags;

      const { error: updateError } = await supabase
        .from('reports')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        console.error('보고서 수정 실패:', updateError);
        setError('보고서 수정 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchReports();
      return true;
    } catch (err) {
      console.error('보고서 수정 중 오류:', err);
      setError('보고서 수정 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 보고서 삭제
  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      // 관련 댓글도 함께 삭제
      await supabase
        .from('report_comments')
        .delete()
        .eq('report_id', id);

      const { error: deleteError } = await supabase
        .from('reports')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('보고서 삭제 실패:', deleteError);
        setError('보고서 삭제 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchReports();
      return true;
    } catch (err) {
      console.error('보고서 삭제 중 오류:', err);
      setError('보고서 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 보고서 제출
  const submitReport = async (id: string): Promise<boolean> => {
    return await updateReport(id, { 
              status: 'submitted', 
      submittedAt: new Date().toISOString() 
    });
  };
  
  // 보고서 검토
  const reviewReport = async (id: string, reviewerId: string, reviewerName: string, approved: boolean): Promise<boolean> => {
    return await updateReport(id, {
              status: approved ? 'approved' : 'rejected', 
              reviewedAt: new Date().toISOString(),
              reviewedBy: reviewerId,
      reviewedByName: reviewerName
    });
  };
  
  // 댓글 추가
  const addComment = async (reportId: string, commentData: Omit<ReportComment, 'id' | 'reportId' | 'createdAt'>): Promise<string | null> => {
    try {
      const { data: newComment, error: insertError } = await supabase
        .from('report_comments')
        .insert({
          report_id: reportId,
          content: commentData.content,
          created_by: commentData.createdBy,
          created_by_name: commentData.createdByName
        })
        .select()
        .single();

      if (insertError) {
        console.error('댓글 추가 실패:', insertError);
        setError('댓글 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newComment) {
        // 상태 업데이트
        await fetchReports();
        return newComment.id;
      }

      return null;
    } catch (err) {
      console.error('댓글 추가 중 오류:', err);
      setError('댓글 추가 중 오류가 발생했습니다.');
      return null;
    }
  };
  
  // 댓글 삭제
  const deleteComment = async (reportId: string, commentId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('report_comments')
        .delete()
        .eq('id', commentId);

      if (deleteError) {
        console.error('댓글 삭제 실패:', deleteError);
        setError('댓글 삭제 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchReports();
      return true;
    } catch (err) {
      console.error('댓글 삭제 중 오류:', err);
      setError('댓글 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 첨부파일 추가 (향후 구현)
  const addAttachment = async (reportId: string, attachment: Omit<ReportAttachment, 'id' | 'reportId' | 'uploadedAt'>): Promise<string | null> => {
    // TODO: 첨부파일 기능은 별도 테이블과 스토리지 연동 필요
    console.log('첨부파일 기능은 향후 구현 예정입니다.');
    return null;
  };
  
  // 첨부파일 삭제 (향후 구현)
  const deleteAttachment = async (reportId: string, attachmentId: string): Promise<boolean> => {
    // TODO: 첨부파일 기능은 별도 테이블과 스토리지 연동 필요
    console.log('첨부파일 기능은 향후 구현 예정입니다.');
    return false;
  };
  
  // 템플릿 생성
  const createTemplate = async (templateData: Omit<ReportTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    try {
      const { data: newTemplate, error: insertError } = await supabase
        .from('report_templates')
        .insert({
          title: templateData.title,
          description: templateData.description,
          type: templateData.type,
          category: templateData.category,
          structure: templateData.structure,
          created_by: templateData.createdBy
        })
        .select()
        .single();

      if (insertError) {
        console.error('템플릿 추가 실패:', insertError);
        setError('템플릿 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newTemplate) {
        // 상태 업데이트
        await fetchTemplates();
        return newTemplate.id;
      }

      return null;
    } catch (err) {
      console.error('템플릿 추가 중 오류:', err);
      setError('템플릿 추가 중 오류가 발생했습니다.');
      return null;
    }
  };
  
  // 템플릿 수정
  const updateTemplate = async (id: string, templateData: Partial<ReportTemplate>): Promise<boolean> => {
    try {
      const updatePayload: any = {};
      
      if (templateData.title !== undefined) updatePayload.title = templateData.title;
      if (templateData.description !== undefined) updatePayload.description = templateData.description;
      if (templateData.type !== undefined) updatePayload.type = templateData.type;
      if (templateData.category !== undefined) updatePayload.category = templateData.category;
      if (templateData.structure !== undefined) updatePayload.structure = templateData.structure;

      const { error: updateError } = await supabase
        .from('report_templates')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) {
        console.error('템플릿 수정 실패:', updateError);
        setError('템플릿 수정 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('템플릿 수정 중 오류:', err);
      setError('템플릿 수정 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 템플릿 삭제
  const deleteTemplate = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('report_templates')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('템플릿 삭제 실패:', deleteError);
        setError('템플릿 삭제 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchTemplates();
      return true;
    } catch (err) {
      console.error('템플릿 삭제 중 오류:', err);
      setError('템플릿 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };
  
  // 기간별 보고서 통계
  const getReportStatsByPeriod = (startDate: string, endDate: string) => {
    const filteredByPeriod = reports.filter(report => 
      report.createdAt >= startDate && report.createdAt <= endDate
    );
    
    const byStatus = filteredByPeriod.reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<ReportStatus, number>);
    
    const byType = filteredByPeriod.reduce((acc, report) => {
      acc[report.type] = (acc[report.type] || 0) + 1;
      return acc;
    }, {} as Record<ReportType, number>);

    const byCategory = filteredByPeriod.reduce((acc, report) => {
      acc[report.category] = (acc[report.category] || 0) + 1;
      return acc;
    }, {} as Record<ReportCategory, number>);
    
    return {
      total: filteredByPeriod.length,
      byStatus,
      byType,
      byCategory
    };
  };
  
  // 사용자별 보고서 통계
  const getUserReportStats = (userId: string) => {
    const userReports = reports.filter(report => report.createdBy === userId);
    
    return {
      created: userReports.length,
      submitted: userReports.filter(r => r.status === 'submitted').length,
      approved: userReports.filter(r => r.status === 'approved').length,
      rejected: userReports.filter(r => r.status === 'rejected').length
    };
  };
  
  const contextValue: ReportContextType = {
        reports,
        templates,
        filteredReports,
    loading,
    error,
        filterReports,
        createReport,
        updateReport,
        deleteReport,
        getReportById,
        submitReport,
        reviewReport,
        addComment,
        deleteComment,
        addAttachment,
        deleteAttachment,
        createTemplate,
        updateTemplate,
        deleteTemplate,
        getTemplateById,
        getReportStatsByPeriod,
    getUserReportStats,
    fetchReports,
    fetchTemplates
  };

  return (
    <ReportContext.Provider value={contextValue}>
      {children}
    </ReportContext.Provider>
  );
};

export const useReport = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReport must be used within a ReportProvider');
  }
  return context;
}; 