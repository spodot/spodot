# 🏗️ Spodot 피트니스 관리 시스템 백엔드 설정 가이드

## 📋 개요
이 가이드는 Spodot 피트니스 관리 시스템의 백엔드(Supabase) 테이블을 생성하는 방법을 설명합니다.

## 🎯 필요한 테이블들

### 기본 테이블 (Base Tables)
- **users**: 사용자 관리 (관리자, 직원, 트레이너, 회원)
- **tasks**: 업무 관리
- **daily_reports**: 일일 업무 보고서
- **announcements**: 공지사항
- **manuals**: 매뉴얼/가이드
- **sales_entries**: 매출 기록
- **notifications**: 알림

### 확장 테이블 (Extended Tables)
- **task_comments**: 업무 댓글
- **schedules**: 일정 관리 (PT, OT, 그룹수업)
- **reports**: 종합 보고서 시스템
- **report_templates**: 보고서 템플릿
- **report_comments**: 보고서 댓글
- **ot_members**: OT 회원 관리
- **ot_progress**: OT 진행 상황
- **ot_sessions**: OT 개별 세션
- **handovers**: 인계사항
- **vending_machines**: 자판기 관리
- **vending_products**: 자판기 상품
- **vending_inventory**: 자판기 재고
- **vending_sales**: 자판기 판매 기록
- **vending_transactions**: 자판기 거래 내역
- **suggestions**: 건의사항

## 🚀 설치 순서

### 1단계: 기본 테이블 생성
```sql
-- src/scripts/create_base_tables.sql 실행
-- 이 스크립트는 기본적인 테이블들과 관리자 계정을 생성합니다.
```

### 2단계: 확장 테이블 생성
```sql
-- src/scripts/create_missing_tables.sql 실행
-- 이 스크립트는 추가 기능들을 위한 테이블들을 생성합니다.
```

## 📊 Supabase에서 실행하는 방법

### 방법 1: Supabase Dashboard
1. [Supabase Dashboard](https://supabase.com/dashboard) 로그인
2. 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. "New Query" 클릭
5. `create_base_tables.sql` 내용을 복사해서 붙여넣기
6. "Run" 버튼 클릭
7. 완료 후 `create_missing_tables.sql` 반복

### 방법 2: Supabase CLI (추천)
```bash
# Supabase CLI 설치 (이미 설치된 경우 생략)
npm install -g supabase

# 프로젝트와 연결
supabase init
supabase link --project-ref YOUR_PROJECT_REF

# 마이그레이션 파일 생성
supabase migration new create_base_tables
supabase migration new create_missing_tables

# 마이그레이션 실행
supabase db push
```

## ⚙️ 환경 설정

### 환경 변수 확인
현재 `src/lib/supabase.ts`에 설정된 값들:
```typescript
const supabaseUrl = 'https://piwftspnolcvpytaqaeq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

### RLS (Row Level Security) 설정
보안을 위해 RLS 정책을 설정해야 합니다:

```sql
-- 모든 테이블에 RLS 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
-- ... 기타 테이블들

-- 기본 정책 예시 (관리자는 모든 데이터 접근 가능)
CREATE POLICY "Enable all for admin users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
```

## 🔍 생성 확인

### 테이블 생성 확인
```sql
-- 모든 테이블 목록 조회
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 샘플 데이터 확인
```sql
-- 관리자 계정 확인
SELECT id, name, email, role FROM users WHERE role = 'admin';

-- 테이블별 데이터 개수 확인
SELECT 
  schemaname,
  tablename,
  n_tup_ins as "rows"
FROM pg_stat_user_tables
ORDER BY tablename;
```

## 🎨 현재 구현된 기능들

### ✅ 완료된 기능
- **업무 관리**: 생성, 수정, 삭제, 댓글, 필터링
- **일정 관리**: PT/OT/그룹수업 스케줄링
- **보고서 시스템**: 다양한 타입의 보고서 작성 및 워크플로우
- **OT 관리**: 회원 등록, 진행 상황, 세션 관리
- **인계사항**: 업무 인계 및 히스토리
- **자판기 관리**: 재고, 판매, 거래 내역 관리
- **건의사항**: 직원/회원 건의사항 수집 및 관리
- **공지사항**: 역할별 타겟팅 공지
- **직원 관리**: 실제 Supabase 연동

### 🔄 데이터 마이그레이션
모든 Context는 localStorage → Supabase 자동 마이그레이션을 지원합니다:
- 기존 데이터 자동 감지
- 안전한 마이그레이션
- 샘플 데이터 생성
- 실시간 동기화

## 🛠️ 트러블슈팅

### 자주 발생하는 문제들

1. **외래 키 제약 조건 오류**
   ```sql
   -- 제약 조건 확인
   SELECT conname, conrelid::regclass, confrelid::regclass 
   FROM pg_constraint WHERE contype = 'f';
   ```

2. **권한 문제**
   ```sql
   -- 현재 사용자 권한 확인
   SELECT current_user, session_user;
   ```

3. **테이블 존재 확인**
   ```sql
   -- 특정 테이블 존재 여부
   SELECT EXISTS (
     SELECT FROM information_schema.tables 
     WHERE table_schema = 'public' 
     AND table_name = 'your_table_name'
   );
   ```

## 📞 지원

문제가 발생하면 다음을 확인해주세요:
1. Supabase 프로젝트 상태
2. 네트워크 연결
3. SQL 실행 권한
4. 테이블 생성 순서 (기본 테이블 → 확장 테이블)

## 🎯 다음 단계

테이블 생성 완료 후:
1. 개발 서버 재시작: `npm run dev`
2. 관리자 계정으로 로그인: `spodot@naver.com` / `123456`
3. 직원 추가를 통한 실제 데이터 테스트
4. 각 기능별 데이터 입력 및 동작 확인 