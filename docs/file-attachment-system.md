# 📎 파일 첨부 시스템 가이드

## 🎯 개요

Spodot 피트니스 관리 시스템에 실제 파일 업로드/다운로드 기능이 구현되었습니다. Supabase Storage를 활용하여 안전하고 효율적인 파일 관리가 가능합니다.

## 🏗️ 시스템 구조

### 1. 핵심 컴포넌트

```
src/
├── services/
│   ├── fileUploadService.ts      # 파일 업로드/다운로드 서비스
│   └── fileAttachmentService.ts  # 데이터베이스 첨부파일 관리
├── components/
│   └── common/
│       └── FileUpload.tsx        # 재사용 가능한 파일 업로드 컴포넌트
└── utils/
    ├── notifications.ts          # 사용자 알림 시스템
    └── errorHandler.ts           # 에러 처리
```

### 2. 데이터베이스 구조

#### Storage 버킷
- **images**: 이미지 파일 (10MB 제한)
- **documents**: 문서 파일 (10MB 제한)  
- **videos**: 비디오 파일 (50MB 제한)
- **files**: 일반 파일 (10MB 제한)

#### 테이블
- **file_attachments**: 파일 첨부 정보 저장
- **기존 테이블들**: attachment_count 컬럼 추가

## 🚀 설치 및 설정

### 1. 데이터베이스 마이그레이션

```bash
# Supabase 대시보드의 SQL Editor에서 실행
# 또는 Supabase CLI 사용
```

```sql
-- create_storage_buckets.sql 파일 실행
-- 버킷 생성, 보안 정책 설정, 테이블 생성이 포함됨
```

### 2. 환경 설정

Supabase 프로젝트에서 Storage가 활성화되어 있는지 확인:

1. Supabase Dashboard → Storage
2. 생성된 버킷들 확인 (images, documents, videos, files)
3. RLS 정책이 올바르게 설정되었는지 확인

## 💻 사용법

### 1. 기본 파일 업로드 컴포넌트

```tsx
import FileUpload from '../components/common/FileUpload';
import { UploadResult } from '../services/fileUploadService';

function MyComponent() {
  const [attachedFiles, setAttachedFiles] = useState<UploadResult[]>([]);

  const handleFilesUploaded = (files: UploadResult[]) => {
    setAttachedFiles(prev => [...prev, ...files]);
  };

  const handleFileRemoved = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  return (
    <FileUpload
      onFilesUploaded={handleFilesUploaded}
      onFileRemoved={handleFileRemoved}
      existingFiles={attachedFiles}
      maxFiles={5}
      allowedTypes={['image/*', 'application/pdf', '.doc', '.docx']}
      folder="my_folder"
      multiple={true}
    />
  );
}
```

### 2. 수동 파일 업로드

```tsx
import { fileUploadService } from '../services/fileUploadService';

// 단일 파일 업로드
const uploadFile = async (file: File) => {
  try {
    const result = await fileUploadService.uploadFile(file, 'reports');
    console.log('업로드 완료:', result);
  } catch (error) {
    console.error('업로드 실패:', error);
  }
};

// 다중 파일 업로드
const uploadMultipleFiles = async (files: File[]) => {
  try {
    const results = await fileUploadService.uploadMultipleFiles(files, 'tasks');
    console.log('업로드 완료:', results);
  } catch (error) {
    console.error('업로드 실패:', error);
  }
};
```

### 3. 데이터베이스 첨부파일 관리

```tsx
import { fileAttachmentService } from '../services/fileAttachmentService';

// 첨부파일 정보 저장
const saveAttachment = async (entityId: string, uploadResult: UploadResult) => {
  const attachment = await fileAttachmentService.saveAttachment(
    'task',
    entityId,
    uploadResult,
    user.id,
    user.name
  );
};

// 엔티티의 첨부파일 목록 조회
const loadAttachments = async (entityId: string) => {
  const attachments = await fileAttachmentService.getAttachmentsByEntity('task', entityId);
  setAttachments(attachments);
};
```

## 🔧 설정 옵션

### FileUpload 컴포넌트 Props

| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `onFilesUploaded` | `(files: UploadResult[]) => void` | 필수 | 파일 업로드 완료 콜백 |
| `onFileRemoved` | `(fileId: string) => void` | 선택 | 파일 삭제 콜백 |
| `existingFiles` | `UploadResult[]` | `[]` | 기존 첨부파일 목록 |
| `maxFiles` | `number` | `5` | 최대 파일 수 |
| `allowedTypes` | `string[]` | 기본 타입들 | 허용된 파일 타입 |
| `folder` | `string` | `'general'` | 저장 폴더명 |
| `multiple` | `boolean` | `true` | 다중 선택 허용 |
| `disabled` | `boolean` | `false` | 비활성화 상태 |

### 지원 파일 타입

#### 이미지
- `image/jpeg`, `image/jpg`, `image/png`, `image/gif`, `image/webp`

#### 문서
- `application/pdf`
- `application/msword` (.doc)
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx)
- `application/vnd.ms-excel` (.xls)
- `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (.xlsx)
- `text/plain` (.txt)

#### 비디오
- `video/mp4`, `video/avi`, `video/mov`, `video/wmv`

## 🔒 보안 정책

### RLS (Row Level Security)

1. **업로드**: 인증된 사용자만 가능
2. **다운로드**: 공개 접근 허용
3. **삭제**: 업로드한 사용자만 가능

### 파일 크기 제한

- **이미지/문서/일반**: 10MB
- **비디오**: 50MB

### 파일명 안전화

- 타임스탬프 + 랜덤 문자열 + 원본명
- 특수문자 제거
- 길이 제한 (50자)

## 📊 모니터링 및 관리

### 스토리지 사용량 확인

```tsx
import { fileAttachmentService } from '../services/fileAttachmentService';

const checkStorageUsage = async () => {
  const usage = await fileAttachmentService.getStorageUsage();
  console.log(`총 파일 수: ${usage.totalFiles}`);
  console.log(`총 용량: ${(usage.totalSize / 1024 / 1024).toFixed(2)} MB`);
};
```

### 파일 타입별 통계

```tsx
const getFileStats = async () => {
  const stats = await fileAttachmentService.getAttachmentStats();
  console.log('파일 타입별 통계:', stats);
  // { image: 25, application: 10, video: 3 }
};
```

## 🛠️ 문제 해결

### 일반적인 문제들

#### 1. 업로드 실패
- 파일 크기 확인 (제한: 10MB)
- 파일 타입 확인
- 네트워크 연결 상태 확인

#### 2. 권한 오류
- Supabase Storage RLS 정책 확인
- 사용자 인증 상태 확인

#### 3. 파일이 보이지 않음
- 버킷 public 설정 확인
- 파일 경로 확인

### 디버깅

개발자 도구 콘솔에서 다음 정보 확인:
```javascript
// 업로드 로그
console.log('파일 업로드 시작:', fileName);
console.log('업로드 결과:', uploadResult);

// 에러 로그
console.error('업로드 실패:', error);
```

## 🔄 업데이트 및 마이그레이션

### 기존 프로젝트에 적용

1. **데이터베이스 마이그레이션**
   ```sql
   -- create_storage_buckets.sql 실행
   ```

2. **기존 컴포넌트 업데이트**
   ```tsx
   // 기존 파일 업로드 코드를 새로운 FileUpload 컴포넌트로 교체
   ```

3. **데이터 마이그레이션**
   ```tsx
   // 기존 메모리상 파일 데이터를 Storage로 이전 (필요시)
   ```

## 🎨 UI/UX 특징

### 사용자 친화적 기능

1. **드래그 앤 드롭**: 파일을 영역에 끌어다 놓기
2. **진행률 표시**: 업로드 진행 상황 시각화
3. **파일 미리보기**: 이미지 파일 썸네일 표시
4. **실시간 피드백**: 성공/실패 알림
5. **파일 정보**: 크기, 타입, 업로드 날짜 표시

### 반응형 디자인

- 모바일/태블릿/데스크톱 최적화
- 다크모드 지원
- 접근성 고려 (키보드 네비게이션, 스크린 리더)

## 📈 성능 최적화

### 이미지 최적화

1. **자동 압축**: 1920px 제한, 80% 품질
2. **형식 변환**: WebP 권장
3. **지연 로딩**: 필요시 구현

### 업로드 최적화

1. **청크 업로드**: 대용량 파일 분할 (향후 구현)
2. **중복 제거**: 동일 파일 업로드 방지
3. **캐싱**: CDN 활용 (Supabase 기본 제공)

---

## 🤝 기여하기

파일 첨부 시스템 개선에 기여하고 싶으시다면:

1. 버그 리포트
2. 기능 제안
3. 코드 개선
4. 문서 업데이트

모든 기여를 환영합니다! 💪 