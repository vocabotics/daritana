// Advanced Data Visualization Components for 2025 Architecture Platform
import * as React from 'react';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, Minus, Activity, 
  Calendar, Clock, DollarSign, Users, FileText,
  CheckCircle, XCircle, AlertCircle, Info
} from 'lucide-react';
import { AdvancedCard } from './advanced-card';

// Progress Ring Component
interface ProgressRingProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  color?: string;
  backgroundColor?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  max = 100,
  size = 'md',
  strokeWidth = 4,
  label,
  showValue = true,
  color = 'rgb(var(--primary))',
  backgroundColor = 'rgb(var(--border))',
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: { width: 60, height: 60, fontSize: 'text-xs' },
    md: { width: 100, height: 100, fontSize: 'text-sm' },
    lg: { width: 140, height: 140, fontSize: 'text-base' },
    xl: { width: 180, height: 180, fontSize: 'text-lg' },
  };
  
  const currentSize = sizes[size];
  const radius = (currentSize.width - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={cn('relative inline-flex flex-col items-center', className)}>
      <svg
        width={currentSize.width}
        height={currentSize.height}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={currentSize.width / 2}
          cy={currentSize.height / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={currentSize.width / 2}
          cy={currentSize.height / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {(showValue || label) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <span className={cn('font-semibold', currentSize.fontSize)}>
              {Math.round(percentage)}%
            </span>
          )}
          {label && (
            <span className="text-xs text-muted-foreground mt-1">{label}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Linear Progress Component
interface LinearProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'gradient' | 'striped' | 'animated';
  color?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  color = 'primary',
  size = 'md',
  className,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const heights = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };
  
  const colors = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };
  
  const variants = {
    default: colors[color],
    gradient: `bg-gradient-to-r from-${color === 'primary' ? 'primary' : color}-400 to-${color === 'primary' ? 'accent' : color}-600`,
    striped: `${colors[color]} bg-stripes`,
    animated: `${colors[color]} bg-stripes animate-stripes`,
  };
  
  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-medium">{label}</span>}
          {showValue && <span className="text-sm text-muted-foreground">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-secondary rounded-full overflow-hidden', heights[size])}>
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            variants[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  description?: string;
  progress?: number;
  variant?: 'default' | 'gradient' | 'glass';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  progress,
  variant = 'default',
  className,
}) => {
  const getTrendIcon = () => {
    if (!change) return null;
    
    switch (change.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };
  
  const getTrendColor = () => {
    if (!change) return '';
    
    switch (change.trend) {
      case 'up':
        return 'text-green-600 dark:text-green-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };
  
  return (
    <AdvancedCard
      variant={variant === 'glass' ? 'glass' : variant === 'gradient' ? 'gradient' : 'default'}
      className={cn('relative overflow-hidden', className)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            {change && (
              <span className={cn('flex items-center text-sm font-medium', getTrendColor())}>
                {getTrendIcon()}
                <span className="ml-1">
                  {change.trend === 'down' ? '-' : change.trend === 'up' ? '+' : ''}
                  {Math.abs(change.value)}%
                </span>
              </span>
            )}
          </div>
          {description && (
            <p className="mt-2 text-xs text-muted-foreground">{description}</p>
          )}
          {progress !== undefined && (
            <div className="mt-3">
              <LinearProgress value={progress} size="sm" />
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
      
      {/* Decorative gradient overlay */}
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-primary/5 pointer-events-none" />
      )}
    </AdvancedCard>
  );
};

// Activity Timeline Component
interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  icon?: React.ReactNode;
  type?: 'success' | 'warning' | 'error' | 'info' | 'default';
  user?: {
    name: string;
    avatar?: string;
  };
}

interface ActivityTimelineProps {
  items: TimelineItem[];
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  items,
  variant = 'default',
  className,
}) => {
  const getTypeIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 dark:bg-green-900/20';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/20';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/20';
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/20';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20';
    }
  };
  
  if (variant === 'compact') {
    return (
      <div className={cn('space-y-2', className)}>
        {items.map((item) => (
          <div key={item.id} className="flex items-start space-x-3">
            <div className={cn('p-1 rounded-full', getTypeColor(item.type))}>
              {item.icon || getTypeIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.time}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn('relative', className)}>
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex items-start">
            <div className={cn(
              'relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-background border-2',
              getTypeColor(item.type)
            )}>
              {item.icon || getTypeIcon(item.type)}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold">{item.title}</h4>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
              {item.description && (
                <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.user && variant === 'detailed' && (
                <div className="mt-2 flex items-center space-x-2">
                  {item.user.avatar ? (
                    <img
                      src={item.user.avatar}
                      alt={item.user.name}
                      className="w-6 h-6 rounded-full"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                      <Users className="h-3 w-3" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{item.user.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Mini Chart Component (Sparkline)
interface MiniChartProps {
  data: number[];
  type?: 'line' | 'bar' | 'area';
  color?: string;
  height?: number;
  showGrid?: boolean;
  className?: string;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  type = 'line',
  color = 'rgb(var(--primary))',
  height = 60,
  showGrid = false,
  className,
}) => {
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const range = maxValue - minValue || 1;
  
  const normalizedData = data.map(value => 
    ((value - minValue) / range) * height
  );
  
  const width = data.length * 12;
  
  if (type === 'bar') {
    return (
      <svg
        width={width}
        height={height}
        className={cn('overflow-visible', className)}
      >
        {showGrid && (
          <>
            <line x1={0} y1={0} x2={width} y2={0} stroke="rgb(var(--border))" strokeWidth={1} />
            <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgb(var(--border))" strokeWidth={1} strokeDasharray="2,2" />
            <line x1={0} y1={height} x2={width} y2={height} stroke="rgb(var(--border))" strokeWidth={1} />
          </>
        )}
        {normalizedData.map((value, index) => (
          <rect
            key={index}
            x={index * 12 + 2}
            y={height - value}
            width={8}
            height={value}
            fill={color}
            className="opacity-80 hover:opacity-100 transition-opacity"
          />
        ))}
      </svg>
    );
  }
  
  const pathData = normalizedData
    .map((value, index) => {
      const x = index * 12 + 6;
      const y = height - value;
      return index === 0 ? `M ${x},${y}` : `L ${x},${y}`;
    })
    .join(' ');
  
  const areaData = `${pathData} L ${(data.length - 1) * 12 + 6},${height} L 6,${height} Z`;
  
  return (
    <svg
      width={width}
      height={height}
      className={cn('overflow-visible', className)}
    >
      {showGrid && (
        <>
          <line x1={0} y1={0} x2={width} y2={0} stroke="rgb(var(--border))" strokeWidth={1} />
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="rgb(var(--border))" strokeWidth={1} strokeDasharray="2,2" />
          <line x1={0} y1={height} x2={width} y2={height} stroke="rgb(var(--border))" strokeWidth={1} />
        </>
      )}
      
      {type === 'area' && (
        <path
          d={areaData}
          fill={color}
          fillOpacity={0.1}
        />
      )}
      
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {normalizedData.map((value, index) => (
        <circle
          key={index}
          cx={index * 12 + 6}
          cy={height - value}
          r={3}
          fill={color}
          className="opacity-0 hover:opacity-100 transition-opacity"
        />
      ))}
    </svg>
  );
};

// KPI Grid Component
interface KPIItem {
  id: string;
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  change?: number;
  color?: 'primary' | 'success' | 'warning' | 'error';
}

interface KPIGridProps {
  items: KPIItem[];
  columns?: 2 | 3 | 4;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  items,
  columns = 4,
  variant = 'default',
  className,
}) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  };
  
  return (
    <div className={cn(`grid gap-4 ${gridCols[columns]}`, className)}>
      {items.map((item) => (
        <StatCard
          key={item.id}
          title={item.label}
          value={item.value}
          icon={item.icon}
          change={
            item.trend && item.change
              ? { value: item.change, trend: item.trend }
              : undefined
          }
          variant={variant === 'compact' ? 'default' : 'gradient'}
        />
      ))}
    </div>
  );
};