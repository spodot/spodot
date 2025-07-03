-- handovers 테이블 RLS 정책 수정 스크립트
-- 금일 인계사항 작성이 안되는 문제 해결

-- 1. handovers 테이블에 RLS 활성화
ALTER TABLE handovers ENABLE ROW LEVEL SECURITY;

-- 2. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view all handovers" ON handovers;
DROP POLICY IF EXISTS "Users can insert handovers" ON handovers;
DROP POLICY IF EXISTS "Users can update own handovers" ON handovers;
DROP POLICY IF EXISTS "Users can delete own handovers" ON handovers;

-- 3. 새로운 RLS 정책 생성

-- 모든 인증된 사용자는 인계사항을 볼 수 있음
CREATE POLICY "Users can view all handovers" ON handovers
  FOR SELECT 
  TO authenticated
  USING (true);

-- 모든 인증된 사용자는 인계사항을 작성할 수 있음
CREATE POLICY "Users can insert handovers" ON handovers
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- 사용자는 자신이 작성한 인계사항만 수정할 수 있음
CREATE POLICY "Users can update own handovers" ON handovers
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = author_id::uuid);

-- 사용자는 자신이 작성한 인계사항만 삭제할 수 있음
CREATE POLICY "Users can delete own handovers" ON handovers
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = author_id::uuid);

-- 4. 확인 쿼리
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'handovers') as policy_count
FROM pg_tables 
WHERE tablename = 'handovers';

-- 5. 정책 목록 확인
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'handovers'; 