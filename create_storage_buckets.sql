-- 🗂️ Supabase Storage 버킷 생성 스크립트
-- 파일 첨부 시스템을 위한 Storage 버킷들을 생성합니다

-- 이미지 파일용 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'images',
    'images',
    true,
    10485760, -- 10MB
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  );

-- 문서 파일용 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'documents',
    'documents',
    true,
    10485760, -- 10MB
    ARRAY['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  );

-- 비디오 파일용 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'videos',
    'videos',
    true,
    52428800, -- 50MB
    ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv']
  );

-- 일반 파일용 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'files',
    'files',
    true,
    10485760, -- 10MB
    NULL -- 모든 파일 타입 허용
  );

-- 🔐 Storage 정책 설정

-- 이미지 버킷 정책
CREATE POLICY "Allow authenticated uploads to images bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Allow public downloads from images bucket" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'images');

CREATE POLICY "Allow authenticated deletes from images bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 문서 버킷 정책
CREATE POLICY "Allow authenticated uploads to documents bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Allow public downloads from documents bucket" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'documents');

CREATE POLICY "Allow authenticated deletes from documents bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 비디오 버킷 정책
CREATE POLICY "Allow authenticated uploads to videos bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'videos');

CREATE POLICY "Allow public downloads from videos bucket" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'videos');

CREATE POLICY "Allow authenticated deletes from videos bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 일반 파일 버킷 정책
CREATE POLICY "Allow authenticated uploads to files bucket" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'files');

CREATE POLICY "Allow public downloads from files bucket" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'files');

CREATE POLICY "Allow authenticated deletes from files bucket" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 📊 파일 첨부 관련 테이블 추가

-- 파일 첨부 정보를 저장하는 테이블
CREATE TABLE IF NOT EXISTS file_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type varchar(50) NOT NULL, -- 'task', 'report', 'announcement' 등
  entity_id uuid NOT NULL,
  file_name varchar(255) NOT NULL,
  original_name varchar(255) NOT NULL,
  file_size bigint NOT NULL,
  file_type varchar(100) NOT NULL,
  file_url text NOT NULL,
  bucket_name varchar(50) NOT NULL,
  file_path text NOT NULL,
  uploaded_by uuid,
  uploaded_by_name varchar(255),
  uploaded_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_attachments_created_at ON file_attachments(created_at);

-- 🗃️ 기존 테이블에 첨부파일 참조 컬럼 추가 (이미 있다면 무시)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachment_count integer DEFAULT 0;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS attachment_count integer DEFAULT 0;
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS attachment_count integer DEFAULT 0;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS attachment_count integer DEFAULT 0;

-- 📝 트리거 함수: 첨부파일 수 자동 업데이트
CREATE OR REPLACE FUNCTION update_attachment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 첨부파일 추가시 카운트 증가
    CASE NEW.entity_type
      WHEN 'task' THEN
        UPDATE tasks SET attachment_count = attachment_count + 1 WHERE id = NEW.entity_id;
      WHEN 'daily_report' THEN
        UPDATE daily_reports SET attachment_count = attachment_count + 1 WHERE id = NEW.entity_id;
      WHEN 'announcement' THEN
        UPDATE announcements SET attachment_count = attachment_count + 1 WHERE id = NEW.entity_id;
      WHEN 'report' THEN
        UPDATE reports SET attachment_count = attachment_count + 1 WHERE id = NEW.entity_id;
    END CASE;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 첨부파일 삭제시 카운트 감소
    CASE OLD.entity_type
      WHEN 'task' THEN
        UPDATE tasks SET attachment_count = GREATEST(attachment_count - 1, 0) WHERE id = OLD.entity_id;
      WHEN 'daily_report' THEN
        UPDATE daily_reports SET attachment_count = GREATEST(attachment_count - 1, 0) WHERE id = OLD.entity_id;
      WHEN 'announcement' THEN
        UPDATE announcements SET attachment_count = GREATEST(attachment_count - 1, 0) WHERE id = OLD.entity_id;
      WHEN 'report' THEN
        UPDATE reports SET attachment_count = GREATEST(attachment_count - 1, 0) WHERE id = OLD.entity_id;
    END CASE;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_attachment_count ON file_attachments;
CREATE TRIGGER trigger_update_attachment_count
  AFTER INSERT OR DELETE ON file_attachments
  FOR EACH ROW EXECUTE FUNCTION update_attachment_count();

-- 📈 뷰: 첨부파일이 있는 엔티티 조회
CREATE OR REPLACE VIEW entities_with_attachments AS
SELECT 
  'task' as entity_type,
  t.id as entity_id,
  t.title as entity_title,
  t.attachment_count,
  t.created_at
FROM tasks t
WHERE t.attachment_count > 0

UNION ALL

SELECT 
  'daily_report' as entity_type,
  dr.id as entity_id,
  dr.author_name || ' - ' || dr.date::text as entity_title,
  dr.attachment_count,
  dr.created_at
FROM daily_reports dr
WHERE dr.attachment_count > 0

UNION ALL

SELECT 
  'announcement' as entity_type,
  a.id as entity_id,
  a.title as entity_title,
  a.attachment_count,
  a.created_at
FROM announcements a
WHERE a.attachment_count > 0

UNION ALL

SELECT 
  'report' as entity_type,
  r.id as entity_id,
  r.title as entity_title,
  r.attachment_count,
  r.created_at
FROM reports r
WHERE r.attachment_count > 0;

-- ✅ 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '🎉 Storage 버킷과 파일 첨부 시스템이 성공적으로 설정되었습니다!';
  RAISE NOTICE '';
  RAISE NOTICE '📁 생성된 버킷:';
  RAISE NOTICE '  - images: 이미지 파일 (10MB 제한)';
  RAISE NOTICE '  - documents: 문서 파일 (10MB 제한)';
  RAISE NOTICE '  - videos: 비디오 파일 (50MB 제한)';
  RAISE NOTICE '  - files: 일반 파일 (10MB 제한)';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 보안 정책이 설정되었습니다.';
  RAISE NOTICE '📊 파일 첨부 관련 테이블과 트리거가 생성되었습니다.';
  RAISE NOTICE '';
  RAISE NOTICE '이제 파일 업로드 기능을 사용할 수 있습니다! 🚀';
END $$; 