-- 데이터베이스 성능 최적화를 위한 인덱스 추가
-- 자주 사용되는 쿼리 패턴에 따른 인덱스 생성

-- 1. 사용자 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);

-- 2. 업무(tasks) 관련 인덱스  
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_status_assigned ON tasks(status, assigned_to);

-- 3. 공지사항(announcements) 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at);
CREATE INDEX IF NOT EXISTS idx_announcements_active_created ON announcements(is_active, created_at);

-- 4. 보고서(reports) 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_reports_created_by ON reports(created_by);
CREATE INDEX IF NOT EXISTS idx_reports_report_date ON reports(report_date);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_date_status ON reports(report_date, status);

-- 5. 알림(notifications) 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);

-- 6. 건의사항(suggestions) 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_suggestions_author_id ON suggestions(author_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_category ON suggestions(category);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at);

-- 7. 매출(sales_entries) 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_sales_entries_author_id ON sales_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_sales_entries_sale_date ON sales_entries(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_entries_payment_method ON sales_entries(payment_method);
CREATE INDEX IF NOT EXISTS idx_sales_entries_date_method ON sales_entries(sale_date, payment_method);

-- 8. 이용권(passes) 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_passes_member_id ON passes(member_id);
CREATE INDEX IF NOT EXISTS idx_passes_status ON passes(status);
CREATE INDEX IF NOT EXISTS idx_passes_start_date ON passes(start_date);
CREATE INDEX IF NOT EXISTS idx_passes_end_date ON passes(end_date);
CREATE INDEX IF NOT EXISTS idx_passes_member_status ON passes(member_id, status);

-- 9. 일정(schedules) 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_schedules_client_id ON schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_schedules_trainer_id ON schedules(trainer_id);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);
CREATE INDEX IF NOT EXISTS idx_schedules_trainer_date ON schedules(trainer_id, date);

-- 10. 자판기 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_vending_sales_machine_id ON vending_sales(machine_id);
CREATE INDEX IF NOT EXISTS idx_vending_sales_product_id ON vending_sales(product_id);
CREATE INDEX IF NOT EXISTS idx_vending_sales_sale_date ON vending_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_vending_inventory_machine_id ON vending_inventory(machine_id);
CREATE INDEX IF NOT EXISTS idx_vending_inventory_product_id ON vending_inventory(product_id);

-- 11. 복합 인덱스 (자주 함께 조회되는 컬럼들)
CREATE INDEX IF NOT EXISTS idx_tasks_composite ON tasks(status, priority, assigned_to, due_date);
CREATE INDEX IF NOT EXISTS idx_reports_composite ON reports(type, status, report_date, created_by);
CREATE INDEX IF NOT EXISTS idx_sales_composite ON sales_entries(sale_date, payment_method, author_id);

-- 12. 전체 텍스트 검색을 위한 인덱스 (PostgreSQL GIN 인덱스)
CREATE INDEX IF NOT EXISTS idx_tasks_search ON tasks USING gin(to_tsvector('korean', title || ' ' || COALESCE(description, '')));
CREATE INDEX IF NOT EXISTS idx_announcements_search ON announcements USING gin(to_tsvector('korean', title || ' ' || COALESCE(content, '')));
CREATE INDEX IF NOT EXISTS idx_suggestions_search ON suggestions USING gin(to_tsvector('korean', title || ' ' || COALESCE(content, '')));

-- 13. 날짜 범위 검색 최적화를 위한 BRIN 인덱스 (대용량 데이터용)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at_brin ON tasks USING brin(created_at);
CREATE INDEX IF NOT EXISTS idx_reports_date_brin ON reports USING brin(report_date);
CREATE INDEX IF NOT EXISTS idx_sales_date_brin ON sales_entries USING brin(sale_date);

-- 인덱스 생성 완료 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname; 