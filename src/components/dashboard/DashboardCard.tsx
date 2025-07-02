import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const DashboardCard = ({ 
  title, 
  value, 
  icon, 
  description, 
  trend = 'neutral',
  trendValue
}: DashboardCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className="card p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-slate-500">
          {title}
        </h3>
        <div className="bg-slate-100 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-slate-900">
            {value}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {description}
          </p>
        </div>
        
        {trend !== 'neutral' && trendValue && (
          <div className={`flex items-center text-xs ${
            trend === 'up' ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend === 'up' ? (
              <TrendingUp size={16} className="mr-1" />
            ) : (
              <TrendingDown size={16} className="mr-1" />
            )}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardCard;