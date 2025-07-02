import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/common/ErrorBoundary';

// 전역 에러 핸들링 설정
window.addEventListener('error', (event) => {
  console.error('전역 JavaScript 에러:', event.error);
  // 프로덕션에서는 에러 리포팅 서비스로 전송
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('처리되지 않은 Promise 거부:', event.reason);
  // 프로덕션에서는 에러 리포팅 서비스로 전송
});

// 성능 모니터링 (개발 환경에서만)
if (process.env.NODE_ENV === 'development') {
  // React DevTools Profiler 활성화
  if (typeof window !== 'undefined' && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.settings = {
      ...((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__.settings || {}),
      profilerEnabled: true
    };
  }

  // 성능 측정
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.entryType === 'navigation') {
        console.log('페이지 로드 성능:', {
          name: entry.name,
          duration: Math.round(entry.duration),
          loadComplete: Math.round((entry as PerformanceNavigationTiming).loadEventEnd)
        });
      }
    });
  });
  
  observer.observe({ entryTypes: ['navigation'] });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);