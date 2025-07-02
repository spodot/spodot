-- 테스트용 더미 데이터 입력

-- 회원 테이블 (members)이 아직 없을 경우 생성
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  birth_date DATE,
  gender VARCHAR(10),
  address TEXT,
  emergency_contact VARCHAR(20),
  join_date DATE NOT NULL,
  membership_type VARCHAR(50) NOT NULL,
  membership_start DATE,
  membership_end DATE,
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'pending', 'expired')),
  trainer_id UUID,
  notes TEXT,
  profile_image VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. 회원 더미 데이터
INSERT INTO members (first_name, last_name, email, phone, birth_date, gender, join_date, membership_type, membership_start, membership_end, status)
VALUES
  ('김', '철수', 'kim@example.com', '010-1234-5678', '1990-05-15', 'male', '2023-01-15', '1년 정기권', '2023-01-15', '2024-01-14', 'active'),
  ('이', '영희', 'lee@example.com', '010-2345-6789', '1988-11-20', 'female', '2023-02-10', '6개월 정기권', '2023-02-10', '2023-08-09', 'active'),
  ('박', '민수', 'park@example.com', '010-3456-7890', '1995-03-25', 'male', '2023-03-01', '3개월 정기권', '2023-03-01', '2023-05-31', 'active'),
  ('정', '지영', 'jung@example.com', '010-4567-8901', '1992-07-08', 'female', '2023-01-20', '1년 정기권', '2023-01-20', '2024-01-19', 'active'),
  ('최', '현우', 'choi@example.com', '010-5678-9012', '1993-09-12', 'male', '2023-02-15', '6개월 정기권', '2023-02-15', '2023-08-14', 'inactive');

-- 2. 수업 유형 더미 데이터
INSERT INTO class_types (name, description, duration, capacity, difficulty, category, color, is_active)
VALUES
  ('요가 기초', '초보자를 위한 기초 요가 클래스', 60, 15, 'beginner', '요가', '#4CAF50', TRUE),
  ('스피닝', '고강도 스피닝 사이클링 운동', 45, 20, 'intermediate', '유산소', '#F44336', TRUE),
  ('필라테스', '코어 강화와 유연성 향상을 위한 필라테스', 60, 10, 'all-levels', '필라테스', '#2196F3', TRUE),
  ('근력 운동', '전신 근력 강화 운동', 50, 12, 'advanced', '근력 운동', '#FF9800', TRUE),
  ('줌바', '라틴 댄스 기반의 유산소 운동', 60, 25, 'all-levels', '댄스', '#9C27B0', TRUE);

-- 3. 트레이너 더미 데이터
INSERT INTO trainers (first_name, last_name, email, phone, specialization, bio, status)
VALUES
  ('박', '트레이너', 'trainer1@example.com', '010-1111-2222', ARRAY['요가', '필라테스'], '10년 경력의 요가, 필라테스 전문 트레이너입니다.', 'active'),
  ('김', '코치', 'trainer2@example.com', '010-2222-3333', ARRAY['근력 운동', '스피닝'], '체육학 전공 스포츠 트레이너입니다.', 'active'),
  ('이', '강사', 'trainer3@example.com', '010-3333-4444', ARRAY['줌바', '유산소'], '댄스 전문 트레이너입니다.', 'active');

-- 4. 룸/시설 더미 데이터
INSERT INTO rooms (name, capacity, description, equipment, is_active)
VALUES
  ('요가실', 20, '요가와 필라테스를 위한 공간', ARRAY['요가 매트', '필라테스 기구'], TRUE),
  ('스피닝실', 25, '스피닝 수업을 위한 공간', ARRAY['스피닝 자전거', '음향 시스템'], TRUE),
  ('다목적실 A', 15, '다양한 수업을 위한 공간', ARRAY['덤벨', '바벨', '케틀벨', '짐볼'], TRUE),
  ('다목적실 B', 30, '대규모 그룹 수업을 위한 공간', ARRAY['스텝 박스', '탄력 밴드'], TRUE);

-- 5. 수업 일정 더미 데이터
INSERT INTO class_schedules (class_type_id, trainer_id, room_id, date, start_time, end_time, capacity, enrolled_count, status, notes)
VALUES
  ((SELECT id FROM class_types WHERE name = '요가 기초'), (SELECT id FROM trainers WHERE last_name = '트레이너'), (SELECT id FROM rooms WHERE name = '요가실'), CURRENT_DATE + 1, '10:00', '11:00', 15, 5, 'scheduled', '초보자를 위한 수업입니다.'),
  ((SELECT id FROM class_types WHERE name = '스피닝'), (SELECT id FROM trainers WHERE last_name = '코치'), (SELECT id FROM rooms WHERE name = '스피닝실'), CURRENT_DATE + 1, '14:00', '14:45', 20, 10, 'scheduled', '고강도 운동을 원하시는 분들께 추천합니다.'),
  ((SELECT id FROM class_types WHERE name = '필라테스'), (SELECT id FROM trainers WHERE last_name = '트레이너'), (SELECT id FROM rooms WHERE name = '요가실'), CURRENT_DATE + 2, '11:00', '12:00', 10, 6, 'scheduled', '코어 강화에 집중하는 수업입니다.'),
  ((SELECT id FROM class_types WHERE name = '근력 운동'), (SELECT id FROM trainers WHERE last_name = '코치'), (SELECT id FROM rooms WHERE name = '다목적실 A'), CURRENT_DATE + 2, '16:00', '16:50', 12, 8, 'scheduled', '전신 근력 운동입니다.'),
  ((SELECT id FROM class_types WHERE name = '줌바'), (SELECT id FROM trainers WHERE last_name = '강사'), (SELECT id FROM rooms WHERE name = '다목적실 B'), CURRENT_DATE + 3, '18:00', '19:00', 25, 15, 'scheduled', '신나는 음악과 함께하는 줌바 댄스입니다.');

-- 6. 수업 등록 더미 데이터
INSERT INTO class_enrollments (class_schedule_id, member_id, status, enrollment_date, notes)
VALUES
  ((SELECT id FROM class_schedules WHERE date = CURRENT_DATE + 1 AND start_time = '10:00'), (SELECT id FROM members WHERE last_name = '철수'), 'enrolled', CURRENT_TIMESTAMP - INTERVAL '2 days', '첫 요가 수업입니다.'),
  ((SELECT id FROM class_schedules WHERE date = CURRENT_DATE + 1 AND start_time = '10:00'), (SELECT id FROM members WHERE last_name = '영희'), 'enrolled', CURRENT_TIMESTAMP - INTERVAL '1 day', NULL),
  ((SELECT id FROM class_schedules WHERE date = CURRENT_DATE + 1 AND start_time = '14:00'), (SELECT id FROM members WHERE last_name = '민수'), 'enrolled', CURRENT_TIMESTAMP - INTERVAL '3 days', '스피닝 처음 도전합니다.');

-- Supabase Realtime 활성화 (테이블에 대한 publication 생성)
DROP PUBLICATION IF EXISTS supabase_realtime;

CREATE PUBLICATION supabase_realtime FOR TABLE
  members,
  class_types,
  trainers,
  rooms,
  class_schedules,
  class_enrollments;

-- 기존 supabase_realtime publication이 있는 경우, 테이블 추가
-- ALTER PUBLICATION supabase_realtime ADD TABLE members, class_types, trainers, rooms, class_schedules, class_enrollments; 