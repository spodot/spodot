-- 🔧 Spodot 데이터베이스 스키마 수정 마이그레이션
-- 누락된 컬럼들을 안전하게 추가합니다

-- 1. tasks 테이블에 누락된 컬럼들 추가
DO $$ 
BEGIN
    -- priority 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
        ALTER TABLE tasks ADD COLUMN priority varchar(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
        RAISE NOTICE 'Added priority column to tasks table';
    END IF;

    -- category 컬럼 추가  
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'category') THEN
        ALTER TABLE tasks ADD COLUMN category varchar(50) DEFAULT 'general' CHECK (category IN ('maintenance', 'administrative', 'client', 'training', 'general'));
        RAISE NOTICE 'Added category column to tasks table';
    END IF;

    -- due_date 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'due_date') THEN
        ALTER TABLE tasks ADD COLUMN due_date date;
        RAISE NOTICE 'Added due_date column to tasks table';
    END IF;

    -- start_time 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'start_time') THEN
        ALTER TABLE tasks ADD COLUMN start_time time;
        RAISE NOTICE 'Added start_time column to tasks table';
    END IF;

    -- end_time 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'end_time') THEN
        ALTER TABLE tasks ADD COLUMN end_time time;
        RAISE NOTICE 'Added end_time column to tasks table';
    END IF;

    -- tags 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'tags') THEN
        ALTER TABLE tasks ADD COLUMN tags jsonb DEFAULT '[]';
        RAISE NOTICE 'Added tags column to tasks table';
    END IF;
END $$;

-- 2. 누락된 테이블들 생성 (이미 존재하지 않는 경우만)

-- task_comments 테이블
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- daily_reports 테이블
CREATE TABLE IF NOT EXISTS daily_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id uuid,
  author_name varchar(255) NOT NULL,
  date date NOT NULL,
  content text,
  tasks jsonb,
  issues text,
  tomorrow text,
  images jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- announcements 테이블  
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

-- schedules 테이블
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

-- suggestions 테이블
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

-- 3. 외래 키 제약조건 추가 (테이블이 존재하는 경우에만)
DO $$ 
BEGIN
    -- task_comments 외래 키
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'task_comments') THEN
        -- task_id 외래 키 (중복 방지)
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_task_comments_task_id') THEN
            ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_task_id 
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint for task_comments.task_id';
        END IF;
        
        -- author_id 외래 키 (중복 방지)
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_task_comments_author_id') THEN
            ALTER TABLE task_comments ADD CONSTRAINT fk_task_comments_author_id 
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint for task_comments.author_id';
        END IF;
    END IF;

    -- daily_reports 외래 키
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'daily_reports') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_daily_reports_author_id') THEN
            ALTER TABLE daily_reports ADD CONSTRAINT fk_daily_reports_author_id 
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint for daily_reports.author_id';
        END IF;
    END IF;

    -- announcements 외래 키
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'announcements') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_announcements_author_id') THEN
            ALTER TABLE announcements ADD CONSTRAINT fk_announcements_author_id 
            FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint for announcements.author_id';
        END IF;
    END IF;

    -- schedules 외래 키
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'schedules') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_schedules_trainer_id') THEN
            ALTER TABLE schedules ADD CONSTRAINT fk_schedules_trainer_id 
            FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added foreign key constraint for schedules.trainer_id';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_schedules_client_id') THEN
            ALTER TABLE schedules ADD CONSTRAINT fk_schedules_client_id 
            FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL;
            RAISE NOTICE 'Added foreign key constraint for schedules.client_id';
        END IF;
    END IF;
END $$;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);  
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(date);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_trainer_id ON schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);

-- 5. 트리거 함수 생성 (안전하게)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. 트리거 추가 (안전하게)
DO $$ 
BEGIN
    -- tasks 테이블 트리거
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_tasks_updated_at') THEN
        CREATE TRIGGER update_tasks_updated_at 
            BEFORE UPDATE ON tasks 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update trigger for tasks table';
    END IF;

    -- daily_reports 테이블 트리거
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_daily_reports_updated_at') THEN
        CREATE TRIGGER update_daily_reports_updated_at 
            BEFORE UPDATE ON daily_reports 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update trigger for daily_reports table';
    END IF;

    -- announcements 테이블 트리거
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_announcements_updated_at') THEN
        CREATE TRIGGER update_announcements_updated_at 
            BEFORE UPDATE ON announcements 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update trigger for announcements table';
    END IF;

    -- schedules 테이블 트리거
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_schedules_updated_at') THEN
        CREATE TRIGGER update_schedules_updated_at 
            BEFORE UPDATE ON schedules 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update trigger for schedules table';
    END IF;

    -- suggestions 테이블 트리거
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_suggestions_updated_at') THEN
        CREATE TRIGGER update_suggestions_updated_at 
            BEFORE UPDATE ON suggestions 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        RAISE NOTICE 'Added update trigger for suggestions table';
    END IF;
END $$;

-- 7. 완료 메시지
DO $$ 
BEGIN
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ 데이터베이스 스키마 수정이 완료되었습니다!';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📋 추가된 내용:';
    RAISE NOTICE '  - tasks 테이블: priority, category, due_date, start_time, end_time, tags 컬럼';
    RAISE NOTICE '  - 누락된 테이블들: task_comments, daily_reports, announcements, schedules, suggestions';
    RAISE NOTICE '  - 외래 키 제약조건 및 인덱스';
    RAISE NOTICE '  - 자동 updated_at 트리거';
    RAISE NOTICE '==========================================';
END $$; 