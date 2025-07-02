#!/bin/bash

# 🧹 개발용 코드 일괄 정리 스크립트
# console.log, alert, confirm을 프로덕션용 코드로 교체

echo "🚀 개발용 코드 정리 시작..."

# TypeScript/JavaScript 파일에서 console.log를 logger.debug로 교체
echo "📝 console.log를 logger.debug로 교체 중..."
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/console\.log(/logger.debug(/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/console\.error('/logger.error('/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/console\.warn('/logger.warn('/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/console\.info('/logger.info('/g"

echo "🚨 alert를 showError/showSuccess로 교체 중..."
# 성공 메시지들
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/alert('.*성공.*')/showSuccess(&)/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/alert('.*완료.*')/showSuccess(&)/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/alert('.*저장.*')/showSuccess(&)/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/alert('.*제출.*')/showSuccess(&)/g"

# 에러 메시지들  
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/alert('.*실패.*')/showError(&)/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/alert('.*오류.*')/showError(&)/g"
find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | xargs sed -i '' "s/alert('.*에러.*')/showError(&)/g"

echo "❓ window.confirm을 confirmDelete/confirmAction으로 교체 중..."
# confirm 교체는 수동으로 처리 (문맥에 따라 다름)

echo "📦 필요한 import 추가 중..."
# utils/notifications import가 없는 파일들에 추가
for file in $(find src -name "*.tsx" -o -name "*.ts" | grep -v "utils/notifications"); do
  if grep -q "logger\|showSuccess\|showError\|showWarning\|showInfo\|confirmDelete\|confirmAction" "$file"; then
    if ! grep -q "from.*utils/notifications" "$file"; then
      # import 구문 추가
      if grep -q "^import.*from" "$file"; then
        # 기존 import 다음에 추가
        sed -i '' "/^import.*from/a\\
import { logger, showSuccess, showError, showWarning, showInfo, confirmDelete, confirmAction } from '../utils/notifications';
" "$file"
      else
        # 파일 맨 위에 추가
        sed -i '' "1i\\
import { logger, showSuccess, showError, showWarning, showInfo, confirmDelete, confirmAction } from '../utils/notifications';\\

" "$file"
      fi
    fi
  fi
done

echo "✅ 개발용 코드 정리 완료!"
echo ""
echo "🔍 정리 결과:"
echo "- console.log → logger.debug"
echo "- console.error → logger.error"  
echo "- console.warn → logger.warn"
echo "- console.info → logger.info"
echo "- alert (성공) → showSuccess"
echo "- alert (에러) → showError"
echo ""
echo "⚠️  수동 확인 필요:"
echo "- window.confirm 사용처는 수동으로 confirmDelete/confirmAction 교체"
echo "- import 경로가 올바른지 확인"
echo "- 문맥에 맞는 알림 타입 사용 확인" 