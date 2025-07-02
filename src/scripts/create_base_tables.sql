-- 🏗️ Spodot 피트니스 관리 시스템 기본 테이블 생성 스크립트
-- 기본적으로 필요한 테이블들을 생성합니다.

-- 1. 사용자 테이블 (가장 기본이 되는 테이블)
CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(255) NOT NULL,
  email varchar(255) UNIQUE NOT NULL,
  password varchar(255) NOT NULL,
  role varchar(20) CHECK (role IN ('admin', 'trainer', 'staff', 'user', 'client')) NOT NULL DEFAULT 'user',
  department varchar(100),
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
  phone varchar(20),
  position varchar(100),
  permissions jsonb DEFAULT '[]',
  profile_image varchar(500),
  last_login timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. 업무 테이블
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority varchar(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category varchar(50) DEFAULT 'general' CHECK (category IN ('maintenance', 'administrative', 'client', 'training', 'general')),
  assigned_to uuid,
  created_by uuid,
  due_date date,
  start_time time,
  end_time time,
  tags jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. 일일 보고서 테이블
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  date date NOT NULL,
  tasks jsonb,
  issues text,
  tomorrow text,
  images jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. 공지사항 테이블
CREATE TABLE IF NOT EXISTS announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  priority varchar(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  tags jsonb DEFAULT '[]',
  expiry_date date,
  is_pinned boolean DEFAULT false,
  is_active boolean DEFAULT true,
  target_roles jsonb DEFAULT '[]',
  read_by jsonb DEFAULT '[]',
  attachments jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. 매뉴얼 테이블
CREATE TABLE IF NOT EXISTS manuals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  category varchar(100),
  tags jsonb DEFAULT '[]',
  author_id uuid,
  author_name varchar(255) NOT NULL,
  view_count integer DEFAULT 0,
  is_published boolean DEFAULT true,
  version integer DEFAULT 1,
  last_edited_by varchar(255),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. 매출 기록 테이블
CREATE TABLE IF NOT EXISTS sales_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  revenue decimal(12,2) DEFAULT 0,
  membership_sales decimal(12,2) DEFAULT 0,
  pt_sales decimal(12,2) DEFAULT 0,
  supply_sales decimal(12,2) DEFAULT 0,
  vending_sales decimal(12,2) DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. 알림 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type varchar(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
  title varchar(255) NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  link varchar(500),
  related_id uuid,
  related_type varchar(50),
  created_at timestamp with time zone DEFAULT now()
);

-- 🔗 외래 키 제약 조건 추가
-- tasks 테이블
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- daily_reports 테이블  
ALTER TABLE daily_reports
  ADD CONSTRAINT fk_daily_reports_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- announcements 테이블
ALTER TABLE announcements
  ADD CONSTRAINT fk_announcements_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- manuals 테이블
ALTER TABLE manuals
  ADD CONSTRAINT fk_manuals_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- sales_entries 테이블
ALTER TABLE sales_entries
  ADD CONSTRAINT fk_sales_entries_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- notifications 테이블
ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 📊 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_author_id ON daily_reports(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_manuals_category ON manuals(category);
CREATE INDEX IF NOT EXISTS idx_manuals_is_published ON manuals(is_published);
CREATE INDEX IF NOT EXISTS idx_sales_entries_date ON sales_entries(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- 🔧 Updated_at 트리거 함수 생성 (이미 있으면 재생성)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 추가
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_daily_reports_updated_at BEFORE UPDATE ON daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manuals_updated_at BEFORE UPDATE ON manuals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_entries_updated_at BEFORE UPDATE ON sales_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 👤 기본 관리자 계정 생성
INSERT INTO users (id, name, email, password, role, status, phone) 
VALUES (
  'admin-spodot-01',
  '관리자',
  'spodot@naver.com',
  '123456',
  'admin',
  'active',
  '010-0000-0000'
) ON CONFLICT (email) DO NOTHING;

-- ✅ 완료 메시지
SELECT 'Spodot 피트니스 관리 시스템 기본 테이블 생성이 완료되었습니다!' as result; 