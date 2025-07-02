import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { setupGlobalErrorHandling } from './utils/errorHandler';

// 전역 에러 핸들링 설정
setupGlobalErrorHandling();

// 개발 환경에서만 console.log 표시
if (import.meta.env.DEV) {
  console.log('🚀 개발 모드로 실행 중...');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);