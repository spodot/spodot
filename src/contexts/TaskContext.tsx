import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from '../services/notificationService';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { logger, showSuccess } from '../utils/notifications';
import { withRetry, handleError, handleApiError, handleValidationError } from '../utils/errorHandler';
import { supabaseApiService } from '../services/supabaseApi';

// 업무 우선순위
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

// 업무 상태
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';

// 업무 카테고리
export type TaskCategory = 'maintenance' | 'administrative' | 'client' | 'training' | 'general';

// 업무 인터페이스
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  dueDate: string; // ISO 문자열
  startTime?: string; // 시작 시간 (HH:MM 형식)
  endTime?: string; // 종료 시간 (HH:MM 형식)
  createdAt: string; // ISO 문자열
  updatedAt: string; // ISO 문자열
  assignedTo: string[]; // 유저 ID 배열
  assignedToName: string[]; // 유저 이름 배열
  assignedBy: string; // 유저 ID
  assignedByName: string; // 유저 이름
  completedAt?: string; // ISO 문자열
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
}

// 업무 댓글
export interface TaskComment {
  id: string;
  content: string;
  createdAt: string;
  authorId: string;
  authorName: string;
}

// 업무 첨부 파일
export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
}

// 필터 옵션
interface TaskFilterOptions {
  status?: TaskStatus | 'all';
  priority?: TaskPriority | 'all';
  category?: TaskCategory | 'all';
  assignedTo?: string;
  searchQuery?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

interface TaskContextType {
  tasks: Task[];
  filteredTasks: Task[];
  loading: boolean;
  error: string | null;
  filterTasks: (options: TaskFilterOptions) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  updateTask: (id: string, updatedData: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<void>;
  addAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id'>) => void;
  deleteAttachment: (taskId: string, attachmentId: string) => void;
  fetchTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 localStorage 데이터를 Supabase로 마이그레이션
  const migrateLocalStorageData = useCallback(async () => {
    if (!user) return;

    const savedTasks = localStorage.getItem('tasks');
    if (!savedTasks) return;

    try {
      const localTasks: Task[] = JSON.parse(savedTasks);
      logger.debug(`📦 로컬 스토리지에서 ${localTasks.length}개의 업무를 발견했습니다.`);
      
      if (localTasks.length === 0) {
        localStorage.removeItem('tasks');
        return;
      }

      // 기존 Supabase 데이터 확인
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('id')
        .limit(1);

      // 이미 Supabase에 데이터가 있으면 마이그레이션 하지 않음
      if (existingTasks && existingTasks.length > 0) {
        logger.debug('✅ Supabase에 이미 데이터가 있어 마이그레이션을 건너뜁니다.');
        localStorage.removeItem('tasks');
        return;
      }

      let migratedCount = 0;
      for (const localTask of localTasks) {
        try {
          // 담당자 ID 매핑 (이름으로 실제 사용자 찾기)
          let assignedToId = null;
          if (localTask.assignedTo.length > 0) {
            const { data: foundUser } = await supabase
              .from('users')
              .select('id')
              .eq('name', localTask.assignedToName[0])
              .single();
            
            if (foundUser) {
              assignedToId = foundUser.id;
            }
          }

          // Supabase에 업무 생성
          const { data: newTask, error: insertError } = await supabase
            .from('tasks')
            .insert({
              title: localTask.title,
              description: localTask.description,
              status: localTask.status,
              priority: localTask.priority,
              category: localTask.category,
              due_date: localTask.dueDate,
              start_time: localTask.startTime,
              end_time: localTask.endTime,
              assigned_to: assignedToId,
              created_by: user.id,
              tags: localTask.assignedToName
            })
            .select()
            .single();

          if (insertError) {
            logger.error(`업무 마이그레이션 실패: ${localTask.title}`, insertError);
            continue;
          }

          // 댓글 마이그레이션
          if (localTask.comments && localTask.comments.length > 0 && newTask) {
            for (const comment of localTask.comments) {
              await supabase
                .from('task_comments')
                .insert({
                  task_id: newTask.id,
                  author_id: user.id, // 현재 사용자로 설정
                  author_name: comment.authorName,
                  content: comment.content
                });
            }
          }

          migratedCount++;
        } catch (err) {
          logger.error(`업무 "${localTask.title}" 마이그레이션 중 오류:`, err);
        }
      }

      logger.debug(`✅ ${migratedCount}개의 업무가 성공적으로 마이그레이션되었습니다.`);
      
      // 마이그레이션 완료 후 localStorage 정리
      localStorage.removeItem('tasks');
      
    } catch (err) {
      logger.error('마이그레이션 실패:', err);
    }
  }, [user]);

  // Supabase에서 Task 데이터를 가져와서 내부 인터페이스로 변환
  const convertSupabaseTaskToTask = useCallback(async (supabaseTask: any): Promise<Task> => {
    // 담당자 정보 조회
    const assignedToArray = Array.isArray(supabaseTask.assigned_to) 
      ? supabaseTask.assigned_to 
      : [supabaseTask.assigned_to].filter(Boolean);

    const assignedToNames: string[] = [];
    
    if (assignedToArray.length > 0) {
      const { data: assignedUsers } = await supabase
        .from('users')
        .select('id, name')
        .in('id', assignedToArray);
      
      if (assignedUsers) {
        assignedToNames.push(...assignedUsers.map(u => u.name));
      }
    }

    // 배정자 정보 조회
    let assignedByName = 'Unknown';
    if (supabaseTask.created_by) {
      const { data: creatorUser } = await supabase
        .from('users')
        .select('name')
        .eq('id', supabaseTask.created_by)
        .single();
      
      if (creatorUser) {
        assignedByName = creatorUser.name;
      }
    }

    // 댓글 조회
    const { data: commentsData } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', supabaseTask.id)
      .order('created_at', { ascending: true });

    const comments: TaskComment[] = commentsData ? commentsData.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.created_at,
      authorId: comment.author_id,
      authorName: comment.author_name
    })) : [];

    // 상태 변환 (데이터베이스의 in_progress를 프론트엔드의 in-progress로 변환)
    const convertedStatus = supabaseTask.status === 'in_progress' ? 'in-progress' : supabaseTask.status;

    return {
      id: supabaseTask.id,
      title: supabaseTask.title,
      description: supabaseTask.description,
      status: convertedStatus as TaskStatus,
      priority: supabaseTask.priority,
      category: supabaseTask.category || 'general',
      dueDate: supabaseTask.due_date,
      startTime: supabaseTask.start_time,
      endTime: supabaseTask.end_time,
      createdAt: supabaseTask.created_at,
      updatedAt: supabaseTask.updated_at,
      assignedTo: assignedToArray,
      assignedToName: assignedToNames,
      assignedBy: supabaseTask.created_by,
      assignedByName: assignedByName,
      completedAt: supabaseTask.status === 'completed' ? supabaseTask.updated_at : undefined,
      comments: comments,
      attachments: [] // TODO: 첨부파일 기능은 나중에 구현
    };
  }, []);

  // 업무 목록 조회
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data: supabaseTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (supabaseTasks) {
        const convertedTasks = await Promise.all(
          supabaseTasks.map(task => convertSupabaseTaskToTask(task))
        );
        setTasks(convertedTasks);
        setFilteredTasks(convertedTasks);
      }
    } catch (err) {
      logger.error('업무 조회 실패:', err);
      setError('업무 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [user, convertSupabaseTaskToTask]);

  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      // 먼저 마이그레이션 시도 후 데이터 로드
      migrateLocalStorageData().finally(() => {
        fetchTasks();
      });
    }
  }, [user, migrateLocalStorageData, fetchTasks]);

  // 업무 필터링
  const filterTasks = useCallback((options: TaskFilterOptions) => {
    let filtered = [...tasks];
    
    if (options.status && options.status !== 'all') {
      filtered = filtered.filter(task => task.status === options.status);
    }
    
    if (options.priority && options.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === options.priority);
    }
    
    if (options.category && options.category !== 'all') {
      filtered = filtered.filter(task => task.category === options.category);
    }
    
    if (options.assignedTo && typeof options.assignedTo === 'string') {
      filtered = filtered.filter(task => task.assignedTo.includes(options.assignedTo as string));
    }
    
    if (options.dueDateFrom) {
      filtered = filtered.filter(task => new Date(task.dueDate) >= new Date(options.dueDateFrom!));
    }
    
    if (options.dueDateTo) {
      filtered = filtered.filter(task => new Date(task.dueDate) <= new Date(options.dueDateTo!));
    }
    
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(query) ||
        task.assignedToName.some(name => name.toLowerCase().includes(query)) ||
        (task.description && task.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredTasks(filtered);
  }, [tasks]);

  // 업무 추가
  const addTask = useCallback(async (newTaskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    if (!user) {
      handleError(new Error('로그인이 필요합니다'), { 
        action: 'add_task', 
        userId: undefined,
        userRole: undefined 
      });
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      logger.debug('새 태스크 추가 시작:', newTaskData);

      // 담당자가 여러 명일 경우 첫 번째만 assigned_to에 저장 (DB 제약 조건)
      const assignedToId = newTaskData.assignedTo.length > 0 ? newTaskData.assignedTo[0] : null;

      // 상태 변환 (프론트엔드의 in-progress를 데이터베이스의 in_progress로 변환)
      const convertedStatus = newTaskData.status === 'in-progress' ? 'in_progress' : newTaskData.status;

      const { data: newSupabaseTask, error: insertError } = await withRetry(
        async () => {
          const response = await supabase
            .from('tasks')
            .insert({
              title: newTaskData.title,
              description: newTaskData.description,
              status: convertedStatus,
              priority: newTaskData.priority,
              category: newTaskData.category,
              due_date: newTaskData.dueDate,
              start_time: newTaskData.startTime,
              end_time: newTaskData.endTime,
              assigned_to: assignedToId,
              created_by: user.id,
              tags: newTaskData.assignedToName // 임시로 태그에 담당자 이름 저장
            })
            .select()
            .single();
          
          if (response.error) throw response.error;
          return response;
        },
        3,
        1000,
        { action: 'add_task', userId: user.id, userRole: user.role }
      );

      if (newSupabaseTask) {
        const convertedTask = await convertSupabaseTaskToTask(newSupabaseTask);
        
        // 상태 업데이트를 즉시 반영
        setTasks(prevTasks => [convertedTask, ...prevTasks]);
        setFilteredTasks(prevTasks => [convertedTask, ...prevTasks]);

        // 전체 목록 새로고침
        await fetchTasks();
        showSuccess('새로운 업무가 성공적으로 추가되었습니다.');
        
        return convertedTask.id;
      }
    } catch (error) {
      handleApiError(error, 'add_task', user.id, user.role);
    } finally {
      setLoading(false);
    }

    return null;
  }, [user, convertSupabaseTaskToTask, fetchTasks]);

  // 업무 수정
  const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
    if (!user) {
      handleError(new Error('로그인이 필요합니다'), {
        action: 'update_task',
        userId: undefined,
        userRole: undefined
      });
      return;
    }

    try {
      logger.debug('태스크 업데이트 시작:', { id, updates });
      setLoading(true);

      // 직접 Supabase 업데이트 호출
      const { error } = await supabase
        .from('tasks')
        .update({
          title: updates.title,
          description: updates.description,
          status: updates.status === 'in-progress' ? 'in_progress' : updates.status,
          priority: updates.priority,
          category: updates.category,
          assigned_to: updates.assignedTo?.[0],
          due_date: updates.dueDate,
          start_time: updates.startTime,
          end_time: updates.endTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      await fetchTasks();
      showSuccess('업무가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      handleApiError(error, 'update_task', user.id, user.role);
    } finally {
      setLoading(false);
    }
  };

  // 업무 삭제
  const deleteTask = async (id: string): Promise<void> => {
    if (!user) {
      handleError(new Error('로그인이 필요합니다'), {
        action: 'delete_task',
        userId: undefined,
        userRole: undefined
      });
      return;
    }

    try {
      logger.debug('태스크 삭제 시작:', id);
      setLoading(true);

      // 직접 Supabase 삭제 호출
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      await fetchTasks();
      showSuccess('업무가 성공적으로 삭제되었습니다.');
    } catch (error) {
      handleApiError(error, 'delete_task', user.id, user.role);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 추가
  const addComment = async (taskId: string, content: string): Promise<void> => {
    if (!user) {
      handleError(new Error('로그인이 필요합니다'), {
        action: 'add_comment',
        userId: undefined,
        userRole: undefined
      });
      return;
    }

    if (!content.trim()) {
      handleValidationError('댓글 내용', 'required');
      return;
    }

    try {
      logger.debug('댓글 추가 시작:', { taskId, content });

      await withRetry(
        () => supabaseApiService.tasks.addComment(taskId, content),
        2,
        500,
        { action: 'add_comment', userId: user.id, userRole: user.role }
      );

      await fetchTasks(); // 전체 업무 목록 새로고침
      showSuccess('댓글이 추가되었습니다.');
    } catch (error) {
      handleApiError(error, 'add_comment', user.id, user.role);
    }
  };

  // 첨부 파일 추가 (임시 구현)
  const addAttachment = useCallback((taskId: string, attachment: Omit<TaskAttachment, 'id'>) => {
    const newAttachment: TaskAttachment = {
      ...attachment,
      id: `attachment-${Date.now()}`
    };
    
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              attachments: [...(task.attachments || []), newAttachment],
              updatedAt: new Date().toISOString()
            } 
          : task
      )
    );

    setFilteredTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              attachments: [...(task.attachments || []), newAttachment],
              updatedAt: new Date().toISOString()
            } 
          : task
      )
    );
  }, []);

  // 첨부 파일 삭제 (임시 구현)
  const deleteAttachment = useCallback((taskId: string, attachmentId: string) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              attachments: (task.attachments || []).filter(a => a.id !== attachmentId),
              updatedAt: new Date().toISOString()
            } 
          : task
      )
    );

    setFilteredTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              attachments: (task.attachments || []).filter(a => a.id !== attachmentId),
              updatedAt: new Date().toISOString()
            } 
          : task
      )
    );
  }, []);

  return (
    <TaskContext.Provider 
      value={{ 
        tasks, 
        filteredTasks,
        loading,
        error,
        filterTasks, 
        addTask, 
        updateTask, 
        deleteTask, 
        addComment, 
        addAttachment, 
        deleteAttachment,
        fetchTasks
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTask = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error("useTask must be used within a TaskProvider");
  return context;
}; 