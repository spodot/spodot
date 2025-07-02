import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React 관련 라이브러리들
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Supabase 관련 
          'supabase': ['@supabase/supabase-js'],
          
          // UI 라이브러리들
          'ui-vendor': ['lucide-react', 'date-fns'],
          
          // 무거운 라이브러리들 분리
          'utils': ['html2canvas', 'dompurify'],
          
          // 각 페이지별 청크 분리
          'admin-pages': [
            './src/pages/admin/AdminDashboard',
            './src/pages/admin/AnnouncementsManagement',
            './src/pages/admin/ReportManagement',
            './src/pages/admin/StaffManagement',
            './src/pages/admin/SuggestionsManagement',
            './src/pages/admin/TaskManagement'
          ],
          
          // Context들 분리
          'contexts': [
            './src/contexts/AuthContext',
            './src/contexts/RealtimeContext',
            './src/contexts/UserContext',
            './src/contexts/TaskContext',
            './src/contexts/NotificationContext'
          ]
        }
      }
    },
    // 청크 크기 경고 임계값 증가 (임시)
    chunkSizeWarningLimit: 1000,
    
    // 최적화 설정
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 프로덕션에서 console 제거
        drop_debugger: true
      }
    }
  },
  
  // 개발 서버 설정
  server: {
    port: 5173,
    host: true,
    open: true
  },
  
  // 환경 변수 설정
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
});
