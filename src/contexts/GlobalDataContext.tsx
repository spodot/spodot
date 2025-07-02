import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  Task, 
  DailyReport, 
  Announcement, 
  Manual, 
  SalesEntry,
  Customer,
  Suggestion,
  DashboardStats,
  Notification,
  FilterOptions
} from '../types';
import { supabaseApiService } from '../services/supabaseApi';

interface GlobalState {
  // 데이터
  tasks: Task[];
  dailyReports: DailyReport[];
  announcements: Announcement[];
  manuals: Manual[];
  sales: SalesEntry[];
  customers: Customer[];
  suggestions: Suggestion[];
  notifications: Notification[];
  dashboardStats: DashboardStats | null;
  
  // 로딩 상태
  loading: {
    tasks: boolean;
    dailyReports: boolean;
    announcements: boolean;
    manuals: boolean;
    sales: boolean;
    customers: boolean;
    suggestions: boolean;
    notifications: boolean;
    dashboardStats: boolean;
  };
  
  // 에러 상태
  errors: {
    [key: string]: string | null;
  };
  
  // 필터 상태
  filters: {
    tasks: FilterOptions;
    dailyReports: FilterOptions;
    announcements: FilterOptions;
    manuals: FilterOptions;
    sales: FilterOptions;
    customers: FilterOptions;
    suggestions: FilterOptions;
  };
}

type GlobalAction = 
  | { type: 'SET_LOADING'; payload: { key: keyof GlobalState['loading']; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { key: string; error: string | null } }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_DAILY_REPORTS'; payload: DailyReport[] }
  | { type: 'ADD_DAILY_REPORT'; payload: DailyReport }
  | { type: 'UPDATE_DAILY_REPORT'; payload: DailyReport }
  | { type: 'SET_ANNOUNCEMENTS'; payload: Announcement[] }
  | { type: 'ADD_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'UPDATE_ANNOUNCEMENT'; payload: Announcement }
  | { type: 'DELETE_ANNOUNCEMENT'; payload: string }
  | { type: 'SET_MANUALS'; payload: Manual[] }
  | { type: 'ADD_MANUAL'; payload: Manual }
  | { type: 'UPDATE_MANUAL'; payload: Manual }
  | { type: 'DELETE_MANUAL'; payload: string }
  | { type: 'SET_SALES'; payload: SalesEntry[] }
  | { type: 'ADD_SALES'; payload: SalesEntry }
  | { type: 'UPDATE_SALES'; payload: SalesEntry }
  | { type: 'DELETE_SALES'; payload: string }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_SUGGESTIONS'; payload: Suggestion[] }
  | { type: 'ADD_SUGGESTION'; payload: Suggestion }
  | { type: 'UPDATE_SUGGESTION'; payload: Suggestion }
  | { type: 'DELETE_SUGGESTION'; payload: string }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_DASHBOARD_STATS'; payload: DashboardStats }
  | { type: 'SET_FILTER'; payload: { key: keyof GlobalState['filters']; filter: FilterOptions } };

const initialState: GlobalState = {
  tasks: [],
  dailyReports: [],
  announcements: [],
  manuals: [],
  sales: [],
  customers: [],
  suggestions: [],
  notifications: [],
  dashboardStats: null,
  loading: {
    tasks: false,
    dailyReports: false,
    announcements: false,
    manuals: false,
    sales: false,
    customers: false,
    suggestions: false,
    notifications: false,
    dashboardStats: false,
  },
  errors: {},
  filters: {
    tasks: {},
    dailyReports: {},
    announcements: {},
    manuals: {},
    sales: {},
    customers: {},
    suggestions: {},
  },
};

function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.loading }
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.error }
      };
    
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => task.id === action.payload.id ? action.payload : task)
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter(task => task.id !== action.payload) };

    case 'SET_DAILY_REPORTS':
      return { ...state, dailyReports: action.payload };
    case 'ADD_DAILY_REPORT':
      return { ...state, dailyReports: [action.payload, ...state.dailyReports] };
    case 'UPDATE_DAILY_REPORT':
      return {
        ...state,
        dailyReports: state.dailyReports.map(report => 
          report.id === action.payload.id ? action.payload : report
        )
      };

    case 'SET_ANNOUNCEMENTS':
      return { ...state, announcements: action.payload };
    case 'ADD_ANNOUNCEMENT':
      return { ...state, announcements: [action.payload, ...state.announcements] };
    case 'UPDATE_ANNOUNCEMENT':
      return {
        ...state,
        announcements: state.announcements.map(ann => 
          ann.id === action.payload.id ? action.payload : ann
        )
      };
    case 'DELETE_ANNOUNCEMENT':
      return { ...state, announcements: state.announcements.filter(ann => ann.id !== action.payload) };

    case 'SET_MANUALS':
      return { ...state, manuals: action.payload };
    case 'ADD_MANUAL':
      return { ...state, manuals: [action.payload, ...state.manuals] };
    case 'UPDATE_MANUAL':
      return {
        ...state,
        manuals: state.manuals.map(manual => 
          manual.id === action.payload.id ? action.payload : manual
        )
      };
    case 'DELETE_MANUAL':
      return { ...state, manuals: state.manuals.filter(manual => manual.id !== action.payload) };

    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALES':
      return { ...state, sales: [action.payload, ...state.sales] };
    case 'UPDATE_SALES':
      return {
        ...state,
        sales: state.sales.map(sale => 
          sale.id === action.payload.id ? action.payload : sale
        )
      };
    case 'DELETE_SALES':
      return { ...state, sales: state.sales.filter(sale => sale.id !== action.payload) };

    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [action.payload, ...state.customers] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(customer => 
          customer.id === action.payload.id ? action.payload : customer
        )
      };
    case 'DELETE_CUSTOMER':
      return { ...state, customers: state.customers.filter(customer => customer.id !== action.payload) };

    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    case 'ADD_SUGGESTION':
      return { ...state, suggestions: [action.payload, ...state.suggestions] };
    case 'UPDATE_SUGGESTION':
      return {
        ...state,
        suggestions: state.suggestions.map(suggestion => 
          suggestion.id === action.payload.id ? action.payload : suggestion
        )
      };
    case 'DELETE_SUGGESTION':
      return { ...state, suggestions: state.suggestions.filter(suggestion => suggestion.id !== action.payload) };

    case 'SET_NOTIFICATIONS':
      return { ...state, notifications: action.payload };
    case 'ADD_NOTIFICATION':
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification => 
          notification.id === action.payload.id ? action.payload : notification
        )
      };
    case 'DELETE_NOTIFICATION':
      return { ...state, notifications: state.notifications.filter(notification => notification.id !== action.payload) };

    case 'SET_DASHBOARD_STATS':
      return { ...state, dashboardStats: action.payload };

    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.filter }
      };

    default:
      return state;
  }
}

interface GlobalDataContextValue {
  state: GlobalState;
  
  // 데이터 로드 함수들
  loadTasks: (filters?: FilterOptions) => Promise<void>;
  loadDailyReports: (filters?: FilterOptions) => Promise<void>;
  loadAnnouncements: (filters?: FilterOptions) => Promise<void>;
  loadManuals: (filters?: FilterOptions) => Promise<void>;
  loadSales: (filters?: FilterOptions) => Promise<void>;
  loadCustomers: (filters?: FilterOptions) => Promise<void>;
  loadSuggestions: (filters?: FilterOptions) => Promise<void>;
  loadNotifications: () => Promise<void>;
  loadDashboardStats: () => Promise<void>;
  
  // CRUD 작업 함수들
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, task: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  
  createDailyReport: (report: Partial<DailyReport>) => Promise<void>;
  updateDailyReport: (id: string, report: Partial<DailyReport>) => Promise<void>;
  
  createAnnouncement: (announcement: Partial<Announcement>) => Promise<void>;
  updateAnnouncement: (id: string, announcement: Partial<Announcement>) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
  
  createManual: (manual: Partial<Manual>) => Promise<void>;
  updateManual: (id: string, manual: Partial<Manual>) => Promise<void>;
  deleteManual: (id: string) => Promise<void>;
  
  // 알림 관련
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // 필터 설정
  setFilter: (key: keyof GlobalState['filters'], filter: FilterOptions) => void;
  
  // 전체 데이터 새로고침
  refreshAllData: () => Promise<void>;
}

const GlobalDataContext = createContext<GlobalDataContextValue | undefined>(undefined);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(globalReducer, initialState);

  // 로딩 헬퍼 함수
  const withLoading = async <T,>(
    key: keyof GlobalState['loading'],
    operation: () => Promise<T>
  ): Promise<T> => {
    dispatch({ type: 'SET_LOADING', payload: { key, loading: true } });
    dispatch({ type: 'SET_ERROR', payload: { key: key as string, error: null } });
    
    try {
      const result = await operation();
      return result;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: { 
        key: key as string, 
        error: error instanceof Error ? error.message : '오류가 발생했습니다.' 
      }});
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key, loading: false } });
    }
  };

  // 데이터 로드 함수들
  const loadTasks = async (filters?: FilterOptions) => {
    await withLoading('tasks', async () => {
      const response = await supabaseApiService.tasks.getAll(filters);
      dispatch({ type: 'SET_TASKS', payload: response.data });
    });
  };

  const loadDailyReports = async (filters?: FilterOptions) => {
    await withLoading('dailyReports', async () => {
      const response = await supabaseApiService.dailyReports.getAll(filters);
      dispatch({ type: 'SET_DAILY_REPORTS', payload: response.data });
    });
  };

  const loadAnnouncements = async (filters?: FilterOptions) => {
    await withLoading('announcements', async () => {
      const response = await supabaseApiService.announcements.getAll(filters);
      dispatch({ type: 'SET_ANNOUNCEMENTS', payload: response.data });
    });
  };

  const loadManuals = async (filters?: FilterOptions) => {
    await withLoading('manuals', async () => {
      const response = await supabaseApiService.manuals.getAll(filters);
      dispatch({ type: 'SET_MANUALS', payload: response.data });
    });
  };

  const loadSales = async (filters?: FilterOptions) => {
    await withLoading('sales', async () => {
      const response = await supabaseApiService.sales.getAll(filters);
      dispatch({ type: 'SET_SALES', payload: response.data });
    });
  };

  const loadCustomers = async (filters?: FilterOptions) => {
    await withLoading('customers', async () => {
      const response = await supabaseApiService.customers.getAll(filters);
      dispatch({ type: 'SET_CUSTOMERS', payload: response.data });
    });
  };

  const loadSuggestions = async (filters?: FilterOptions) => {
    await withLoading('suggestions', async () => {
      const response = await supabaseApiService.suggestions.getAll(filters);
      dispatch({ type: 'SET_SUGGESTIONS', payload: response.data });
    });
  };

  const loadNotifications = async () => {
    await withLoading('notifications', async () => {
      const response = await supabaseApiService.notifications.getAll();
      dispatch({ type: 'SET_NOTIFICATIONS', payload: response.data });
    });
  };

  const loadDashboardStats = async () => {
    await withLoading('dashboardStats', async () => {
      const response = await supabaseApiService.dashboard.getStats();
      dispatch({ type: 'SET_DASHBOARD_STATS', payload: response });
    });
  };

  // CRUD 작업 함수들
  const createTask = async (task: Partial<Task>) => {
    const response = await supabaseApiService.tasks.create(task);
    dispatch({ type: 'ADD_TASK', payload: response });
  };

  const updateTask = async (id: string, task: Partial<Task>) => {
    const response = await supabaseApiService.tasks.update(id, task);
    dispatch({ type: 'UPDATE_TASK', payload: response });
  };

  const deleteTask = async (id: string) => {
    await supabaseApiService.tasks.delete(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const createDailyReport = async (report: Partial<DailyReport>) => {
    const response = await supabaseApiService.dailyReports.create(report);
    dispatch({ type: 'ADD_DAILY_REPORT', payload: response });
  };

  const updateDailyReport = async (id: string, report: Partial<DailyReport>) => {
    const response = await supabaseApiService.dailyReports.update(id, report);
    dispatch({ type: 'UPDATE_DAILY_REPORT', payload: response });
  };

  const createAnnouncement = async (announcement: Partial<Announcement>) => {
    const response = await supabaseApiService.announcements.create(announcement);
    dispatch({ type: 'ADD_ANNOUNCEMENT', payload: response });
  };

  const updateAnnouncement = async (id: string, announcement: Partial<Announcement>) => {
    const response = await supabaseApiService.announcements.update(id, announcement);
    dispatch({ type: 'UPDATE_ANNOUNCEMENT', payload: response });
  };

  const deleteAnnouncement = async (id: string) => {
    await supabaseApiService.announcements.delete(id);
    dispatch({ type: 'DELETE_ANNOUNCEMENT', payload: id });
  };

  const createManual = async (manual: Partial<Manual>) => {
    const response = await supabaseApiService.manuals.create(manual);
    dispatch({ type: 'ADD_MANUAL', payload: response });
  };

  const updateManual = async (id: string, manual: Partial<Manual>) => {
    const response = await supabaseApiService.manuals.update(id, manual);
    dispatch({ type: 'UPDATE_MANUAL', payload: response });
  };

  const deleteManual = async (id: string) => {
    await supabaseApiService.manuals.delete(id);
    dispatch({ type: 'DELETE_MANUAL', payload: id });
  };

  // 알림 관련
  const markNotificationAsRead = async (id: string) => {
    await supabaseApiService.notifications.markAsRead(id);
    const notification = state.notifications.find(n => n.id === id);
    if (notification) {
      dispatch({ type: 'UPDATE_NOTIFICATION', payload: { ...notification, isRead: true } });
    }
  };

  const markAllNotificationsAsRead = async () => {
    const currentUserId = localStorage.getItem('currentUserId');
    if (currentUserId) {
      await supabaseApiService.notifications.markAllAsRead(currentUserId);
      const updatedNotifications = state.notifications.map(n => ({ ...n, isRead: true }));
      dispatch({ type: 'SET_NOTIFICATIONS', payload: updatedNotifications });
    }
  };

  const deleteNotification = async (id: string) => {
    await supabaseApiService.notifications.delete(id);
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
  };

  // 필터 설정
  const setFilter = (key: keyof GlobalState['filters'], filter: FilterOptions) => {
    dispatch({ type: 'SET_FILTER', payload: { key, filter } });
  };

  // 전체 데이터 새로고침
  const refreshAllData = async () => {
    await Promise.all([
      loadTasks(),
      loadDailyReports(),
      loadAnnouncements(),
      loadManuals(),
      loadSales(),
      loadCustomers(),
      loadSuggestions(),
      loadNotifications(),
      loadDashboardStats(),
    ]);
  };

  // 초기 데이터 로드
  useEffect(() => {
    refreshAllData();
  }, []);

  const value: GlobalDataContextValue = {
    state,
    loadTasks,
    loadDailyReports,
    loadAnnouncements,
    loadManuals,
    loadSales,
    loadCustomers,
    loadSuggestions,
    loadNotifications,
    loadDashboardStats,
    createTask,
    updateTask,
    deleteTask,
    createDailyReport,
    updateDailyReport,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    createManual,
    updateManual,
    deleteManual,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    setFilter,
    refreshAllData,
  };

  return (
    <GlobalDataContext.Provider value={value}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalData() {
  const context = useContext(GlobalDataContext);
  if (context === undefined) {
    throw new Error('useGlobalData must be used within a GlobalDataProvider');
  }
  return context;
} 