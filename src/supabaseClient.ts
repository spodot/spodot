import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://piwftspnolcvpytaqaeq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpd2Z0c3Bub2xjdnB5dGFxYWVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3ODQzODMsImV4cCI6MjA2MjM2MDM4M30.79_5Nbygmj-lWnsG4Gq9E8hMk1it2UDz6IZ0vK9eAfc';

// 개발 환경에서는 경고만 표시
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다. .env 파일을 생성하여 VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 설정하세요.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
