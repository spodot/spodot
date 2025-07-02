-- 🚀 Spodot 모든 누락 테이블 생성 스크립트
-- 프로젝트 ID: piwftspnolcvpytaqaeq

-- ===== 트리거 함수 생성 =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===== 1. SCHEDULES 테이블 =====
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

-- ===== 2. REPORTS 테이블 =====
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

-- ===== 3. REPORT_TEMPLATES 테이블 =====
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

-- ===== 4. REPORT_COMMENTS 테이블 =====
CREATE TABLE IF NOT EXISTS report_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id uuid NOT NULL,
  content text NOT NULL,
  created_by uuid NOT NULL,
  created_by_name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ===== 5. OT_MEMBERS 테이블 =====
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

-- ===== 6. OT_PROGRESS 테이블 =====
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

-- ===== 7. OT_SESSIONS 테이블 =====
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

-- ===== 8. HANDOVERS 테이블 =====
CREATE TABLE IF NOT EXISTS handovers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  date date NOT NULL,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- ===== 9. SUGGESTIONS 테이블 =====
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

-- ===== 인덱스 생성 =====
CREATE INDEX IF NOT EXISTS idx_schedules_trainer_id ON schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_report_comments_report_id ON report_comments(report_id);
CREATE INDEX IF NOT EXISTS idx_ot_progress_member_id ON ot_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_ot_sessions_progress_id ON ot_sessions(progress_id);
CREATE INDEX IF NOT EXISTS idx_handovers_date ON handovers(date);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);

-- ===== 트리거 생성 =====
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_report_templates_updated_at ON report_templates;
CREATE TRIGGER update_report_templates_updated_at BEFORE UPDATE ON report_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ot_members_updated_at ON ot_members;
CREATE TRIGGER update_ot_members_updated_at BEFORE UPDATE ON ot_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ot_progress_updated_at ON ot_progress;
CREATE TRIGGER update_ot_progress_updated_at BEFORE UPDATE ON ot_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ot_sessions_updated_at ON ot_sessions;
CREATE TRIGGER update_ot_sessions_updated_at BEFORE UPDATE ON ot_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_handovers_updated_at ON handovers;
CREATE TRIGGER update_handovers_updated_at BEFORE UPDATE ON handovers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suggestions_updated_at ON suggestions;
CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== 외래 키 제약 조건 =====
-- reports 테이블
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_reports_created_by') THEN
    ALTER TABLE reports ADD CONSTRAINT fk_reports_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_report_comments_report_id') THEN
    ALTER TABLE report_comments ADD CONSTRAINT fk_report_comments_report_id FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_progress_member_id') THEN
    ALTER TABLE ot_progress ADD CONSTRAINT fk_ot_progress_member_id FOREIGN KEY (member_id) REFERENCES ot_members(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_ot_sessions_progress_id') THEN
    ALTER TABLE ot_sessions ADD CONSTRAINT fk_ot_sessions_progress_id FOREIGN KEY (progress_id) REFERENCES ot_progress(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ===== 완료 메시지 =====
SELECT 'Spodot 필수 테이블들이 성공적으로 생성되었습니다!' as result,
       '총 9개 테이블과 8개 트리거가 추가되었습니다.' as detail; 