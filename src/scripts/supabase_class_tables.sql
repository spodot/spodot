-- 수업 유형 테이블
CREATE TABLE IF NOT EXISTS class_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  duration INTEGER NOT NULL, -- 수업 진행 시간(분)
  capacity INTEGER NOT NULL, -- 최대 수용 인원
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced', 'all-levels')),
  category VARCHAR(50), -- 수업 카테고리 (예: 요가, 필라테스, 근력 운동 등)
  color VARCHAR(20) NOT NULL, -- 화면에 표시될 색상 코드
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 트레이너 테이블
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  specialization TEXT[], -- 전문 분야 (배열)
  bio TEXT,
  certification TEXT[], -- 자격증 정보 (배열)
  working_hours JSONB, -- 근무 시간 정보 (JSON 객체)
  status VARCHAR(20) CHECK (status IN ('active', 'inactive')),
  profile_image VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수업실/시설 테이블
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  capacity INTEGER NOT NULL, -- 최대 수용 인원
  description TEXT,
  equipment TEXT[], -- 구비된 장비 (배열)
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수업 일정 테이블
CREATE TABLE IF NOT EXISTS class_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_type_id UUID REFERENCES class_types(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL, -- 해당 수업의 수용 인원
  enrolled_count INTEGER DEFAULT 0, -- 현재 등록된 인원 수
  status VARCHAR(20) CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 수업 등록 테이블
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_schedule_id UUID REFERENCES class_schedules(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('enrolled', 'attended', 'no-show', 'cancelled')),
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  payment_id UUID, -- 결제 정보 (향후 결제 테이블 생성 시 외래 키로 연결)
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 실시간 기능 활성화
ALTER TABLE class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;

-- 기본 RLS 정책 (관리자만 접근 가능하도록)
CREATE POLICY "관리자 모든 권한" ON class_types FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "관리자 모든 권한" ON trainers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "관리자 모든 권한" ON rooms FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "관리자 모든 권한" ON class_schedules FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "관리자 모든 권한" ON class_enrollments FOR ALL USING (auth.role() = 'authenticated');

-- 회원은 읽기만 허용
CREATE POLICY "회원 읽기 전용" ON class_types FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "회원 읽기 전용" ON trainers FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "회원 읽기 전용" ON rooms FOR SELECT USING (auth.role() = 'anon');
CREATE POLICY "회원 읽기 전용" ON class_schedules FOR SELECT USING (auth.role() = 'anon');

-- 수업 일정 실시간 변경 트리거 함수
CREATE OR REPLACE FUNCTION update_enrolled_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'enrolled' THEN
    UPDATE class_schedules
    SET enrolled_count = enrolled_count + 1
    WHERE id = NEW.class_schedule_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'enrolled' THEN
    UPDATE class_schedules
    SET enrolled_count = GREATEST(enrolled_count - 1, 0)
    WHERE id = OLD.class_schedule_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'enrolled' AND NEW.status != 'enrolled' THEN
      UPDATE class_schedules
      SET enrolled_count = GREATEST(enrolled_count - 1, 0)
      WHERE id = NEW.class_schedule_id;
    ELSIF OLD.status != 'enrolled' AND NEW.status = 'enrolled' THEN
      UPDATE class_schedules
      SET enrolled_count = enrolled_count + 1
      WHERE id = NEW.class_schedule_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER update_class_enrolled_count
AFTER INSERT OR UPDATE OR DELETE ON class_enrollments
FOR EACH ROW EXECUTE PROCEDURE update_enrolled_count(); 