// Advanced Card Component with 2025 Design Patterns
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { ArrowRight, MoreVertical, X } from 'lucide-react';

const cardVariants = cva(
  'relative rounded-xl transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground border shadow-sm hover:shadow-md',
        elevated: 'bg-card text-card-foreground shadow-lg hover:shadow-xl',
        outline: 'border-2 bg-background hover:border-primary',
        ghost: 'hover:bg-accent/5',
        glass: 'glass-morphism border border-white/10',
        gradient: 'bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20',
        neumorphic: 'neumorphism',
        interactive: 'cursor-pointer transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-xl',
      },
      padding: {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      spacing: {
        none: '',
        sm: 'space-y-2',
        default: 'space-y-4',
        lg: 'space-y-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      padding: 'default',
      spacing: 'default',
    },
  }
);

export interface AdvancedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
  hoverable?: boolean;
  clickable?: boolean;
  selected?: boolean;
  disabled?: boolean;
  loading?: boolean;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onClose?: () => void;
}

const AdvancedCard = React.forwardRef<HTMLDivElement, AdvancedCardProps>(
  (
    {
      className,
      variant,
      padding,
      spacing,
      hoverable = false,
      clickable = false,
      selected = false,
      disabled = false,
      loading = false,
      badge,
      actions,
      onClose,
      children,
      ...props
    },
    ref
  ) => {
    const cardClasses = cn(
      cardVariants({ variant, padding, spacing }),
      hoverable && 'hover:shadow-lg hover:-translate-y-1',
      clickable && 'cursor-pointer',
      selected && 'ring-2 ring-primary ring-offset-2',
      disabled && 'opacity-50 pointer-events-none',
      loading && 'animate-pulse',
      className
    );
    
    return (
      <div ref={ref} className={cardClasses} {...props}>
        {/* Badge */}
        {badge && (
          <div className="absolute -top-2 -right-2 z-10">{badge}</div>
        )}
        
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-md hover:bg-accent/10 transition-colors z-10"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        
        {/* Actions menu */}
        {actions && (
          <div className="absolute top-4 right-4 z-10">{actions}</div>
        )}
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-xl z-20 flex items-center justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        {children}
      </div>
    );
  }
);

AdvancedCard.displayName = 'AdvancedCard';

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, icon, action, children, ...props }, ref) => {
    if (children) {
      return (
        <div ref={ref} className={cn('flex flex-col space-y-1.5', className)} {...props}>
          {children}
        </div>
      );
    }
    
    return (
      <div ref={ref} className={cn('flex items-start justify-between', className)} {...props}>
        <div className="flex items-start space-x-3">
          {icon && <div className="mt-0.5">{icon}</div>}
          <div className="space-y-1">
            {title && <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {action && <div>{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Content Component
export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
));

CardContent.displayName = 'CardContent';

// Card Footer Component
export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t', className)}
    {...props}
  />
));

CardFooter.displayName = 'CardFooter';

// Metric Card Component
interface MetricCardProps extends AdvancedCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  trend?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  icon,
  trend,
  className,
  ...props
}) => {
  return (
    <AdvancedCard className={cn('relative overflow-hidden', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {change && (
              <span
                className={cn(
                  'text-sm font-medium',
                  change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                )}
              >
                {change.type === 'increase' ? '+' : '-'}{Math.abs(change.value)}%
              </span>
            )}
          </div>
          {trend && <div className="mt-2">{trend}</div>}
        </div>
        {icon && (
          <div className="p-3 bg-primary/10 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </AdvancedCard>
  );
};

// Interactive Card Component
interface InteractiveCardProps extends AdvancedCardProps {
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  linkText?: string;
  onClick?: () => void;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  title,
  description,
  image,
  tags,
  linkText = 'View Details',
  onClick,
  className,
  ...props
}) => {
  return (
    <AdvancedCard
      variant="interactive"
      className={cn('group cursor-pointer', className)}
      onClick={onClick}
      {...props}
    >
      {image && (
        <div className="relative h-48 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-xl">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      )}
      
      <div className="space-y-3">
        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
          {title}
        </h3>
        
        {description && (
          <p className="text-muted-foreground line-clamp-2">{description}</p>
        )}
        
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs font-medium bg-secondary rounded-md"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="flex items-center text-primary font-medium">
          <span>{linkText}</span>
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </AdvancedCard>
  );
};

// Skeleton Card Component
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <AdvancedCard className={cn('animate-pulse', className)}>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    </AdvancedCard>
  );
};

export { AdvancedCard, cardVariants };