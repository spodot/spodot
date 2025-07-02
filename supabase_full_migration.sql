-- 🏗️ Spodot 피트니스 관리 시스템 완전 마이그레이션
-- 모든 테이블을 한 번에 생성하는 통합 스크립트

-- ===== 기본 테이블 생성 =====

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

-- 3. 업무 댓글 테이블
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. 일일 보고서 테이블
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

-- 5. 공지사항 테이블
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

-- 6. 매뉴얼 테이블
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

-- 7. 매출 기록 테이블
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

-- 8. 알림 테이블
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

-- ===== 확장 테이블 생성 =====

-- 9. 일정 관리 테이블
CREATE TABLE IF NOT EXISTS schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name varchar(255) NOT NULL,
  client_id uuid,
  trainer_id uuid NOT NULL,
  trainer_name varchar(255) NOT NULL,
  type varchar(50) CHECK (type IN ('PT', 'OT', 'GROUP', 'CONSULT')) NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  notes text,
  recurrence varchar(20) DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  recurrence_end_date date,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 10. 보고서 테이블
CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  type varchar(50) CHECK (type IN ('daily', 'weekly', 'monthly', 'performance', 'incident', 'custom')) NOT NULL,
  category varchar(50) CHECK (category IN ('trainer', 'facility', 'client', 'financial', 'operational')) NOT NULL,
  status varchar(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'reviewed', 'approved', 'rejected')),
  created_by uuid NOT NULL,
  created_by_name varchar(255) NOT NULL,
  assigned_to uuid,
  assigned_to_name varchar(255),
  submitted_at timestamp with time zone,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  reviewed_by_name varchar(255),
  metrics jsonb,
  period_start date,
  period_end date,
  tags jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 11. 보고서 템플릿 테이블
CREATE TABLE IF NOT EXISTS report_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  description text NOT NULL,
  type varchar(50) CHECK (type IN ('daily', 'weekly', 'monthly', 'performance', 'incident', 'custom')) NOT NULL,
  category varchar(50) CHECK (category IN ('trainer', 'facility', 'client', 'financial', 'operational')) NOT NULL,
  structure jsonb NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 12. 보고서 댓글 테이블
CREATE TABLE IF NOT EXISTS report_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_by_name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 13. OT 회원 관리 테이블
CREATE TABLE IF NOT EXISTS ot_members (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  phone varchar(20) NOT NULL,
  email varchar(255),
  registered_at timestamp with time zone DEFAULT now(),
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'completed')),
  preferred_days jsonb,
  preferred_times jsonb,
  notes text,
  ot_count integer DEFAULT 0,
  total_sessions integer DEFAULT 0,
  assigned_staff_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 14. OT 진행 상황 테이블
CREATE TABLE IF NOT EXISTS ot_progress (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id integer NOT NULL,
  staff_id integer NOT NULL,
  total_sessions integer NOT NULL,
  completed_sessions integer DEFAULT 0,
  contact_made boolean DEFAULT false,
  contact_date date,
  contact_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 15. OT 세션 테이블
CREATE TABLE IF NOT EXISTS ot_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  progress_id uuid NOT NULL,
  date date NOT NULL,
  time time NOT NULL,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 16. 인계사항 테이블
CREATE TABLE IF NOT EXISTS handovers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  date date NOT NULL,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 17. 자판기 관리 테이블
CREATE TABLE IF NOT EXISTS vending_machines (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  location varchar(255) NOT NULL,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 18. 자판기 상품 테이블
CREATE TABLE IF NOT EXISTS vending_products (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  price decimal(10,2) NOT NULL,
  cost decimal(10,2) NOT NULL,
  category varchar(100) NOT NULL,
  barcode varchar(100),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 19. 자판기 재고 테이블
CREATE TABLE IF NOT EXISTS vending_inventory (
  id serial PRIMARY KEY,
  vending_id integer NOT NULL,
  product_id integer NOT NULL,
  current_stock integer NOT NULL DEFAULT 0,
  max_capacity integer NOT NULL,
  min_threshold integer NOT NULL DEFAULT 5,
  last_restocked timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 20. 자판기 판매 기록 테이블
CREATE TABLE IF NOT EXISTS vending_sales (
  id serial PRIMARY KEY,
  vending_id integer NOT NULL,
  product_id integer NOT NULL,
  quantity integer NOT NULL,
  total_amount decimal(10,2) NOT NULL,
  payment_method varchar(20) CHECK (payment_method IN ('cash', 'card')) NOT NULL,
  timestamp timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- 21. 자판기 거래 내역 테이블
CREATE TABLE IF NOT EXISTS vending_transactions (
  id serial PRIMARY KEY,
  vending_id integer NOT NULL,
  type varchar(20) CHECK (type IN ('입금', '출금', '매출', '보충')) NOT NULL,
  amount decimal(10,2) NOT NULL,
  date date NOT NULL,
  note text NOT NULL,
  vending_name varchar(255),
  product_name varchar(255),
  quantity integer,
  created_at timestamp with time zone DEFAULT now()
);

-- 22. 건의사항 테이블
CREATE TABLE IF NOT EXISTS suggestions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title varchar(255) NOT NULL,
  content text NOT NULL,
  category varchar(50) DEFAULT 'other' CHECK (category IN ('facility', 'service', 'program', 'other')),
  author_id uuid,
  author_name varchar(255) NOT NULL,
  status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'implemented')),
  priority varchar(10) DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  admin_response text,
  admin_response_by varchar(255),
  admin_response_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ===== 외래 키 제약 조건 추가 =====

-- tasks 테이블
ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- task_comments 테이블
ALTER TABLE task_comments
  ADD CONSTRAINT fk_task_comments_task_id 
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE task_comments
  ADD CONSTRAINT fk_task_comments_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

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

-- schedules 테이블
ALTER TABLE schedules
  ADD CONSTRAINT fk_schedules_trainer_id 
  FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE schedules
  ADD CONSTRAINT fk_schedules_client_id 
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL;

-- reports 테이블
ALTER TABLE reports
  ADD CONSTRAINT fk_reports_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE reports
  ADD CONSTRAINT fk_reports_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE reports
  ADD CONSTRAINT fk_reports_reviewed_by 
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- report_templates 테이블
ALTER TABLE report_templates
  ADD CONSTRAINT fk_report_templates_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- report_comments 테이블
ALTER TABLE report_comments
  ADD CONSTRAINT fk_report_comments_report_id 
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

ALTER TABLE report_comments
  ADD CONSTRAINT fk_report_comments_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

-- ot_members 테이블
ALTER TABLE ot_members
  ADD CONSTRAINT fk_ot_members_assigned_staff_id 
  FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL;

-- ot_progress 테이블
ALTER TABLE ot_progress
  ADD CONSTRAINT fk_ot_progress_member_id 
  FOREIGN KEY (member_id) REFERENCES ot_members(id) ON DELETE CASCADE;

-- ot_sessions 테이블
ALTER TABLE ot_sessions
  ADD CONSTRAINT fk_ot_sessions_progress_id 
  FOREIGN KEY (progress_id) REFERENCES ot_progress(id) ON DELETE CASCADE;

-- handovers 테이블
ALTER TABLE handovers
  ADD CONSTRAINT fk_handovers_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- vending_inventory 테이블
ALTER TABLE vending_inventory
  ADD CONSTRAINT fk_vending_inventory_vending_id 
  FOREIGN KEY (vending_id) REFERENCES vending_machines(id) ON DELETE CASCADE;

ALTER TABLE vending_inventory
  ADD CONSTRAINT fk_vending_inventory_product_id 
  FOREIGN KEY (product_id) REFERENCES vending_products(id) ON DELETE CASCADE;

-- vending_sales 테이블
ALTER TABLE vending_sales
  ADD CONSTRAINT fk_vending_sales_vending_id 
  FOREIGN KEY (vending_id) REFERENCES vending_machines(id) ON DELETE CASCADE;

ALTER TABLE vending_sales
  ADD CONSTRAINT fk_vending_sales_product_id 
  FOREIGN KEY (product_id) REFERENCES vending_products(id) ON DELETE CASCADE;

-- vending_transactions 테이블
ALTER TABLE vending_transactions
  ADD CONSTRAINT fk_vending_transactions_vending_id 
  FOREIGN KEY (vending_id) REFERENCES vending_machines(id) ON DELETE CASCADE;

-- suggestions 테이블
ALTER TABLE suggestions
  ADD CONSTRAINT fk_suggestions_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

-- ===== 성능 최적화 인덱스 추가 =====

-- 기본 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
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

-- 확장 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_trainer_id ON schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_ot_progress_member_id ON ot_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_ot_sessions_progress_id ON ot_sessions(progress_id);
CREATE INDEX IF NOT EXISTS idx_handovers_date ON handovers(date);
CREATE INDEX IF NOT EXISTS idx_handovers_author_id ON handovers(author_id);
CREATE INDEX IF NOT EXISTS idx_vending_inventory_vending_id ON vending_inventory(vending_id);
CREATE INDEX IF NOT EXISTS idx_vending_sales_timestamp ON vending_sales(timestamp);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);

-- ===== Updated_at 트리거 함수 및 트리거 생성 =====

-- 트리거 함수 생성
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
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ot_members_updated_at BEFORE UPDATE ON ot_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ot_progress_updated_at BEFORE UPDATE ON ot_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ot_sessions_updated_at BEFORE UPDATE ON ot_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_handovers_updated_at BEFORE UPDATE ON handovers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vending_machines_updated_at BEFORE UPDATE ON vending_machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vending_products_updated_at BEFORE UPDATE ON vending_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vending_inventory_updated_at BEFORE UPDATE ON vending_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 기본 관리자 계정 생성 =====

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

-- ===== 완료 메시지 =====
SELECT 'Spodot 피트니스 관리 시스템 전체 마이그레이션이 완료되었습니다!' as result,
       '총 22개 테이블이 생성되었습니다.' as detail; 