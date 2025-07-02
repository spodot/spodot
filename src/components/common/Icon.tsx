import * as LucideIcons from 'lucide-react';
import { ElementType } from 'react';

interface IconProps {
  name: keyof typeof LucideIcons;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const Icon = ({ name, size = 24, className = '', onClick }: IconProps) => {
  const LucideIcon = LucideIcons[name] as ElementType;
  
  if (!LucideIcon) {
    console.error(`Icon '${name}' does not exist in lucide-react`);
    return null;
  }
  
  return (
    <LucideIcon 
      size={size} 
      className={className}
      onClick={onClick}
    />
  );
};

export default Icon; 