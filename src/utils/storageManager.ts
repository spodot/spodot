// localStorage 관리 유틸리티

interface StorageQuota {
  used: number;
  total: number;
  percentage: number;
}

class StorageManager {
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB 제한

  // 현재 localStorage 사용량 확인
  getStorageQuota(): StorageQuota {
    let used = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        used += localStorage[key].length + key.length;
      }
    }
    
    return {
      used,
      total: this.MAX_STORAGE_SIZE,
      percentage: Math.round((used / this.MAX_STORAGE_SIZE) * 100)
    };
  }

  // 용량 초과 시 오래된 데이터 정리
  cleanupOldData(): void {
    const quota = this.getStorageQuota();
    
    if (quota.percentage > 80) {
      console.warn('⚠️ localStorage 용량이 80%를 초과했습니다. 정리를 시작합니다.');
      
      // 정리할 키 패턴들 (오래된 순서대로)
      const cleanupPatterns = [
        'vending_', // 자판기 관련 데이터
        'daily_report_draft_', // 오래된 임시저장 데이터
        'suggestion_draft_', // 건의사항 임시저장
        'old_tasks_' // 오래된 업무 데이터
      ];
      
      for (const pattern of cleanupPatterns) {
        this.removeByPattern(pattern);
        
        const newQuota = this.getStorageQuota();
        if (newQuota.percentage < 70) {
          console.log(`✅ localStorage 정리 완료: ${newQuota.percentage}%`);
          break;
        }
      }
    }
  }

  // 패턴에 맞는 키들 삭제
  private removeByPattern(pattern: string): void {
    const keysToRemove = Object.keys(localStorage).filter(key => 
      key.startsWith(pattern)
    );
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`🗑️ 정리됨: ${key}`);
    });
  }

  // 안전한 데이터 저장 (용량 체크 포함)
  safeSetItem(key: string, value: string): boolean {
    try {
      // 저장 전 용량 체크
      const estimatedSize = key.length + value.length;
      const quota = this.getStorageQuota();
      
      if (quota.used + estimatedSize > this.MAX_STORAGE_SIZE) {
        this.cleanupOldData();
        
        // 정리 후에도 용량 부족하면 실패
        const newQuota = this.getStorageQuota();
        if (newQuota.used + estimatedSize > this.MAX_STORAGE_SIZE) {
          console.error('❌ localStorage 용량 부족으로 저장 실패');
          return false;
        }
      }
      
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error('localStorage 저장 실패:', error);
      return false;
    }
  }

  // 데이터 압축 저장 (JSON 데이터용)
  setCompressedItem(key: string, data: any): boolean {
    try {
      // JSON 문자열화 후 불필요한 공백 제거
      const jsonString = JSON.stringify(data);
      const compressedString = jsonString.replace(/\s+/g, ' ').trim();
      
      return this.safeSetItem(key, compressedString);
    } catch (error) {
      console.error('압축 저장 실패:', error);
      return false;
    }
  }

  // 압축된 데이터 읽기
  getCompressedItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('압축 데이터 읽기 실패:', error);
      return null;
    }
  }

  // 스토리지 상태 리포트
  getStorageReport(): void {
    const quota = this.getStorageQuota();
    const keys = Object.keys(localStorage);
    
    console.group('📊 localStorage 상태 리포트');
    console.log(`사용량: ${(quota.used / 1024).toFixed(2)}KB / ${(quota.total / 1024).toFixed(2)}KB (${quota.percentage}%)`);
    console.log(`저장된 키 개수: ${keys.length}개`);
    
    // 큰 데이터 항목들 표시
    const largeSizes = keys
      .map(key => ({
        key,
        size: localStorage[key].length + key.length
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
    
    console.log('큰 데이터 항목들:');
    largeSizes.forEach(item => {
      console.log(`  ${item.key}: ${(item.size / 1024).toFixed(2)}KB`);
    });
    
    console.groupEnd();
  }
}

export const storageManager = new StorageManager();

// 페이지 로드 시 자동 정리
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    storageManager.cleanupOldData();
  });
} 