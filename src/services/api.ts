import { 
  User, 
  Task, 
  DailyReport, 
  Announcement, 
  Manual, 
  SalesEntry, 
  Customer, 
  Suggestion,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  DashboardStats,
  Notification
} from '../types';

// API 기본 설정
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'API 요청 실패');
      }
      
      return data;
    } catch (error) {
      console.error('API 요청 오류:', error);
      throw error;
    }
  }

  // 인증 관련
  auth = {
    login: (credentials: { email: string; password: string }) =>
      this.request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    
    logout: () =>
      this.request<void>('/auth/logout', { method: 'POST' }),
    
    getCurrentUser: () =>
      this.request<User>('/auth/me'),
    
    refreshToken: () =>
      this.request<{ token: string }>('/auth/refresh', { method: 'POST' }),
  };

  // 업무 관리
  tasks = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<Task>>(`/tasks?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<Task>(`/tasks/${id}`),
    
    create: (task: Partial<Task>) =>
      this.request<Task>('/tasks', {
        method: 'POST',
        body: JSON.stringify(task),
      }),
    
    update: (id: string, task: Partial<Task>) =>
      this.request<Task>(`/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(task),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    
    addComment: (taskId: string, content: string) =>
      this.request<void>(`/tasks/${taskId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
  };

  // 일일 보고
  dailyReports = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<DailyReport>>(`/daily-reports?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<DailyReport>(`/daily-reports/${id}`),
    
    create: (report: Partial<DailyReport>) =>
      this.request<DailyReport>('/daily-reports', {
        method: 'POST',
        body: JSON.stringify(report),
      }),
    
    update: (id: string, report: Partial<DailyReport>) =>
      this.request<DailyReport>(`/daily-reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(report),
      }),
    
    uploadImage: (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      
      return this.request<{ url: string; id: string }>('/daily-reports/upload-image', {
        method: 'POST',
        body: formData,
        headers: {}, // FormData는 Content-Type을 자동 설정
      });
    },
  };

  // 공지사항
  announcements = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<Announcement>>(`/announcements?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<Announcement>(`/announcements/${id}`),
    
    create: (announcement: Partial<Announcement>) =>
      this.request<Announcement>('/announcements', {
        method: 'POST',
        body: JSON.stringify(announcement),
      }),
    
    update: (id: string, announcement: Partial<Announcement>) =>
      this.request<Announcement>(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify(announcement),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/announcements/${id}`, { method: 'DELETE' }),
    
    markAsRead: (id: string) =>
      this.request<void>(`/announcements/${id}/read`, { method: 'POST' }),
  };

  // 메뉴얼
  manuals = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<Manual>>(`/manuals?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<Manual>(`/manuals/${id}`),
    
    create: (manual: Partial<Manual>) =>
      this.request<Manual>('/manuals', {
        method: 'POST',
        body: JSON.stringify(manual),
      }),
    
    update: (id: string, manual: Partial<Manual>) =>
      this.request<Manual>(`/manuals/${id}`, {
        method: 'PUT',
        body: JSON.stringify(manual),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/manuals/${id}`, { method: 'DELETE' }),
    
    incrementViewCount: (id: string) =>
      this.request<void>(`/manuals/${id}/view`, { method: 'POST' }),
  };

  // 매출 관리
  sales = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<SalesEntry>>(`/sales?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<SalesEntry>(`/sales/${id}`),
    
    create: (sale: Partial<SalesEntry>) =>
      this.request<SalesEntry>('/sales', {
        method: 'POST',
        body: JSON.stringify(sale),
      }),
    
    update: (id: string, sale: Partial<SalesEntry>) =>
      this.request<SalesEntry>(`/sales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(sale),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/sales/${id}`, { method: 'DELETE' }),
  };

  // 고객 관리
  customers = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<Customer>>(`/customers?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<Customer>(`/customers/${id}`),
    
    create: (customer: Partial<Customer>) =>
      this.request<Customer>('/customers', {
        method: 'POST',
        body: JSON.stringify(customer),
      }),
    
    update: (id: string, customer: Partial<Customer>) =>
      this.request<Customer>(`/customers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(customer),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/customers/${id}`, { method: 'DELETE' }),
  };

  // 건의사항
  suggestions = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<Suggestion>>(`/suggestions?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<Suggestion>(`/suggestions/${id}`),
    
    create: (suggestion: Partial<Suggestion>) =>
      this.request<Suggestion>('/suggestions', {
        method: 'POST',
        body: JSON.stringify(suggestion),
      }),
    
    update: (id: string, suggestion: Partial<Suggestion>) =>
      this.request<Suggestion>(`/suggestions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(suggestion),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/suggestions/${id}`, { method: 'DELETE' }),
    
    addAdminResponse: (id: string, response: string) =>
      this.request<Suggestion>(`/suggestions/${id}/response`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      }),
  };

  // 사용자 관리
  users = {
    getAll: (filters?: FilterOptions) =>
      this.request<PaginatedResponse<User>>(`/users?${new URLSearchParams(filters as any)}`),
    
    getById: (id: string) =>
      this.request<User>(`/users/${id}`),
    
    create: (user: Partial<User>) =>
      this.request<User>('/users', {
        method: 'POST',
        body: JSON.stringify(user),
      }),
    
    update: (id: string, user: Partial<User>) =>
      this.request<User>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(user),
      }),
    
    delete: (id: string) =>
      this.request<void>(`/users/${id}`, { method: 'DELETE' }),
  };

  // 대시보드 통계
  dashboard = {
    getStats: () =>
      this.request<DashboardStats>('/dashboard/stats'),
    
    getRecentActivity: () =>
      this.request<any[]>('/dashboard/recent-activity'),
  };

  // 알림
  notifications = {
    getAll: () =>
      this.request<Notification[]>('/notifications'),
    
    markAsRead: (id: string) =>
      this.request<void>(`/notifications/${id}/read`, { method: 'POST' }),
    
    markAllAsRead: () =>
      this.request<void>('/notifications/read-all', { method: 'POST' }),
    
    delete: (id: string) =>
      this.request<void>(`/notifications/${id}`, { method: 'DELETE' }),
  };

  // 검색
  search = {
    global: (query: string) =>
      this.request<{
        tasks: Task[];
        announcements: Announcement[];
        manuals: Manual[];
        customers: Customer[];
      }>(`/search?q=${encodeURIComponent(query)}`),
  };
}

export const apiService = new ApiService();
export default apiService; 