import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'green' | 'emerald' | 'amber' | 'red' | 'violet' | 'sky';
}

const colorStyles = {
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
  },
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
  },
  violet: {
    bg: 'bg-violet-50',
    icon: 'text-violet-600',
  },
  sky: {
    bg: 'bg-sky-50',
    icon: 'text-sky-600',
  },
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'green',
}) => {
  const styles = colorStyles[color];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-400 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-1 flex items-center gap-1 text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </div>
          )}
        </div>
        <div className={`p-2 rounded-lg flex-shrink-0 ${styles.bg}`}>
          <div className={styles.icon}>{icon}</div>
        </div>
      </div>
    </div>
  );
};
