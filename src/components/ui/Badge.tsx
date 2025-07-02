interface BadgeProps {
  count: number;
  className?: string;
}

export default function Badge({ count, className = "" }: BadgeProps) {
  if (count === 0) return null;
  
  return (
    <span className={`bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center ${className}`}>
      {count > 99 ? '99+' : count}
    </span>
  );
} 