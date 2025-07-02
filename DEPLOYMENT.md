# 배포 가이드

## 🚀 배포 준비 체크리스트

### 1. 환경 변수 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Supabase 설정 (필수)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 앱 설정
VITE_APP_NAME="피트니스 센터 관리 시스템"
VITE_APP_VERSION=1.0.0

# 파일 업로드 설정
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx,xls,xlsx

# 보안 설정
VITE_ENABLE_SECURITY_AUDIT=true
VITE_MAX_LOGIN_ATTEMPTS=5
VITE_SESSION_TIMEOUT=3600000
```

### 2. 데이터베이스 설정

Supabase 프로젝트에서 다음 SQL 파일들을 순서대로 실행하세요:

```bash
1. supabase_migration.sql          # 기본 테이블 생성
2. fix_database_schema.sql         # 누락된 컬럼 추가
3. setup_realtime_notifications.sql # 실시간 알림 설정
4. create_storage_buckets.sql      # 파일 저장소 설정
```

### 3. 권한 설정

Supabase Dashboard에서:
- RLS (Row Level Security) 정책 활성화
- 사용자 테이블 권한 설정
- Storage 버킷 권한 설정

### 4. 빌드 및 배포

```bash
# 의존성 설치
npm install

# 프로덕션 빌드
npm run build

# 배포 (Vercel 예시)
vercel --prod
```

## 📋 배포 후 확인사항

### 기능 테스트
- [ ] 로그인/로그아웃
- [ ] 권한별 메뉴 표시
- [ ] 업무 생성/수정/삭제
- [ ] 파일 업로드/다운로드
- [ ] 실시간 알림
- [ ] 에러 처리

### 성능 체크
- [ ] 페이지 로딩 속도 (3초 이내)
- [ ] 번들 크기 (각 청크 1MB 이하)
- [ ] 모바일 반응형

### 보안 점검
- [ ] 환경 변수 노출 없음
- [ ] HTTPS 적용
- [ ] 권한 시스템 정상 동작

## 🔧 최적화 권장사항

### 1. PWA 설정
```bash
npm install @vite-pwa/vite-plugin
```

### 2. 이미지 최적화
- WebP 포맷 사용
- 이미지 압축 (85% 품질)
- Lazy loading 적용

### 3. 캐싱 전략
- Static assets: 1년 캐시
- API 응답: 적절한 캐시 헤더
- Service Worker 활용

## 🚨 트러블슈팅

### 빌드 에러
```bash
# 캐시 정리
npm run clean
rm -rf node_modules package-lock.json
npm install

# TypeScript 에러 체크
npm run type-check
```

### 환경 변수 에러
- `.env` 파일이 프로젝트 루트에 있는지 확인
- 변수명이 `VITE_` 접두사로 시작하는지 확인
- 특수문자는 따옴표로 감싸기

### 권한 에러
- Supabase RLS 정책 확인
- 사용자 역할 및 권한 매핑 확인
- 데이터베이스 스키마 일치 여부

## 📈 모니터링

### 추천 도구
- **성능**: Lighthouse, WebPageTest
- **에러 추적**: Sentry, LogRocket
- **분석**: Google Analytics, Mixpanel
- **업타임**: UptimeRobot, Pingdom

### 핵심 지표
- First Contentful Paint < 2s
- Largest Contentful Paint < 4s
- Cumulative Layout Shift < 0.1
- 에러율 < 1%

## 🔄 업데이트 프로세스

1. **기능 개발**: feature 브랜치에서 개발
2. **테스트**: 스테이징 환경에서 테스트
3. **배포**: main 브랜치로 머지 후 자동 배포
4. **모니터링**: 배포 후 24시간 모니터링
5. **롤백**: 문제 발생시 즉시 이전 버전으로 롤백 