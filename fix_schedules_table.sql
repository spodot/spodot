-- 🔧 Schedules 테이블 생성 스크립트
-- 프로젝트 ID: piwftspnolcvpytaqaeq

-- 트리거 함수 생성 (이미 있다면 OR REPLACE로 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 일정 관리 테이블 생성
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

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_schedules_trainer_id ON schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_type ON schedules(type);

-- 업데이트 트리거 추가 (기존 것이 있다면 삭제 후 재생성)
DROP TRIGGER IF EXISTS update_schedules_updated_at ON schedules;
CREATE TRIGGER update_schedules_updated_at 
  BEFORE UPDATE ON schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 추가 (개발용)
INSERT INTO schedules (client_name, trainer_id, trainer_name, type, date, start_time, end_time, notes) 
VALUES 
  ('김회원', 'admin-spodot-01', '김트레이너', 'PT', CURRENT_DATE, '09:00', '10:00', 'PT 세션'),
  ('이회원', 'admin-spodot-01', '이트레이너', 'OT', CURRENT_DATE + INTERVAL '1 day', '14:00', '15:00', 'OT 세션'),
  ('박회원', 'admin-spodot-01', '박트레이너', 'GROUP', CURRENT_DATE + INTERVAL '2 days', '19:00', '20:00', 'GROUP 세션')
ON CONFLICT DO NOTHING;

SELECT 'schedules 테이블이 성공적으로 생성되었습니다!' as message; 