-- 외래 키 제약 조건에 CASCADE 옵션 추가
-- 기존 제약 조건을 삭제하고 CASCADE 옵션과 함께 재생성

-- 1. 업무 댓글 관련 (이미 애플리케이션에서 처리했지만 DB 레벨에서도 보장)
ALTER TABLE task_comments DROP CONSTRAINT IF EXISTS task_comments_task_id_fkey;
ALTER TABLE task_comments ADD CONSTRAINT task_comments_task_id_fkey 
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- 2. 보고서 댓글 관련
ALTER TABLE report_comments DROP CONSTRAINT IF EXISTS fk_report_comments_report_id;
ALTER TABLE report_comments ADD CONSTRAINT fk_report_comments_report_id 
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

-- 3. 자판기 재고 관련
ALTER TABLE vending_inventory DROP CONSTRAINT IF EXISTS vending_inventory_product_id_fkey;
ALTER TABLE vending_inventory ADD CONSTRAINT vending_inventory_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES vending_products(id) ON DELETE CASCADE;

ALTER TABLE vending_inventory DROP CONSTRAINT IF EXISTS vending_inventory_vending_id_fkey;
ALTER TABLE vending_inventory ADD CONSTRAINT vending_inventory_vending_id_fkey 
  FOREIGN KEY (vending_id) REFERENCES vending_machines(id) ON DELETE CASCADE;

-- 4. 자판기 매출 관련
ALTER TABLE vending_sales DROP CONSTRAINT IF EXISTS vending_sales_product_id_fkey;
ALTER TABLE vending_sales ADD CONSTRAINT vending_sales_product_id_fkey 
  FOREIGN KEY (product_id) REFERENCES vending_products(id) ON DELETE CASCADE;

ALTER TABLE vending_sales DROP CONSTRAINT IF EXISTS vending_sales_vending_id_fkey;
ALTER TABLE vending_sales ADD CONSTRAINT vending_sales_vending_id_fkey 
  FOREIGN KEY (vending_id) REFERENCES vending_machines(id) ON DELETE CASCADE;

-- 5. 자판기 거래 관련
ALTER TABLE vending_transactions DROP CONSTRAINT IF EXISTS vending_transactions_vending_id_fkey;
ALTER TABLE vending_transactions ADD CONSTRAINT vending_transactions_vending_id_fkey 
  FOREIGN KEY (vending_id) REFERENCES vending_machines(id) ON DELETE CASCADE;

-- 6. OT 세션 관련
ALTER TABLE ot_sessions DROP CONSTRAINT IF EXISTS fk_ot_sessions_progress_id;
ALTER TABLE ot_sessions ADD CONSTRAINT fk_ot_sessions_progress_id 
  FOREIGN KEY (progress_id) REFERENCES ot_progress(id) ON DELETE CASCADE;

-- 7. OT 진행 관련
ALTER TABLE ot_progress DROP CONSTRAINT IF EXISTS fk_ot_progress_member_id;
ALTER TABLE ot_progress ADD CONSTRAINT fk_ot_progress_member_id 
  FOREIGN KEY (member_id) REFERENCES ot_members(id) ON DELETE CASCADE;

-- 8. 직원 팀 관련
ALTER TABLE staff_teams DROP CONSTRAINT IF EXISTS staff_teams_team_id_fkey;
ALTER TABLE staff_teams ADD CONSTRAINT staff_teams_team_id_fkey 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

-- 9. 사용자 권한 그룹 관련
ALTER TABLE user_permission_groups DROP CONSTRAINT IF EXISTS user_permission_groups_permission_group_id_fkey;
ALTER TABLE user_permission_groups ADD CONSTRAINT user_permission_groups_permission_group_id_fkey 
  FOREIGN KEY (permission_group_id) REFERENCES permission_groups(id) ON DELETE CASCADE;

-- 10. 매출 관련 (이미 애플리케이션에서 처리했지만 DB 레벨에서도 보장)
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_pass_id_fkey;
ALTER TABLE sales ADD CONSTRAINT sales_pass_id_fkey 
  FOREIGN KEY (pass_id) REFERENCES passes(id) ON DELETE CASCADE;

-- 확인용 쿼리
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name,
  rc.delete_rule
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
  JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND rc.delete_rule = 'CASCADE'
ORDER BY tc.table_name; 