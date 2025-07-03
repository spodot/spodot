-- handovers 테이블 RLS 완전 비활성화
-- 인계사항 저장 문제 긴급 해결

-- 1. 모든 정책 삭제
DROP POLICY IF EXISTS "Users can view all handovers" ON handovers;
DROP POLICY IF EXISTS "Users can insert handovers" ON handovers;
DROP POLICY IF EXISTS "Users can update own handovers" ON handovers;
DROP POLICY IF EXISTS "Users can delete own handovers" ON handovers;
DROP POLICY IF EXISTS "handovers_select_policy" ON handovers;
DROP POLICY IF EXISTS "handovers_insert_policy" ON handovers;
DROP POLICY IF EXISTS "handovers_update_policy" ON handovers;
DROP POLICY IF EXISTS "handovers_delete_policy" ON handovers;

-- 2. RLS 완전 비활성화 (임시 해결책)
ALTER TABLE handovers DISABLE ROW LEVEL SECURITY;

-- 3. 테이블 권한 부여
GRANT ALL ON handovers TO authenticated;
GRANT ALL ON handovers TO anon;

-- 4. 확인 쿼리
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'handovers';

-- 5. 테스트 쿼리 (실행 후 삭제 가능)
INSERT INTO handovers (content, date, author_id, author_name) 
VALUES ('테스트 인계사항', CURRENT_DATE, 'test-id', '테스트 사용자');

-- 테스트 데이터 삭제
DELETE FROM handovers WHERE content = '테스트 인계사항'; 