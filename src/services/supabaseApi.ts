import { supabase } from '../lib/supabase';
import { 
  User, 
  Task, 
  DailyReport, 
  Announcement, 
  Manual, 
  SalesEntry, 
  Customer, 
  Suggestion,
  Notification,
  FilterOptions
} from '../types';

// 유틸리티 함수
const handleSupabaseResponse = <T>(response: { data: T | null; error: any }) => {
  if (response.error) {
    throw new Error(response.error.message);
  }
  return response.data;
};

class SupabaseApiService {
  // 인증 관련
  auth = {
    login: async (credentials: { email: string; password: string }) => {
      // 사용자 조회 (실제로는 Supabase Auth를 사용해야 하지만, 현재는 직접 조회)
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', credentials.email)
        .eq('password', credentials.password)
        .single();

      if (error || !user) {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }

      // 마지막 로그인 시간 업데이트
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar: user.profile_image,
          createdAt: user.created_at
        } as User,
        token: 'dummy-token' // 실제로는 JWT 토큰
      };
    },

    logout: async () => {
      // 실제로는 토큰 무효화 등 처리
      return true;
    },

    getCurrentUser: async () => {
      // 실제로는 JWT에서 사용자 정보 추출
      const userId = localStorage.getItem('currentUserId');
      if (!userId) throw new Error('로그인이 필요합니다.');

      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw new Error(error.message);

      console.log('🔍 getCurrentUser 조회 결과:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        position: user.position,
        avatar: user.profile_image,
        permissions: user.permissions || [], // 권한 정보 추가
        createdAt: user.created_at
      } as User;
    }
  };

  // 업무 관리
  tasks = {
    getAll: async (filters?: FilterOptions) => {
      let query = supabase.from('tasks').select(`
        *,
        assigned_user:users!tasks_assigned_to_fkey(name),
        created_user:users!tasks_created_by_fkey(name)
      `);

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);

      const tasks: Task[] = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        assigneeId: task.assigned_to || '',
        assigneeName: task.assigned_user?.name || '',
        assignerId: task.created_by || '',
        assignerName: task.created_user?.name || '',
        status: task.status,
        priority: task.priority || 'medium',
        dueDate: task.due_date || '',
        createdAt: task.created_at || '',
        updatedAt: task.updated_at || '',
        category: task.category || '',
        tags: task.tags || [],
        comments: [] // 별도 조회 필요
      }));

      return {
        data: tasks,
        total: tasks.length,
        page: 1,
        limit: 100,
        totalPages: 1
      };
    },

    getById: async (id: string) => {
      const { data: task, error } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_user:users!tasks_assigned_to_fkey(name),
          created_user:users!tasks_created_by_fkey(name),
          comments:task_comments(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw new Error(error.message);

      return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        assigneeId: task.assigned_to || '',
        assigneeName: task.assigned_user?.name || '',
        assignerId: task.created_by || '',
        assignerName: task.created_user?.name || '',
        status: task.status,
        priority: task.priority || 'medium',
        dueDate: task.due_date || '',
        createdAt: task.created_at || '',
        updatedAt: task.updated_at || '',
        category: task.category || '',
        tags: task.tags || [],
        comments: task.comments?.map((c: any) => ({
          id: c.id,
          taskId: c.task_id,
          authorId: c.author_id,
          authorName: c.author_name,
          content: c.content,
          createdAt: c.created_at
        })) || []
      } as Task;
    },

    create: async (task: Partial<Task>) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title!,
          description: task.description,
          status: task.status || 'pending',
          priority: task.priority || 'medium',
          category: task.category,
          assigned_to: task.assigneeId,
          created_by: task.assignerId,
          due_date: task.dueDate,
          tags: task.tags || []
        })
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    update: async (id: string, task: Partial<Task>) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          category: task.category,
          assigned_to: task.assigneeId,
          due_date: task.dueDate,
          tags: task.tags
        })
        .eq('id', id)
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },

    addComment: async (taskId: string, content: string) => {
      const currentUserId = localStorage.getItem('currentUserId');
      const currentUserName = localStorage.getItem('currentUserName');

      const { error } = await supabase
        .from('task_comments')
        .insert({
          task_id: taskId,
          author_id: currentUserId,
          author_name: currentUserName || 'Unknown',
          content
        });

      if (error) throw new Error(error.message);
    }
  };

  // 일일 보고서
  dailyReports = {
    getAll: async (filters?: FilterOptions) => {
      let query = supabase.from('daily_reports').select('*');

      if (filters?.search) {
        query = query.or(`author_name.ilike.%${filters.search}%,issues.ilike.%${filters.search}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw new Error(error.message);

      const reports: DailyReport[] = (data || []).map(report => ({
        id: report.id,
        authorId: report.author_id || '',
        authorName: report.author_name,
        date: report.date,
        tasks: report.tasks || [],
        issues: report.issues || '',
        tomorrow: report.tomorrow || '',
        images: report.images || [],
        createdAt: report.created_at || '',
        updatedAt: report.updated_at || ''
      }));

      return {
        data: reports,
        total: reports.length,
        page: 1,
        limit: 100,
        totalPages: 1
      };
    },

    create: async (report: Partial<DailyReport>) => {
      const { data, error } = await supabase
        .from('daily_reports')
        .insert({
          author_id: report.authorId,
          author_name: report.authorName!,
          date: report.date!,
          tasks: report.tasks || [],
          issues: report.issues,
          tomorrow: report.tomorrow,
          images: report.images || []
        })
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    update: async (id: string, report: Partial<DailyReport>) => {
      const { data, error } = await supabase
        .from('daily_reports')
        .update({
          tasks: report.tasks,
          issues: report.issues,
          tomorrow: report.tomorrow,
          images: report.images
        })
        .eq('id', id)
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    }
  };

  // 공지사항
  announcements = {
    getAll: async (filters?: FilterOptions) => {
      let query = supabase.from('announcements').select('*');

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);

      const announcements: Announcement[] = (data || []).map(ann => ({
        id: ann.id,
        title: ann.title,
        content: ann.content,
        authorId: ann.author_id || '',
        authorName: ann.author_name,
        priority: ann.priority || 'medium',
        tags: ann.tags || [],
        expiryDate: ann.expiry_date,
        isPinned: ann.is_pinned || false,
        isActive: ann.is_active || true,
        targetRoles: ann.target_roles || [],
        readBy: ann.read_by || [],
        createdAt: ann.created_at || '',
        updatedAt: ann.updated_at || '',
        attachments: ann.attachments || []
      }));

      return {
        data: announcements,
        total: announcements.length,
        page: 1,
        limit: 100,
        totalPages: 1
      };
    },

    create: async (announcement: Partial<Announcement>) => {
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          title: announcement.title!,
          content: announcement.content!,
          author_id: announcement.authorId,
          author_name: announcement.authorName!,
          priority: announcement.priority || 'medium',
          tags: announcement.tags || [],
          expiry_date: announcement.expiryDate,
          is_pinned: announcement.isPinned || false,
          is_active: announcement.isActive !== false,
          target_roles: announcement.targetRoles || [],
          attachments: announcement.attachments || []
        })
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    update: async (id: string, announcement: Partial<Announcement>) => {
      const { data, error } = await supabase
        .from('announcements')
        .update({
          title: announcement.title,
          content: announcement.content,
          priority: announcement.priority,
          tags: announcement.tags,
          expiry_date: announcement.expiryDate,
          is_pinned: announcement.isPinned,
          is_active: announcement.isActive,
          target_roles: announcement.targetRoles,
          attachments: announcement.attachments
        })
        .eq('id', id)
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },

    markAsRead: async (id: string) => {
      const currentUserId = localStorage.getItem('currentUserId');
      if (!currentUserId) return;

      // 읽음 목록에 사용자 추가
      const { data: announcement } = await supabase
        .from('announcements')
        .select('read_by')
        .eq('id', id)
        .single();

      const readBy = announcement?.read_by || [];
      if (!readBy.includes(currentUserId)) {
        readBy.push(currentUserId);
        
        await supabase
          .from('announcements')
          .update({ read_by: readBy })
          .eq('id', id);
      }
    }
  };

  // 메뉴얼
  manuals = {
    getAll: async (filters?: FilterOptions) => {
      let query = supabase.from('manuals').select('*');

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);

      const manuals: Manual[] = (data || []).map(manual => ({
        id: manual.id,
        title: manual.title,
        content: manual.content,
        category: manual.category || '',
        tags: manual.tags || [],
        authorId: manual.author_id || '',
        authorName: manual.author_name,
        createdAt: manual.created_at || '',
        updatedAt: manual.updated_at || '',
        viewCount: manual.view_count || 0,
        isPublished: manual.is_published || true,
        version: manual.version || 1,
        lastEditedBy: manual.last_edited_by
      }));

      return {
        data: manuals,
        total: manuals.length,
        page: 1,
        limit: 100,
        totalPages: 1
      };
    },

    create: async (manual: Partial<Manual>) => {
      const { data, error } = await supabase
        .from('manuals')
        .insert({
          title: manual.title!,
          content: manual.content!,
          category: manual.category,
          tags: manual.tags || [],
          author_id: manual.authorId,
          author_name: manual.authorName!,
          is_published: manual.isPublished !== false
        })
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    update: async (id: string, manual: Partial<Manual>) => {
      const { data, error } = await supabase
        .from('manuals')
        .update({
          title: manual.title,
          content: manual.content,
          category: manual.category,
          tags: manual.tags,
          is_published: manual.isPublished,
          last_edited_by: manual.lastEditedBy
        })
        .eq('id', id)
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('manuals')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    },

    incrementViewCount: async (id: string) => {
      const { data } = await supabase
        .from('manuals')
        .select('view_count')
        .eq('id', id)
        .single();

      if (data) {
        await supabase
          .from('manuals')
          .update({ view_count: (data.view_count || 0) + 1 })
          .eq('id', id);
      }
    }
  };

  // 매출 관리
  sales = {
    getAll: async (filters?: FilterOptions) => {
      let query = supabase.from('sales_entries').select('*');

      if (filters?.search) {
        query = query.or(`author_name.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }
      if (filters?.dateFrom) {
        query = query.gte('date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('date', filters.dateTo);
      }

      const { data, error } = await query.order('date', { ascending: false });
      
      if (error) throw new Error(error.message);

      const sales: SalesEntry[] = (data || []).map(sale => ({
        id: sale.id,
        date: sale.date,
        authorId: sale.author_id || '',
        authorName: sale.author_name,
        revenue: sale.revenue || 0,
        membershipSales: sale.membership_sales || 0,
        ptSales: sale.pt_sales || 0,
        supplySales: sale.supply_sales || 0,
        vendingSales: sale.vending_sales || 0,
        notes: sale.notes || '',
        createdAt: sale.created_at || '',
        updatedAt: sale.updated_at || ''
      }));

      return {
        data: sales,
        total: sales.length,
        page: 1,
        limit: 100,
        totalPages: 1
      };
    },

    create: async (sale: Partial<SalesEntry>) => {
      const { data, error } = await supabase
        .from('sales_entries')
        .insert({
          date: sale.date!,
          author_id: sale.authorId,
          author_name: sale.authorName!,
          revenue: sale.revenue || 0,
          membership_sales: sale.membershipSales || 0,
          pt_sales: sale.ptSales || 0,
          supply_sales: sale.supplySales || 0,
          vending_sales: sale.vendingSales || 0,
          notes: sale.notes
        })
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    update: async (id: string, sale: Partial<SalesEntry>) => {
      const { data, error } = await supabase
        .from('sales_entries')
        .update({
          revenue: sale.revenue,
          membership_sales: sale.membershipSales,
          pt_sales: sale.ptSales,
          supply_sales: sale.supplySales,
          vending_sales: sale.vendingSales,
          notes: sale.notes
        })
        .eq('id', id)
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('sales_entries')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    }
  };

  // 고객 관리
  customers = {
    getAll: async (filters?: FilterOptions) => {
      let query = supabase.from('customers').select('*');

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);

      const customers: Customer[] = (data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone || '',
        membershipType: customer.membership_type || 'basic',
        membershipStart: customer.membership_start || '',
        membershipEnd: customer.membership_end || '',
        status: customer.status || 'active',
        personalTrainer: customer.personal_trainer,
        notes: customer.notes || '',
        createdAt: customer.created_at || '',
        updatedAt: customer.updated_at || ''
      }));

      return {
        data: customers,
        total: customers.length,
        page: 1,
        limit: 100,
        totalPages: 1
      };
    },

    create: async (customer: Partial<Customer>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: customer.name!,
          email: customer.email,
          phone: customer.phone,
          membership_type: customer.membershipType,
          membership_start: customer.membershipStart,
          membership_end: customer.membershipEnd,
          status: customer.status || 'active',
          personal_trainer: customer.personalTrainer,
          notes: customer.notes
        })
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    update: async (id: string, customer: Partial<Customer>) => {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          membership_type: customer.membershipType,
          membership_start: customer.membershipStart,
          membership_end: customer.membershipEnd,
          status: customer.status,
          personal_trainer: customer.personalTrainer,
          notes: customer.notes
        })
        .eq('id', id)
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    }
  };

  // 건의사항
  suggestions = {
    getAll: async (filters: FilterOptions = {}) => {
      let query = supabase.from('suggestions').select('*');
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);

      const suggestions: Suggestion[] = (data || []).map(sug => ({
        id: sug.id,
        title: sug.title,
        content: sug.content,
        category: sug.category || 'other',
        authorId: sug.author_id || '',
        authorName: sug.author_name,
        status: sug.status || 'pending',
        priority: sug.priority || 'medium',
        adminResponse: sug.admin_response,
        adminResponseBy: sug.admin_response_by,
        adminResponseAt: sug.admin_response_at,
        createdAt: sug.created_at || '',
        updatedAt: sug.updated_at || ''
      }));

      return {
        data: suggestions,
        total: suggestions.length,
        page: 1,
        limit: 100,
        totalPages: 1
      };
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from('suggestions')
        .select('*')
        .eq('id', id)
        .single();

      return handleSupabaseResponse({ data, error });
    },

    create: async (suggestion: Partial<Suggestion>) => {
      const currentUserId = localStorage.getItem('currentUserId');
      const currentUserName = localStorage.getItem('currentUserName') || 'Unknown';

      const { data, error } = await supabase
        .from('suggestions')
        .insert({
          title: suggestion.title,
          content: suggestion.content,
          category: suggestion.category || 'other',
          author_id: currentUserId,
          author_name: currentUserName,
          status: 'pending',
          priority: suggestion.priority || 'medium'
        })
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    update: async (id: string, suggestion: Partial<Suggestion>) => {
      const { data, error } = await supabase
        .from('suggestions')
        .update({
          title: suggestion.title,
          content: suggestion.content,
          category: suggestion.category,
          priority: suggestion.priority,
          status: suggestion.status,
          admin_response: suggestion.adminResponse,
          admin_response_by: suggestion.adminResponseBy,
          admin_response_at: suggestion.adminResponseAt ? new Date(suggestion.adminResponseAt).toISOString() : null
        })
        .eq('id', id)
        .select()
        .single();

      return handleSupabaseResponse({ data, error });
    },

    delete: async (id: string) => {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', id);

      if (error) throw new Error(error.message);
    }
  };

  // 대시보드 통계
  dashboard = {
    getStats: async () => {
      // 병렬로 여러 쿼리 실행
      const [
        tasksResult,
        usersResult,
        reportsResult,
        announcementsResult,
        suggestionsResult
      ] = await Promise.all([
        supabase.from('tasks').select('status'),
        supabase.from('users').select('id'),
        supabase.from('daily_reports').select('id'),
        supabase.from('announcements').select('id').eq('is_active', true),
        supabase.from('suggestions').select('id')
      ]);

      const tasks = tasksResult.data || [];
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'completed').length;
      const pendingTasks = tasks.filter(t => t.status === 'pending').length;
      const overdueTasks = 0; // 계산 로직 필요

      return {
        totalTasks,
        completedTasks,
        pendingTasks,
        overdueTasks,
        totalUsers: (usersResult.data || []).length,
        activeCustomers: 0, // clients 테이블에서 조회 필요
        monthlyRevenue: 0, // sales_entries에서 계산 필요
        dailyReports: (reportsResult.data || []).length,
        announcements: (announcementsResult.data || []).length,
        suggestions: (suggestionsResult.data || []).length
      };
    }
  };

  // 알림
  notifications = {
    getAll: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);

      const notifications = (data || []).map(notif => ({
        id: notif.id,
        userId: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: notif.is_read,
        link: notif.link,
        createdAt: notif.created_at,
        updatedAt: notif.updated_at
      }));

      return { data: notifications };
    },

    getByUserId: async (userId: string) => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);

      const notifications = (data || []).map(notif => ({
        id: notif.id,
        userId: notif.user_id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        isRead: notif.is_read,
        link: notif.link,
        createdAt: notif.created_at,
        updatedAt: notif.updated_at
      }));

      return { data: notifications };
    },

    create: async (notificationData: {
      userId: string;
      type: string;
      title: string;
      message: string;
      link?: string;
    }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: notificationData.userId,
          type: notificationData.type,
          title: notificationData.title,
          message: notificationData.message,
          link: notificationData.link,
          is_read: false
        }])
        .select();

      if (error) throw new Error(error.message);

      return { data: data[0] };
    },

    markAsRead: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw new Error(error.message);

      return { success: true };
    },

    markAllAsRead: async (userId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw new Error(error.message);

      return { success: true };
    },

    delete: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw new Error(error.message);

      return { success: true };
    }
  };
}

export const supabaseApiService = new SupabaseApiService();
export default supabaseApiService;