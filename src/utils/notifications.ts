// 🔔 프로덕션용 알림 시스템
// alert, console.log 등 개발용 코드를 대체하는 사용자 친화적 알림

export interface ToastOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top' | 'bottom';
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

class NotificationSystem {
  private toastContainer: HTMLElement | null = null;

  constructor() {
    this.initToastContainer();
  }

  private initToastContainer() {
    if (typeof window === 'undefined') return;
    
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed top-4 right-4 z-50 space-y-2';
      document.body.appendChild(container);
    }
    this.toastContainer = container;
  }

  // 📢 Toast 알림 (alert 대체)
  toast(message: string, options: ToastOptions = {}) {
    if (typeof window === 'undefined') return;

    const {
      type = 'info',
      duration = 4000,
      position = 'top'
    } = options;

    const toast = document.createElement('div');
    const toastId = `toast-${Date.now()}`;
    
    const typeStyles = {
      success: 'bg-green-500 border-green-600',
      error: 'bg-red-500 border-red-600',
      warning: 'bg-yellow-500 border-yellow-600',
      info: 'bg-blue-500 border-blue-600'
    };

    const typeIcons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    toast.id = toastId;
    toast.className = `
      ${typeStyles[type]} text-white px-4 py-3 rounded-lg shadow-lg border-l-4
      transform transition-all duration-300 ease-in-out translate-x-full opacity-0
      max-w-sm cursor-pointer hover:scale-105
    `;
    
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-lg">${typeIcons[type]}</span>
        <span class="flex-1 font-medium">${message}</span>
        <button class="ml-2 hover:bg-white hover:bg-opacity-20 rounded p-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
          </svg>
        </button>
      </div>
    `;

    // 클릭으로 닫기
    toast.addEventListener('click', () => this.removeToast(toastId));

    if (this.toastContainer) {
      this.toastContainer.appendChild(toast);
      
      // 애니메이션
      setTimeout(() => {
        toast.classList.remove('translate-x-full', 'opacity-0');
      }, 100);

      // 자동 제거
      setTimeout(() => {
        this.removeToast(toastId);
      }, duration);
    }
  }

  private removeToast(toastId: string) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.classList.add('translate-x-full', 'opacity-0');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }
  }

  // ✅ 성공 메시지
  success(message: string, duration?: number) {
    this.toast(message, { type: 'success', duration });
  }

  // ❌ 에러 메시지
  error(message: string, duration?: number) {
    this.toast(message, { type: 'error', duration });
  }

  // ⚠️ 경고 메시지
  warning(message: string, duration?: number) {
    this.toast(message, { type: 'warning', duration });
  }

  // ℹ️ 정보 메시지
  info(message: string, duration?: number) {
    this.toast(message, { type: 'info', duration });
  }

  // 🤔 확인 다이얼로그 (confirm 대체)
  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(false);
        return;
      }

      const {
        title = '확인',
        message,
        confirmText = '확인',
        cancelText = '취소',
        type = 'warning'
      } = options;

      const overlay = document.createElement('div');
      overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
      
      const typeStyles = {
        danger: 'text-red-600 bg-red-50',
        warning: 'text-yellow-600 bg-yellow-50',
        info: 'text-blue-600 bg-blue-50'
      };

      const typeIcons = {
        danger: '🚨',
        warning: '⚠️',
        info: 'ℹ️'
      };

      overlay.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 scale-95 opacity-0" id="confirm-modal">
          <div class="p-6">
            <div class="flex items-center space-x-3 mb-4">
              <div class="${typeStyles[type]} p-2 rounded-full">
                <span class="text-xl">${typeIcons[type]}</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            </div>
            <p class="text-gray-600 mb-6">${message}</p>
            <div class="flex space-x-3 justify-end">
              <button id="cancel-btn" class="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                ${cancelText}
              </button>
              <button id="confirm-btn" class="px-4 py-2 text-white ${type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} rounded-lg transition-colors">
                ${confirmText}
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      // 애니메이션
      const modal = document.getElementById('confirm-modal');
      setTimeout(() => {
        overlay.classList.remove('bg-opacity-50');
        overlay.classList.add('bg-opacity-50');
        if (modal) {
          modal.classList.remove('scale-95', 'opacity-0');
        }
      }, 100);

      // 이벤트 리스너
      const cleanup = () => {
        overlay.classList.add('bg-opacity-0');
        if (modal) {
          modal.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => {
          overlay.remove();
        }, 300);
      };

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          cleanup();
          resolve(false);
        }
      });

      document.getElementById('cancel-btn')?.addEventListener('click', () => {
        cleanup();
        resolve(false);
      });

      document.getElementById('confirm-btn')?.addEventListener('click', () => {
        cleanup();
        resolve(true);
      });

      // ESC 키 지원
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(false);
          document.removeEventListener('keydown', handleEsc);
        }
      };
      document.addEventListener('keydown', handleEsc);
    });
  }
}

// 🚀 Logger 시스템 (console.log 대체)
class Logger {
  private isDevelopment = import.meta.env.DEV;

  // 개발 환경에서만 콘솔 출력
  private log(level: 'log' | 'error' | 'warn' | 'info', message: string, ...args: any[]) {
    if (this.isDevelopment) {
      console[level](`[${new Date().toLocaleTimeString()}] ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log('log', `🐛 ${message}`, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log('info', `ℹ️ ${message}`, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', `⚠️ ${message}`, ...args);
  }

  error(message: string, error?: any) {
    this.log('error', `❌ ${message}`, error);
    
    // 프로덕션에서는 에러를 외부 서비스로 전송할 수 있음
    if (!this.isDevelopment && error) {
      // TODO: 에러 리포팅 서비스 (Sentry, LogRocket 등) 연동
    }
  }

  // 성능 측정
  time(label: string) {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string) {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // 그룹 로깅
  group(label: string) {
    if (this.isDevelopment) {
      console.group(label);
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd();
    }
  }
}

// 전역 인스턴스
export const notify = new NotificationSystem();
export const logger = new Logger();

// 편의 함수들
export const showSuccess = (message: string) => notify.success(message);
export const showError = (message: string) => notify.error(message);
export const showWarning = (message: string) => notify.warning(message);
export const showInfo = (message: string) => notify.info(message);

export const confirmAction = (message: string, options?: Partial<ConfirmOptions>) => 
  notify.confirm({ message, ...options });

export const confirmDelete = (itemName?: string) => 
  notify.confirm({
    title: '삭제 확인',
    message: `정말로 ${itemName || '이 항목을'}을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
    confirmText: '삭제',
    cancelText: '취소',
    type: 'danger'
  });

// 개발용 코드 감지 및 경고
if (import.meta.env.PROD) {
  // 프로덕션에서 console.log 사용시 경고
  const originalLog = console.log;
  console.log = (...args) => {
    logger.warn('프로덕션에서 console.log 사용이 감지되었습니다. logger.debug()를 사용하세요.');
    originalLog(...args);
  };

  // 프로덕션에서 alert 사용시 경고
  const originalAlert = window.alert;
  window.alert = (message) => {
    logger.warn('프로덕션에서 alert 사용이 감지되었습니다. notify.info()를 사용하세요.');
    notify.info(String(message));
  };
} 