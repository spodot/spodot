import { showError, showWarning, showInfo } from './notifications';
import { logPermissionDenied, logUnauthorizedAccess, securityAudit } from './securityAudit';
import { UserRole } from '../types/permissions';

// 🚨 에러 타입 정의
export type ErrorType = 
  | 'network'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'database'
  | 'file_upload'
  | 'permission'
  | 'business_logic'
  | 'timeout'
  | 'unknown';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface AppError {
  type: ErrorType;
  severity: ErrorSeverity;
  code?: string;
  message: string;
  userMessage: string;
  details?: any;
  context?: {
    userId?: string;
    userRole?: UserRole;
    action?: string;
    resource?: string;
    timestamp?: Date;
  };
  retryable?: boolean;
  silent?: boolean;
}

// 🔍 에러 분류 및 사용자 메시지 생성
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: AppError[] = [];

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // 📊 에러 분석 및 분류
  public analyzeError(error: any, context?: Partial<AppError['context']>): AppError {
    let appError: AppError;

    // Supabase 에러 처리
    if (error?.code) {
      appError = this.handleSupabaseError(error, context);
    }
    // 네트워크 에러 처리
    else if (error?.name === 'NetworkError' || error?.message?.includes('fetch')) {
      appError = this.handleNetworkError(error, context);
    }
    // 권한 에러 처리
    else if (error?.message?.includes('권한') || error?.message?.includes('permission')) {
      appError = this.handlePermissionError(error, context);
    }
    // 유효성 검사 에러 처리
    else if (error?.message?.includes('validation') || error?.name === 'ValidationError') {
      appError = this.handleValidationError(error, context);
    }
    // 일반 에러 처리
    else {
      appError = this.handleGenericError(error, context);
    }

    // 에러 로깅
    this.logError(appError);

    return appError;
  }

  // 🎯 사용자에게 에러 표시
  public handleError(error: any, context?: Partial<AppError['context']>): void {
    const appError = this.analyzeError(error, context);

    // 조용한 에러는 로그만 남기고 사용자에게 표시하지 않음
    if (appError.silent) {
      return;
    }

    // 심각도에 따른 표시 방식 결정
    switch (appError.severity) {
      case 'critical':
        this.showCriticalError(appError);
        break;
      case 'high':
        showError(appError.userMessage);
        this.reportToSecuritySystem(appError);
        break;
      case 'medium':
        showWarning(appError.userMessage);
        break;
      case 'low':
        showInfo(appError.userMessage);
        break;
    }

    // 재시도 가능한 에러인 경우 안내 (조용한 에러가 아닌 경우만)
    if (appError.retryable && !appError.silent) {
      setTimeout(() => {
        showInfo('잠시 후 다시 시도해보세요.');
      }, 2000);
    }
  }

  // 🔥 Supabase 에러 처리
  private handleSupabaseError(error: any, context?: Partial<AppError['context']>): AppError {
    const { code, message } = error;

    switch (code) {
      case 'PGRST301': // 중복 키
        return {
          type: 'database',
          severity: 'medium',
          code,
          message,
          userMessage: '이미 존재하는 데이터입니다. 다른 값으로 시도해주세요.',
          context: { ...context, timestamp: new Date() },
          retryable: false
        };

      case 'PGRST116': // 권한 없음
        return {
          type: 'authorization',
          severity: 'high',
          code,
          message,
          userMessage: '해당 작업을 수행할 권한이 없습니다.',
          context: { ...context, timestamp: new Date() },
          retryable: false
        };

      case '23505': // 고유 제약 조건 위반
        return {
          type: 'validation',
          severity: 'medium',
          code,
          message,
          userMessage: '중복된 값이 존재합니다. 다른 값을 입력해주세요.',
          context: { ...context, timestamp: new Date() },
          retryable: false
        };

      case '23503': // 외래 키 제약 조건 위반
        return {
          type: 'validation',
          severity: 'medium',
          code,
          message,
          userMessage: '연결된 데이터가 없어 작업을 완료할 수 없습니다.',
          context: { ...context, timestamp: new Date() },
          retryable: false
        };

      case '42P01': // 테이블 존재하지 않음
        return {
          type: 'database',
          severity: 'critical',
          code,
          message,
          userMessage: '시스템 오류가 발생했습니다. 관리자에게 문의해주세요.',
          context: { ...context, timestamp: new Date() },
          retryable: false
        };

      default:
        return {
          type: 'database',
          severity: 'medium',
          code,
          message,
          userMessage: '데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
          context: { ...context, timestamp: new Date() },
          retryable: true
        };
    }
  }

  // 🌐 네트워크 에러 처리
  private handleNetworkError(error: any, context?: Partial<AppError['context']>): AppError {
    return {
      type: 'network',
      severity: 'low',
      message: error.message,
      userMessage: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      context: { ...context, timestamp: new Date() },
      retryable: true,
      silent: true // 네트워크 에러 알림 숨김
    };
  }

  // 🔐 권한 에러 처리
  private handlePermissionError(error: any, context?: Partial<AppError['context']>): AppError {
    return {
      type: 'permission',
      severity: 'high',
      message: error.message,
      userMessage: '해당 기능을 사용할 권한이 없습니다. 관리자에게 문의하세요.',
      context: { ...context, timestamp: new Date() },
      retryable: false
    };
  }

  // ✅ 유효성 검사 에러 처리
  private handleValidationError(error: any, context?: Partial<AppError['context']>): AppError {
    const friendlyMessages: Record<string, string> = {
      'required': '필수 입력 항목입니다.',
      'email': '올바른 이메일 주소를 입력해주세요.',
      'password': '비밀번호는 8자 이상이어야 합니다.',
      'phone': '올바른 전화번호를 입력해주세요.',
      'date': '올바른 날짜를 선택해주세요.',
      'number': '숫자만 입력 가능합니다.',
      'min_length': '최소 길이를 확인해주세요.',
      'max_length': '최대 길이를 초과했습니다.',
      'file_size': '파일 크기가 너무 큽니다. (최대 5MB)',
      'file_type': '지원하지 않는 파일 형식입니다.'
    };

    const message = error.message?.toLowerCase() || '';
    let userMessage = '입력값을 확인해주세요.';

    // 메시지에서 키워드 찾기
    for (const [key, friendlyMsg] of Object.entries(friendlyMessages)) {
      if (message.includes(key)) {
        userMessage = friendlyMsg;
        break;
      }
    }

    return {
      type: 'validation',
      severity: 'low',
      message: error.message,
      userMessage,
      context: { ...context, timestamp: new Date() },
      retryable: false
    };
  }

  // ❓ 일반 에러 처리
  private handleGenericError(error: any, context?: Partial<AppError['context']>): AppError {
    return {
      type: 'unknown',
      severity: 'low',
      message: error.message || 'Unknown error',
      userMessage: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      context: { ...context, timestamp: new Date() },
      retryable: true,
      silent: true // 일반 에러 알림 숨김
    };
  }

  // 🚨 치명적 에러 표시
  private showCriticalError(appError: AppError): void {
    // 치명적 에러는 모달로 표시
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    
    overlay.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div class="flex items-center space-x-3 mb-4">
          <div class="text-red-600 p-2 rounded-full bg-red-50">
            <span class="text-2xl">🚨</span>
          </div>
          <h3 class="text-lg font-semibold text-gray-900">시스템 오류</h3>
        </div>
        <p class="text-gray-600 mb-6">${appError.userMessage}</p>
        <div class="flex justify-end">
          <button id="close-critical-error" class="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg">
            확인
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const closeBtn = overlay.querySelector('#close-critical-error');
    closeBtn?.addEventListener('click', () => {
      document.body.removeChild(overlay);
    });
  }

  // 📊 보안 시스템에 에러 보고
  private reportToSecuritySystem(appError: AppError): void {
    if (appError.context?.userId && appError.context?.userRole) {
      if (appError.type === 'permission' || appError.type === 'authorization') {
        logUnauthorizedAccess(
          appError.context.userId,
          appError.context.userRole,
          appError.context.resource || 'unknown'
        );
      }
    }
  }

  // 📝 에러 로깅
  private logError(appError: AppError): void {
    this.errorLog.push(appError);

    // 개발 환경에서는 상세 로그
    if (import.meta.env.DEV) {
      console.group(`🚨 [ERROR ${appError.severity.toUpperCase()}] ${appError.type}`);
      console.error('Original:', appError.message);
      console.info('User Message:', appError.userMessage);
      console.info('Context:', appError.context);
      console.groupEnd();
    }

    // 프로덕션에서는 중요한 에러만
    if (import.meta.env.PROD && 
        (appError.severity === 'high' || appError.severity === 'critical')) {
      console.error('[ERROR]', {
        type: appError.type,
        severity: appError.severity,
        code: appError.code,
        context: appError.context
      });
    }
  }

  // 📈 에러 통계 조회
  public getErrorStats(hours = 24) {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentErrors = this.errorLog.filter(error => 
      error.context?.timestamp && error.context.timestamp > cutoff
    );

    return {
      total: recentErrors.length,
      byType: this.groupBy(recentErrors, 'type'),
      bySeverity: this.groupBy(recentErrors, 'severity'),
      critical: recentErrors.filter(e => e.severity === 'critical').length,
      retryable: recentErrors.filter(e => e.retryable).length
    };
  }

  // 🧹 오래된 에러 로그 정리
  public cleanupErrorLog(hours = 168): void { // 기본 7일
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const originalLength = this.errorLog.length;
    
    this.errorLog = this.errorLog.filter(error => 
      error.context?.timestamp && error.context.timestamp > cutoff
    );

    console.log(`[ERROR CLEANUP] Removed ${originalLength - this.errorLog.length} old error logs`);
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((acc, item) => {
      const value = String(item[key]);
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// 🛠️ 전역 에러 핸들러 인스턴스
export const errorHandler = ErrorHandler.getInstance();

// 🎯 편의 함수들
export const handleError = (error: any, context?: Partial<AppError['context']>) => {
  errorHandler.handleError(error, context);
};

export const handleApiError = (error: any, action: string, userId?: string, userRole?: UserRole) => {
  errorHandler.handleError(error, {
    action,
    userId,
    userRole,
    resource: 'api'
  });
};

export const handleValidationError = (field: string, message: string) => {
  errorHandler.handleError({
    name: 'ValidationError',
    message: `${field}: ${message}`
  });
};

export const handleFileError = (fileName: string, error: string) => {
  errorHandler.handleError({
    message: `file_${error}`,
    fileName
  }, {
    action: 'file_upload',
    resource: fileName
  });
};

// 🔄 재시도 메커니즘
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000,
  context?: Partial<AppError['context']>
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        handleError(error, { ...context, action: `retry_failed_after_${maxRetries}_attempts` });
        throw error;
      }
      
      // 지수 백오프
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }
  
  throw lastError;
};

// 🎮 전역 에러 캐처 설정
export const setupGlobalErrorHandling = () => {
  // 미처리 Promise 거부 처리
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    handleError(event.reason, { action: 'unhandled_promise_rejection' });
    event.preventDefault(); // 기본 에러 표시 방지
  });

  // 일반 JavaScript 에러 처리
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    handleError(event.error, { action: 'global_javascript_error' });
  });

  // 주기적 에러 로그 정리 (1시간마다)
  setInterval(() => {
    errorHandler.cleanupErrorLog();
  }, 60 * 60 * 1000);
}; 