-- 🔍 Spodot 데이터베이스 스키마 검증 스크립트
-- 필요한 테이블과 컬럼이 모두 존재하는지 확인합니다

-- 1. tasks 테이블 컬럼 확인
SELECT 
    'tasks 테이블 컬럼 검증' as check_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 2. 필수 테이블 존재 확인
SELECT 
    '필수 테이블 존재 확인' as check_type,
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✅ 존재'
        ELSE '❌ 누락'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'users', 'tasks', 'task_comments', 'daily_reports', 
    'announcements', 'schedules', 'suggestions', 'notifications'
)
ORDER BY table_name;

-- 3. tasks 테이블 필수 컬럼 확인
WITH required_columns AS (
    SELECT unnest(ARRAY[
        'id', 'title', 'description', 'status', 'priority', 
        'category', 'assigned_to', 'created_by', 'due_date', 
        'start_time', 'end_time', 'tags', 'created_at', 'updated_at'
    ]) as col_name
),
existing_columns AS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'tasks'
)
SELECT 
    'tasks 컬럼 필수 검증' as check_type,
    r.col_name as required_column,
    CASE 
        WHEN e.column_name IS NOT NULL THEN '✅ 존재'
        ELSE '❌ 누락'
    END as status
FROM required_columns r
LEFT JOIN existing_columns e ON r.col_name = e.column_name
ORDER BY r.col_name;

-- 4. 외래 키 제약조건 확인
SELECT 
    '외래키 제약조건 확인' as check_type,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('tasks', 'task_comments', 'daily_reports', 'announcements', 'schedules')
ORDER BY tc.table_name, kcu.column_name;

-- 5. 인덱스 확인
SELECT 
    '인덱스 확인' as check_type,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('tasks', 'task_comments', 'daily_reports', 'announcements', 'schedules')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. 트리거 확인
SELECT 
    '트리거 확인' as check_type,
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_table IN ('tasks', 'daily_reports', 'announcements', 'schedules', 'suggestions')
ORDER BY event_object_table, trigger_name;

-- 7. 샘플 데이터 확인 (각 테이블별 레코드 수)
SELECT 
    '테이블별 레코드 수' as check_type,
    'users' as table_name,
    COUNT(*) as record_count
FROM users
UNION ALL
SELECT 
    '테이블별 레코드 수' as check_type,
    'tasks' as table_name,
    COUNT(*) as record_count
FROM tasks
UNION ALL
SELECT 
    '테이블별 레코드 수' as check_type,
    'task_comments' as table_name,
    COUNT(*) as record_count
FROM task_comments
UNION ALL
SELECT 
    '테이블별 레코드 수' as check_type,
    'daily_reports' as table_name,
    COUNT(*) as record_count
FROM daily_reports
UNION ALL
SELECT 
    '테이블별 레코드 수' as check_type,
    'announcements' as table_name,
    COUNT(*) as record_count
FROM announcements
UNION ALL
SELECT 
    '테이블별 레코드 수' as check_type,
    'schedules' as table_name,
    COUNT(*) as record_count
FROM schedules
UNION ALL
SELECT 
    '테이블별 레코드 수' as check_type,
    'suggestions' as table_name,
    COUNT(*) as record_count
FROM suggestions
ORDER BY table_name;

-- 8. 스키마 검증 요약
DO $$ 
DECLARE
    missing_cols INTEGER;
    missing_tables INTEGER;
BEGIN
    -- 누락된 컬럼 개수 확인
    SELECT COUNT(*) INTO missing_cols
    FROM (
        SELECT unnest(ARRAY[
            'priority', 'category', 'due_date', 'start_time', 'end_time', 'tags'
        ]) as col_name
    ) required
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = required.col_name
    );
    
    -- 누락된 테이블 개수 확인
    SELECT COUNT(*) INTO missing_tables
    FROM (
        SELECT unnest(ARRAY[
            'task_comments', 'daily_reports', 'announcements', 'schedules', 'suggestions'
        ]) as table_name
    ) required
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = required.table_name
    );
    
    -- 결과 출력
    RAISE NOTICE '==========================================';
    RAISE NOTICE '📊 데이터베이스 스키마 검증 결과';
    RAISE NOTICE '==========================================';
    
    IF missing_cols = 0 AND missing_tables = 0 THEN
        RAISE NOTICE '✅ 모든 스키마가 올바르게 설정되었습니다!';
        RAISE NOTICE '   - tasks 테이블: 모든 필수 컬럼 존재';
        RAISE NOTICE '   - 필수 테이블들: 모두 생성됨';
    ELSE
        RAISE NOTICE '❌ 스키마 문제 발견:';
        IF missing_cols > 0 THEN
            RAISE NOTICE '   - tasks 테이블에 % 개 컬럼 누락', missing_cols;
        END IF;
        IF missing_tables > 0 THEN
            RAISE NOTICE '   - % 개 테이블 누락', missing_tables;
        END IF;
        RAISE NOTICE '   ➡️  fix_database_schema.sql을 실행하세요';
    END IF;
    
    RAISE NOTICE '==========================================';
END $$; 