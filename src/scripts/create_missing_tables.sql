-- 🏗️ Spodot 피트니스 관리 시스템 필수 테이블 생성 스크립트
-- 현재 추가된 기능들을 위한 테이블들을 생성합니다.

-- 1. 업무 댓글 테이블
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 2. 일정 관리 테이블
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

-- 3. 보고서 테이블
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

-- 4. 보고서 템플릿 테이블
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

-- 5. 보고서 댓글 테이블
CREATE TABLE IF NOT EXISTS report_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_by_name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. OT 회원 관리 테이블
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

-- 7. OT 진행 상황 테이블
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

-- 8. OT 세션 테이블
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

-- 9. 인계사항 테이블
CREATE TABLE IF NOT EXISTS handovers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  date date NOT NULL,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 10. 자판기 관리 테이블
CREATE TABLE IF NOT EXISTS vending_machines (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  location varchar(255) NOT NULL,
  status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 11. 자판기 상품 테이블
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

-- 12. 자판기 재고 테이블
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

-- 13. 자판기 판매 기록 테이블
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

-- 14. 자판기 거래 내역 테이블
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

-- 15. 건의사항 테이블
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

-- 🔗 외래 키 제약 조건 추가
-- task_comments 테이블
ALTER TABLE task_comments
  ADD CONSTRAINT fk_task_comments_task_id 
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE task_comments
  ADD CONSTRAINT fk_task_comments_author_id 
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;

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

-- 📊 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
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

-- 🔧 Updated_at 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 추가
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

-- ✅ 완료 메시지
SELECT 'Spodot 피트니스 관리 시스템 테이블 생성이 완료되었습니다!' as result; 