import React, { useEffect, useCallback } from 'react';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export const useKeyboardShortcuts = ({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // 입력 필드에서는 단축키 비활성화
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return;
    }

    const matchingShortcut = shortcuts.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.altKey === event.altKey
      );
    });

    if (matchingShortcut) {
      event.preventDefault();
      matchingShortcut.action();
    }
  }, [shortcuts, enabled]);

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);

  return shortcuts;
};

// 공통 단축키 프리셋
export const commonShortcuts = {
  // 네비게이션
  goToTasks: { key: 't', ctrlKey: true, description: '업무 목록으로 이동' },
  goToSchedule: { key: 's', ctrlKey: true, description: '일정 관리로 이동' },
  goToAnnouncements: { key: 'a', ctrlKey: true, description: '공지사항으로 이동' },
  
  // 액션
  newItem: { key: 'n', ctrlKey: true, description: '새 항목 추가' },
  search: { key: 'k', ctrlKey: true, description: '검색' },
  save: { key: 's', ctrlKey: true, description: '저장' },
  cancel: { key: 'Escape', description: '취소/닫기' },
  
  // 도움말
  showHelp: { key: '?', shiftKey: true, description: '도움말 표시' },
};

// 도움말 모달 컴포넌트
export const KeyboardShortcutsHelp: React.FC<{ 
  shortcuts: KeyboardShortcut[], 
  isOpen: boolean, 
  onClose: () => void 
}> = ({ shortcuts, isOpen, onClose }) => {
  if (!isOpen) return null;

  const formatShortcut = (shortcut: KeyboardShortcut) => {
    const keys = [];
    if (shortcut.ctrlKey) keys.push('Ctrl');
    if (shortcut.shiftKey) keys.push('Shift');
    if (shortcut.altKey) keys.push('Alt');
    keys.push(shortcut.key.toUpperCase());
    return keys.join(' + ');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[calc(100vh-4rem)] overflow-y-auto my-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">키보드 단축키</h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-mono bg-slate-100 border border-slate-300 rounded">
                  {formatShortcut(shortcut)}
                </kbd>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              💡 입력 필드에서는 단축키가 비활성화됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 