import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingUp, Shield, Activity, RefreshCw } from 'lucide-react';
import { errorHandler } from '../../utils/errorHandler';

interface ErrorStatsDisplayProps {
  className?: string;
}

/**
 * 📊 에러 상태 표시 컴포넌트
 * 시스템의 에러 통계와 상태를 관리자에게 표시합니다.
 */
export const ErrorStatusDisplay: React.FC<ErrorStatsDisplayProps> = ({ className = '' }) => {
  const [stats, setStats] = useState({
    total: 0,
    byType: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    critical: 0,
    retryable: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = () => {
    setIsLoading(true);
    try {
      const errorStats = errorHandler.getErrorStats(24); // 최근 24시간
      setStats(errorStats);
    } catch (error) {
      console.error('에러 통계 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    
    // 5분마다 자동 갱신
    const interval = setInterval(loadStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string, count: number) => {
    if (count === 0) return 'text-gray-400';
    
    switch (severity) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'network': return 'text-purple-600';
      case 'database': return 'text-red-600';
      case 'permission': return 'text-orange-600';
      case 'validation': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (stats.total === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <Shield className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-green-700">
            시스템 정상 운영 중 (최근 24시간 에러 없음)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Activity className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">시스템 상태</h3>
        </div>
        <button
          onClick={loadStats}
          disabled={isLoading}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">총 에러</div>
        </div>
        <div className="text-center">
          <div className={`text-2xl font-bold ${stats.critical > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.critical}
          </div>
          <div className="text-sm text-gray-500">치명적</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.retryable}</div>
          <div className="text-sm text-gray-500">재시도 가능</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {((stats.retryable / stats.total) * 100 || 0).toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500">복구율</div>
        </div>
      </div>

      {/* 심각도별 분포 */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">심각도별 분포</h4>
        <div className="space-y-2">
          {(['critical', 'high', 'medium', 'low'] as const).map(severity => {
            const count = stats.bySeverity[severity] || 0;
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            
            return (
              <div key={severity} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    severity === 'critical' ? 'bg-red-500' :
                    severity === 'high' ? 'bg-orange-500' :
                    severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`} />
                  <span className="text-sm text-gray-600 capitalize">{severity}</span>
                </div>
                <div className="flex items-center">
                  <span className={`text-sm font-medium mr-2 ${getSeverityColor(severity, count)}`}>
                    {count}
                  </span>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        severity === 'critical' ? 'bg-red-500' :
                        severity === 'high' ? 'bg-orange-500' :
                        severity === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 타입별 분포 */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">에러 유형별 분포</h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(stats.byType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-xs text-gray-600 capitalize">{type}</span>
              <span className={`text-xs font-medium ${getTypeColor(type)}`}>{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 상태 인디케이터 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center text-xs text-gray-500">
          <div className={`w-2 h-2 rounded-full mr-2 ${
            stats.critical > 0 ? 'bg-red-500 animate-pulse' :
            stats.total > 10 ? 'bg-yellow-500' : 'bg-green-500'
          }`} />
          <span>
            {stats.critical > 0 ? '주의 필요: 치명적 에러 발생' :
             stats.total > 10 ? '경고: 에러 증가 감지' : '시스템 정상'}
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * 🚨 간단한 에러 알림 배지
 */
export const ErrorBadge: React.FC = () => {
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const stats = errorHandler.getErrorStats(1); // 최근 1시간
      setErrorCount(stats.critical);
    };

    updateCount();
    const interval = setInterval(updateCount, 60000); // 1분마다 갱신
    return () => clearInterval(interval);
  }, []);

  if (errorCount === 0) return null;

  return (
    <div className="relative">
      <AlertTriangle className="w-5 h-5 text-red-600" />
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
        {errorCount > 9 ? '9+' : errorCount}
      </span>
    </div>
  );
};

export default ErrorStatusDisplay; 