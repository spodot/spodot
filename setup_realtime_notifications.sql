-- 🔔 실시간 알림 시스템 설정 스크립트
-- Supabase Realtime을 활용한 실시간 알림 시스템 설정

-- 📊 알림 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  type varchar(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  title varchar(255) NOT NULL,
  message text NOT NULL,
  link varchar(255),
  is_read boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 🔐 Row Level Security (RLS) 정책 설정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 알림만 조회 가능
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 알림만 업데이트 가능 (읽음 처리 등)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 인증된 사용자는 알림 생성 가능 (서비스 계정용)
CREATE POLICY "Authenticated users can insert notifications" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 사용자는 자신의 알림만 삭제 가능
CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- 📺 Realtime 활성화
-- notifications 테이블에 대한 realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- 다른 중요 테이블들도 realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE daily_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;

-- 🔧 알림 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_notification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_notification_timestamp ON notifications;
CREATE TRIGGER trigger_update_notification_timestamp
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION update_notification_timestamp();

-- 🎯 자동 알림 생성 함수들

-- 1. 작업 할당 시 알림 생성
CREATE OR REPLACE FUNCTION notify_task_assigned()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.assigned_to,
      'info',
      '새 작업이 할당되었습니다',
      format('"%s" 작업이 할당되었습니다.', NEW.title),
      format('/dashboard/my-tasks?task=%s', NEW.id),
      jsonb_build_object(
        'task_id', NEW.id,
        'assigned_by', NEW.assigned_by,
        'event_type', 'task_assigned'
      )
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, metadata)
    VALUES (
      NEW.assigned_to,
      'info',
      '작업이 재할당되었습니다',
      format('"%s" 작업이 새로 할당되었습니다.', NEW.title),
      format('/dashboard/my-tasks?task=%s', NEW.id),
      jsonb_build_object(
        'task_id', NEW.id,
        'assigned_by', NEW.assigned_by,
        'event_type', 'task_reassigned'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 작업 할당 트리거
DROP TRIGGER IF EXISTS trigger_notify_task_assigned ON tasks;
CREATE TRIGGER trigger_notify_task_assigned
  AFTER INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_assigned();

-- 2. 작업 상태 변경 시 알림 생성
CREATE OR REPLACE FUNCTION notify_task_status_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- 작업 완료 시 할당자에게 알림
    IF NEW.status = 'completed' AND NEW.assigned_by IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        NEW.assigned_by,
        'success',
        '작업이 완료되었습니다',
        format('"%s" 작업이 완료되었습니다.', NEW.title),
        format('/dashboard/all-tasks?task=%s', NEW.id),
        jsonb_build_object(
          'task_id', NEW.id,
          'completed_by', NEW.assigned_to,
          'event_type', 'task_completed'
        )
      );
    END IF;
    
    -- 작업 지연 시 관련자들에게 알림
    IF NEW.status = 'overdue' THEN
      -- 담당자에게 알림
      IF NEW.assigned_to IS NOT NULL THEN
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          NEW.assigned_to,
          'warning',
          '작업이 지연되었습니다',
          format('"%s" 작업이 마감일을 초과했습니다.', NEW.title),
          format('/dashboard/my-tasks?task=%s', NEW.id),
          jsonb_build_object(
            'task_id', NEW.id,
            'event_type', 'task_overdue'
          )
        );
      END IF;
      
      -- 할당자에게도 알림
      IF NEW.assigned_by IS NOT NULL AND NEW.assigned_by != NEW.assigned_to THEN
        INSERT INTO notifications (user_id, type, title, message, link, metadata)
        VALUES (
          NEW.assigned_by,
          'warning',
          '할당한 작업이 지연되었습니다',
          format('"%s" 작업이 마감일을 초과했습니다.', NEW.title),
          format('/dashboard/all-tasks?task=%s', NEW.id),
          jsonb_build_object(
            'task_id', NEW.id,
            'assigned_to', NEW.assigned_to,
            'event_type', 'task_overdue'
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 작업 상태 변경 트리거
DROP TRIGGER IF EXISTS trigger_notify_task_status_changed ON tasks;
CREATE TRIGGER trigger_notify_task_status_changed
  AFTER UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION notify_task_status_changed();

-- 3. 공지사항 등록 시 전체 알림
CREATE OR REPLACE FUNCTION notify_announcement_created()
RETURNS TRIGGER AS $$
DECLARE
  target_user RECORD;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 모든 사용자에게 알림 (공지사항 대상에 따라 필터링 가능)
    FOR target_user IN 
      SELECT id FROM auth.users 
      WHERE raw_user_meta_data->>'role' IS NOT NULL
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        target_user.id,
        CASE WHEN NEW.priority = 'urgent' THEN 'warning' ELSE 'info' END,
        '새 공지사항이 등록되었습니다',
        format('"%s" 공지사항을 확인해보세요.', NEW.title),
        format('/dashboard/announcements?id=%s', NEW.id),
        jsonb_build_object(
          'announcement_id', NEW.id,
          'author', NEW.author,
          'priority', NEW.priority,
          'event_type', 'announcement_created'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 공지사항 생성 트리거
DROP TRIGGER IF EXISTS trigger_notify_announcement_created ON announcements;
CREATE TRIGGER trigger_notify_announcement_created
  AFTER INSERT ON announcements
  FOR EACH ROW EXECUTE FUNCTION notify_announcement_created();

-- 4. 일정 변경 시 알림
CREATE OR REPLACE FUNCTION notify_schedule_changed()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- 새 일정 등록 시 해당 사용자에게 알림
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        NEW.user_id,
        'info',
        '새 일정이 등록되었습니다',
        format('%s에 "%s" 일정이 등록되었습니다.', 
          to_char(NEW.date, 'YYYY-MM-DD'), NEW.title),
        '/dashboard/schedules',
        jsonb_build_object(
          'schedule_id', NEW.id,
          'event_type', 'schedule_created'
        )
      );
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' AND NEW.user_id IS NOT NULL THEN
    -- 일정 시간 변경 시
    IF OLD.start_time IS DISTINCT FROM NEW.start_time OR OLD.end_time IS DISTINCT FROM NEW.end_time THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata)
      VALUES (
        NEW.user_id,
        'warning',
        '일정 시간이 변경되었습니다',
        format('"%s" 일정의 시간이 변경되었습니다.', NEW.title),
        '/dashboard/schedules',
        jsonb_build_object(
          'schedule_id', NEW.id,
          'old_start_time', OLD.start_time,
          'new_start_time', NEW.start_time,
          'event_type', 'schedule_time_changed'
        )
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 일정 변경 트리거
DROP TRIGGER IF EXISTS trigger_notify_schedule_changed ON schedules;
CREATE TRIGGER trigger_notify_schedule_changed
  AFTER INSERT OR UPDATE ON schedules
  FOR EACH ROW EXECUTE FUNCTION notify_schedule_changed();

-- 📈 알림 통계 뷰
CREATE OR REPLACE VIEW notification_stats AS
SELECT 
  type,
  COUNT(*) as total_count,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_read_time_seconds
FROM notifications
GROUP BY type;

-- 사용자별 알림 통계 뷰
CREATE OR REPLACE VIEW user_notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  COUNT(*) FILTER (WHERE is_read = false) as unread_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today_count,
  MAX(created_at) as last_notification_at
FROM notifications
GROUP BY user_id;

-- 🧹 알림 정리 함수 (오래된 알림 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS void AS $$
BEGIN
  -- 30일 이상 된 읽은 알림 삭제
  DELETE FROM notifications 
  WHERE is_read = true 
    AND created_at < CURRENT_DATE - INTERVAL '30 days';
    
  -- 90일 이상 된 모든 알림 삭제
  DELETE FROM notifications 
  WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
  
  RAISE NOTICE '오래된 알림 정리 완료';
END;
$$ LANGUAGE plpgsql;

-- ⏰ 정기적인 알림 정리를 위한 cron job 설정 (pg_cron 확장이 있는 경우)
-- SELECT cron.schedule('cleanup-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications();');

-- ✅ 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '🎉 실시간 알림 시스템 설정이 완료되었습니다!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 설정된 기능:';
  RAISE NOTICE '  ✓ 알림 테이블 및 인덱스 생성';
  RAISE NOTICE '  ✓ Row Level Security 정책 설정';
  RAISE NOTICE '  ✓ Supabase Realtime 활성화';
  RAISE NOTICE '  ✓ 자동 알림 트리거 함수들 생성';
  RAISE NOTICE '  ✓ 알림 통계 뷰 생성';
  RAISE NOTICE '  ✓ 알림 정리 함수 생성';
  RAISE NOTICE '';
  RAISE NOTICE '🔔 이제 다음 이벤트에서 실시간 알림이 발송됩니다:';
  RAISE NOTICE '  • 작업 할당/상태 변경';
  RAISE NOTICE '  • 공지사항 등록';
  RAISE NOTICE '  • 일정 등록/변경';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 실시간 알림 시스템을 사용할 준비가 완료되었습니다!';
END $$; 