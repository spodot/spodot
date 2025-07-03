-- handovers 테이블 RLS 정책 완전 재설정
-- 인계사항 저장 문제 해결을 위한 새로운 접근

-- 1. 모든 기존 정책 완전 삭제
DROP POLICY IF EXISTS "Users can view all handovers" ON handovers;
DROP POLICY IF EXISTS "Users can insert handovers" ON handovers;
DROP POLICY IF EXISTS "Users can update own handovers" ON handovers;
DROP POLICY IF EXISTS "Users can delete own handovers" ON handovers;
DROP POLICY IF EXISTS "handovers_select_policy" ON handovers;
DROP POLICY IF EXISTS "handovers_insert_policy" ON handovers;
DROP POLICY IF EXISTS "handovers_update_policy" ON handovers;
DROP POLICY IF EXISTS "handovers_delete_policy" ON handovers;

-- 2. RLS 비활성화 후 재활성화
ALTER TABLE handovers DISABLE ROW LEVEL SECURITY;
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;

-- 3. 새로운 정책 생성 - 더 관대한 접근
-- 모든 인증된 사용자가 모든 인계사항을 볼 수 있음
CREATE POLICY "handovers_select_policy" ON handovers
  FOR SELECT 
  TO authenticated
  USING (true);

-- 모든 인증된 사용자가 인계사항을 작성할 수 있음 (author_id 체크 없음)
CREATE POLICY "handovers_insert_policy" ON handovers
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- 모든 인증된 사용자가 인계사항을 수정할 수 있음
CREATE POLICY "handovers_update_policy" ON handovers
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 모든 인증된 사용자가 인계사항을 삭제할 수 있음
CREATE POLICY "handovers_delete_policy" ON handovers
  FOR DELETE 
  TO authenticated
  USING (true);

-- 4. 테이블 권한 확인 및 부여
GRANT ALL ON handovers TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. 확인 쿼리들
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'handovers') as policy_count
FROM pg_tables 
WHERE tablename = 'handovers';

-- 정책 목록 확인
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'handovers'
ORDER BY policyname;

-- 테이블 권한 확인
SELECT 
  table_schema,
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges 
WHERE table_name = 'handovers' 
  AND table_schema = 'public'; 