import React from 'react';
import clsx from 'clsx';

interface InitialsAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'square' | 'rounded';
  className?: string;
}

/**
 * 이니셜 기반 아바타 컴포넌트
 * 사용자 이름의 이니셜을 배경색과 함께 표시합니다.
 */
const InitialsAvatar: React.FC<InitialsAvatarProps> = ({
  name,
  size = 'md',
  variant = 'circle',
  className = '',
}) => {
  // 이니셜 생성 함수
  const getInitials = (name: string): string => {
    if (!name) return '?';
    
    // 이름을 공백으로 분리
    const parts = name.trim().split(/\s+/);
    
    if (parts.length === 1) {
      // 한 단어인 경우 첫 두 글자 반환 (한글은 첫 글자만)
      return name.length > 1 && /[a-zA-Z]/.test(name) 
        ? name.substring(0, 2).toUpperCase()
        : name.substring(0, 1).toUpperCase();
    }
    
    // 여러 단어인 경우 첫 단어와 마지막 단어의 첫 글자를 반환
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };
  
  // 이름에 기반한 배경색 생성
  const getBackgroundColor = (name: string): string => {
    if (!name) return 'bg-gray-300';
    
    // 이름으로부터 일관된 해시 값 생성
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // 색상 팔레트 (디자인 시스템에 맞는 색상들)
    const colors = [
      'bg-blue-500',   // 파란색
      'bg-green-500',  // 초록색
      'bg-purple-500', // 보라색
      'bg-orange-500', // 주황색
      'bg-pink-500',   // 분홍색
      'bg-teal-500',   // 청록색
      'bg-red-500',    // 빨간색
      'bg-indigo-500'  // 남색
    ];
    
    // 해시 값을 사용하여 색상 선택
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };
  
  // 크기 클래스 결정
  const sizeClass = {
    'xs': 'w-6 h-6 text-xs',
    'sm': 'w-8 h-8 text-sm',
    'md': 'w-10 h-10 text-base',
    'lg': 'w-12 h-12 text-lg',
    'xl': 'w-16 h-16 text-xl'
  }[size];
  
  // 모양 클래스 결정
  const variantClass = {
    'circle': 'rounded-full',
    'square': 'rounded-none',
    'rounded': 'rounded-lg'
  }[variant];
  
  const initials = getInitials(name);
  const bgColor = getBackgroundColor(name);
  
  return (
    <div 
      className={clsx(
        sizeClass,
        variantClass,
        bgColor,
        'inline-flex items-center justify-center font-medium text-white',
        className
      )}
      title={name}
    >
      {initials}
    </div>
  );
};

export default InitialsAvatar; 