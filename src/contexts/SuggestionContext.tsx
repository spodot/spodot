import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

// Type Definitions
export interface User {
  id: string;
  name: string;
  // email?: string; // Optional email
  // role?: 'user' | 'admin'; // Optional role
}

export type SuggestionStatus = 'pending' | 'answered' | 'rejected';

export interface Suggestion {
  id: string;
  title: string;
  content: string;
  createdBy: User | null; // null for anonymous
  createdByName?: string; // Display name, can be '익명 사용자' or User's name
  createdAt: string;
  status: SuggestionStatus;
  reply?: string;
  repliedAt?: string;
  repliedBy?: User | null;
  category?: string;
  type?: 'staff' | 'customer';
}

// 임시저장 데이터 타입
export interface DraftSuggestion {
  title: string;
  content: string;
  type: 'staff' | 'customer';
  category?: string;
  lastSaved: string;
}

interface SuggestionContextType {
  suggestions: Suggestion[];
  draftSuggestion: DraftSuggestion | null;
  loading: boolean;
  error: string | null;
  getSuggestionById: (id: string) => Suggestion | undefined;
  addSuggestion: (title: string, content: string, createdBy: User | null, type?: 'staff' | 'customer', category?: string) => Promise<string | null>;
  updateSuggestionReply: (suggestionId: string, reply: string, repliedBy: User) => Promise<boolean>;
  deleteSuggestion: (suggestionId: string) => Promise<boolean>;
  saveDraft: (draft: DraftSuggestion) => void;
  clearDraft: () => void;
  loadDraft: () => DraftSuggestion | null;
  getUserSuggestions: (userId: string) => Suggestion[];
  fetchSuggestions: () => Promise<void>;
}

const SuggestionContext = createContext<SuggestionContextType | undefined>(undefined);

const STORAGE_KEY = 'fitness_suggestions';
const DRAFT_STORAGE_KEY = 'fitness_suggestion_draft';

export const SuggestionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [draftSuggestion, setDraftSuggestion] = useState<DraftSuggestion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 localStorage 데이터를 Supabase로 마이그레이션
  const migrateLocalStorageData = useCallback(async () => {
    const savedSuggestions = localStorage.getItem(STORAGE_KEY);
    if (!savedSuggestions) return;

    try {
      const localSuggestions: Suggestion[] = JSON.parse(savedSuggestions);
      console.log(`📦 로컬 스토리지에서 ${localSuggestions.length}개의 건의사항을 발견했습니다.`);
      
      if (localSuggestions.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      // 기존 Supabase 데이터 확인
      const { data: existingSuggestions } = await supabase
        .from('suggestions')
        .select('id')
        .limit(1);

      // 이미 Supabase에 데이터가 있으면 마이그레이션 하지 않음
      if (existingSuggestions && existingSuggestions.length > 0) {
        console.log('✅ Supabase에 이미 건의사항 데이터가 있어 마이그레이션을 건너뜁니다.');
        localStorage.removeItem(STORAGE_KEY);
        return;
      }

      let migratedCount = 0;
      for (const localSuggestion of localSuggestions) {
        try {
          // 카테고리 매핑
          let category: 'facility' | 'service' | 'program' | 'other' = 'other';
          if (localSuggestion.category === '시설') category = 'facility';
          else if (localSuggestion.category === '서비스') category = 'service';
          else if (localSuggestion.category === '프로그램') category = 'program';

          const { error: insertError } = await supabase
            .from('suggestions')
            .insert({
              title: localSuggestion.title,
              content: localSuggestion.content,
              category,
              author_id: localSuggestion.createdBy?.id,
              author_name: localSuggestion.createdByName || '익명 사용자',
              status: localSuggestion.status,
              admin_response: localSuggestion.reply,
              admin_response_at: localSuggestion.repliedAt,
              admin_response_by: localSuggestion.repliedBy?.name
            });

          if (insertError) {
            console.error(`건의사항 마이그레이션 실패: ${localSuggestion.title}`, insertError);
            continue;
          }

          migratedCount++;
        } catch (err) {
          console.error(`건의사항 "${localSuggestion.title}" 마이그레이션 중 오류:`, err);
        }
      }

      console.log(`✅ ${migratedCount}개의 건의사항이 성공적으로 마이그레이션되었습니다.`);
      
      // 마이그레이션 완료 후 localStorage 정리
      localStorage.removeItem(STORAGE_KEY);
      
    } catch (err) {
      console.error('건의사항 마이그레이션 실패:', err);
    }
  }, []);

  // Supabase에서 Suggestion 데이터를 가져와서 내부 인터페이스로 변환
  const convertSupabaseSuggestionToSuggestion = (supabaseSuggestion: any): Suggestion => {
    // 상태 매핑
    let status: SuggestionStatus = 'pending';
    if (supabaseSuggestion.status === 'in_review') status = 'pending';
    else if (supabaseSuggestion.status === 'approved' || supabaseSuggestion.status === 'implemented') status = 'answered';
    else if (supabaseSuggestion.status === 'rejected') status = 'rejected';

    // 카테고리 매핑
    let category = '기타';
    if (supabaseSuggestion.category === 'facility') category = '시설';
    else if (supabaseSuggestion.category === 'service') category = '서비스';
    else if (supabaseSuggestion.category === 'program') category = '프로그램';

    return {
      id: supabaseSuggestion.id,
      title: supabaseSuggestion.title,
      content: supabaseSuggestion.content,
      createdBy: supabaseSuggestion.author_id ? {
        id: supabaseSuggestion.author_id,
        name: supabaseSuggestion.author_name
      } : null,
      createdByName: supabaseSuggestion.author_name,
      createdAt: supabaseSuggestion.created_at || new Date().toISOString(),
      status,
      reply: supabaseSuggestion.admin_response,
      repliedAt: supabaseSuggestion.admin_response_at,
      repliedBy: supabaseSuggestion.admin_response_by ? {
        id: 'admin',
        name: supabaseSuggestion.admin_response_by
      } : undefined,
      category,
      type: supabaseSuggestion.author_id ? 'staff' : 'customer' // 작성자가 있으면 직원, 없으면 고객
    };
  };

  // Supabase에서 건의사항 데이터 가져오기
  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: supabaseSuggestions, error: fetchError } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (supabaseSuggestions && supabaseSuggestions.length > 0) {
        const convertedSuggestions = supabaseSuggestions.map(convertSupabaseSuggestionToSuggestion);
        setSuggestions(convertedSuggestions);
      } else {
        // 데이터가 없으면 샘플 데이터 생성
        await generateSampleSuggestionsInSupabase();
        // 다시 가져오기
        const { data: newData } = await supabase
          .from('suggestions')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (newData) {
          const convertedSuggestions = newData.map(convertSupabaseSuggestionToSuggestion);
          setSuggestions(convertedSuggestions);
        }
      }
    } catch (err) {
      console.error('건의사항 데이터 가져오기 실패:', err);
      setError('건의사항을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 샘플 건의사항을 Supabase에 생성
  const generateSampleSuggestionsInSupabase = async () => {
    const sampleSuggestions = [
      {
    title: '체육관 시설 개선 건의',
    content: '러닝머신 중 2대가 고장나 있습니다. 빠른 수리 부탁드립니다.',
        category: 'facility' as const,
        author_id: user?.id,
        author_name: user?.name || '김민수',
        status: 'pending' as const
  },
  {
    title: '샤워실 온수 문제',
    content: '아침 시간에 샤워실 온수가 잘 나오지 않습니다. 개선해주세요.',
        category: 'facility' as const,
        author_name: '익명 사용자',
        status: 'approved' as const,
        admin_response: '확인 결과 보일러 설정에 문제가 있었습니다. 현재는 정상적으로 온수가 공급됩니다. 이용에 불편을 드려 죄송합니다.',
        admin_response_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        admin_response_by: '관리자'
  },
  {
    title: '요가 수업 시간 추가 요청',
    content: '저녁 시간대 요가 수업이 너무 인기가 많아 참여하기 어렵습니다. 추가 개설을 검토해주시면 감사하겠습니다.',
        category: 'service' as const,
        author_name: '박서준',
        status: 'pending' as const
      },
      {
        title: '회의실 예약 시스템 개선 요청',
        content: '현재 회의실 예약 시스템이 불편합니다. 모바일에서도 쉽게 예약할 수 있도록 개선해주세요.',
        category: 'other' as const,
        author_id: user?.id,
        author_name: user?.name || '이직원',
        status: 'approved' as const,
        admin_response: '모바일 앱 업데이트를 통해 회의실 예약 기능을 개선했습니다. 새 버전을 다운로드해주세요.',
        admin_response_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        admin_response_by: '관리자'
      }
    ];

    try {
      const { error } = await supabase
        .from('suggestions')
        .insert(sampleSuggestions);

      if (error) {
        console.error('샘플 건의사항 생성 실패:', error);
      } else {
        console.log('✅ 샘플 건의사항이 성공적으로 생성되었습니다.');
      }
    } catch (err) {
      console.error('샘플 건의사항 생성 중 오류:', err);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    // localStorage 마이그레이션 먼저 실행 후 데이터 가져오기
    migrateLocalStorageData().finally(() => {
      fetchSuggestions();
    });

    // 임시저장 데이터 로드
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        setDraftSuggestion(JSON.parse(savedDraft));
      } catch (error) {
        console.error('Failed to load draft from localStorage:', error);
      }
    }
  }, [migrateLocalStorageData, fetchSuggestions]);

  const getSuggestionById = (id: string): Suggestion | undefined => {
    return suggestions.find(suggestion => suggestion.id === id);
  };

  const addSuggestion = async (
    title: string, 
    content: string, 
    createdBy: User | null, 
    type: 'staff' | 'customer' = 'staff',
    category: string = '기타'
  ): Promise<string | null> => {
    try {
      // 카테고리 매핑
      let supabaseCategory: 'facility' | 'service' | 'program' | 'other' = 'other';
      if (category === '시설') supabaseCategory = 'facility';
      else if (category === '서비스') supabaseCategory = 'service';
      else if (category === '프로그램') supabaseCategory = 'program';

      const { data: newSuggestion, error: insertError } = await supabase
        .from('suggestions')
        .insert({
      title,
      content,
          category: supabaseCategory,
          author_id: createdBy?.id,
          author_name: createdBy ? createdBy.name : '익명 사용자',
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        console.error('건의사항 추가 실패:', insertError);
        setError('건의사항 추가 중 오류가 발생했습니다.');
        return null;
      }

      if (newSuggestion) {
        // 상태 업데이트
        await fetchSuggestions();
        return newSuggestion.id;
      }

      return null;
    } catch (err) {
      console.error('건의사항 추가 중 오류:', err);
      setError('건의사항 추가 중 오류가 발생했습니다.');
      return null;
    }
  };

  const updateSuggestionReply = async (suggestionId: string, reply: string, repliedBy: User): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('suggestions')
        .update({
          status: 'approved',
          admin_response: reply,
          admin_response_at: new Date().toISOString(),
          admin_response_by: repliedBy.name
        })
        .eq('id', suggestionId);

      if (updateError) {
        console.error('건의사항 답변 실패:', updateError);
        setError('건의사항 답변 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchSuggestions();
      return true;
    } catch (err) {
      console.error('건의사항 답변 중 오류:', err);
      setError('건의사항 답변 중 오류가 발생했습니다.');
      return false;
    }
  };

  const deleteSuggestion = async (suggestionId: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', suggestionId);

      if (deleteError) {
        console.error('건의사항 삭제 실패:', deleteError);
        setError('건의사항 삭제 중 오류가 발생했습니다.');
        return false;
      }

      // 상태 업데이트
      await fetchSuggestions();
      return true;
    } catch (err) {
      console.error('건의사항 삭제 중 오류:', err);
      setError('건의사항 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  const saveDraft = (draft: DraftSuggestion) => {
    const draftWithTimestamp = {
      ...draft,
      lastSaved: new Date().toISOString()
    };
    setDraftSuggestion(draftWithTimestamp);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftWithTimestamp));
  };

  const clearDraft = () => {
    setDraftSuggestion(null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const loadDraft = (): DraftSuggestion | null => {
    return draftSuggestion;
  };

  const getUserSuggestions = (userId: string): Suggestion[] => {
    return suggestions.filter(suggestion => suggestion.createdBy?.id === userId);
  };

  const contextValue: SuggestionContextType = {
    suggestions,
    draftSuggestion,
    loading,
    error,
    getSuggestionById,
    addSuggestion,
    updateSuggestionReply,
    deleteSuggestion,
    saveDraft,
    clearDraft,
    loadDraft,
    getUserSuggestions,
    fetchSuggestions
  };

  return (
    <SuggestionContext.Provider value={contextValue}>
      {children}
    </SuggestionContext.Provider>
  );
};

export const useSuggestion = (): SuggestionContextType => {
  const context = useContext(SuggestionContext);
  if (!context) {
    throw new Error('useSuggestion must be used within a SuggestionProvider');
  }
  return context;
};

// Fast Refresh 호환성을 위한 별도 export
export { SuggestionProvider as default };
