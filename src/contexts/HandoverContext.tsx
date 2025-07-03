import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface Handover {
  id: string;
  content: string;
  date: string;
  author_id?: string;
  author_name: string;
  created_at?: string;
  updated_at?: string;
}

interface HandoverContextType {
  handovers: Handover[];
  loading: boolean;
  error: string | null;
  addHandover: (content: string) => Promise<string | null>;
  fetchHandovers: () => Promise<void>;
  deleteHandover: (id: string) => Promise<boolean>;
}

const HandoverContext = createContext<HandoverContextType | undefined>(undefined);

export const HandoverProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [handovers, setHandovers] = useState<Handover[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 localStorage 데이터를 Supabase로 마이그레이션
  const migrateLocalStorageData = useCallback(async () => {
    const savedHandovers = localStorage.getItem('handovers');
    
    try {
      if (savedHandovers) {
        const localHandovers: Handover[] = JSON.parse(savedHandovers);
        console.log(`📦 로컬 스토리지에서 ${localHandovers.length}개의 인계사항을 발견했습니다.`);
        
        if (localHandovers.length > 0) {
          // 기존 Supabase 데이터 확인
          const { data: existingHandovers } = await supabase
            .from('handovers')
            .select('id')
            .limit(1);

          if (!existingHandovers || existingHandovers.length === 0) {
            let migratedCount = 0;
            for (const localHandover of localHandovers) {
              try {
                const { error: insertError } = await supabase
                  .from('handovers')
                  .insert({
                    content: localHandover.content,
                    date: localHandover.date,
                    author_id: localHandover.author_id,
                    author_name: localHandover.author_name
                  });

                if (!insertError) {
                  migratedCount++;
                }
              } catch (err) {
                console.error(`인계사항 "${localHandover.content.substring(0, 50)}..." 마이그레이션 중 오류:`, err);
              }
            }
            console.log(`✅ ${migratedCount}개의 인계사항이 성공적으로 마이그레이션되었습니다.`);
          }
        }
        localStorage.removeItem('handovers');
      }
    } catch (err) {
      console.error('인계사항 데이터 마이그레이션 실패:', err);
    }
  }, []);

  // Supabase에서 인계사항 데이터 가져오기 (최근 7일간)
  const fetchHandovers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: supabaseHandovers, error: fetchError } = await supabase
        .from('handovers')
        .select('*')
        .gte('date', sevenDaysAgoStr)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      if (supabaseHandovers) {
        const convertedHandovers = supabaseHandovers.map(handover => ({
          id: handover.id,
          content: handover.content,
          date: handover.date,
          author_id: handover.author_id,
          author_name: handover.author_name,
          created_at: handover.created_at,
          updated_at: handover.updated_at
        }));
        setHandovers(convertedHandovers);
      } else {
        setHandovers([]);
      }
    } catch (err) {
      console.error('인계사항 데이터 가져오기 실패:', err);
      // setError('인계사항을 불러오는 중 오류가 발생했습니다.'); // 초기 로딩 에러 메시지 제거
      setError(null); // 에러 상태 초기화
    } finally {
      setLoading(false);
    }
  }, []);

  // 초기 데이터 로드
  useEffect(() => {
    // localStorage 마이그레이션 먼저 실행 후 데이터 가져오기
    migrateLocalStorageData().finally(() => {
      fetchHandovers();
    });
  }, [migrateLocalStorageData, fetchHandovers]);

  // 인계사항 추가
  const addHandover = async (content: string): Promise<string | null> => {
    if (!user) {
      console.error('사용자 정보가 없습니다.');
      setError('로그인이 필요합니다.');
      return null;
    }

    console.log('🔍 인계사항 추가 시도:', {
      content: content.trim(),
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });

    try {
      // 먼저 현재 사용자의 인증 상태 확인
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      console.log('🔐 현재 인증 상태:', { 
        currentUser: currentUser?.id, 
        authError: authError?.message,
        isAuthenticated: !!currentUser,
        contextUser: user.id
      });

      // 인증 오류가 있어도 context에 user 정보가 있으면 계속 진행
      if (authError && !user) {
        console.error('❌ 인증 오류:', authError);
        setError('인증에 문제가 있습니다. 다시 로그인해주세요.');
        return null;
      }

      // Supabase 인증 사용자가 없어도 context user가 있으면 그것을 사용
      const effectiveUserId = currentUser?.id || user.id;
      console.log('👤 사용할 사용자 ID:', effectiveUserId);

      const handoverData = {
        content: content.trim(),
        date: new Date().toISOString().split('T')[0],
        author_id: effectiveUserId,
        author_name: user.name || user.email || '알 수 없음'
      };

      console.log('📝 Supabase에 삽입할 데이터:', handoverData);

      // 테스트를 위해 먼저 단순한 select 쿼리로 테이블 접근 확인
      const { data: testData, error: testError } = await supabase
        .from('handovers')
        .select('id')
        .limit(1);

      console.log('🧪 테이블 접근 테스트:', { 
        testData: testData?.length || 0, 
        testError: testError?.message 
      });

      if (testError) {
        console.error('❌ 테이블 접근 실패:', testError);
        setError(`테이블 접근 오류: ${testError.message}`);
        return null;
      }

      const { data: newHandover, error: insertError } = await supabase
        .from('handovers')
        .insert(handoverData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ 인계사항 추가 실패:', insertError);
        console.error('🔍 에러 상세:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        setError(`인계사항 추가 실패: ${insertError.message}`);
        return null;
      }

      console.log('✅ 인계사항 추가 성공:', newHandover);

      if (newHandover) {
        await fetchHandovers();
        setError(null); // 성공시 이전 에러 클리어
        return newHandover.id;
      }

      return null;
    } catch (err) {
      console.error('❌ 인계사항 추가 중 예외 발생:', err);
      setError(`인계사항 추가 중 오류가 발생했습니다: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      return null;
    }
  };

  // 인계사항 삭제
  const deleteHandover = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('handovers')
        .delete()
        .eq('id', id);

      if (deleteError) {
        console.error('인계사항 삭제 실패:', deleteError);
        setError('인계사항 삭제 중 오류가 발생했습니다.');
        return false;
      }

      await fetchHandovers();
      return true;
    } catch (err) {
      console.error('인계사항 삭제 중 오류:', err);
      setError('인계사항 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  const contextValue: HandoverContextType = {
    handovers,
    loading,
    error,
    addHandover,
    fetchHandovers,
    deleteHandover
  };

  return (
    <HandoverContext.Provider value={contextValue}>
      {children}
    </HandoverContext.Provider>
  );
};

export const useHandover = () => {
  const context = useContext(HandoverContext);
  if (!context) {
    throw new Error('useHandover must be used within a HandoverProvider');
  }
  return context;
}; 