// Advanced Button Component with 2025 Design Patterns
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden touch-target',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm hover:shadow-md',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80',
        outline: 'border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]',
        glass: 'glass-morphism border border-white/20 hover:bg-white/10 active:bg-white/5',
        neumorphic: 'neumorphism hover:shadow-inner active:shadow-none',
        floating: 'shadow-xl hover:shadow-2xl transform hover:-translate-y-1 active:translate-y-0',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-md gap-1',
        sm: 'h-9 px-3 text-sm rounded-md gap-1.5',
        default: 'h-10 px-4 text-base rounded-md gap-2',
        lg: 'h-12 px-6 text-lg rounded-lg gap-2',
        xl: 'h-14 px-8 text-xl rounded-lg gap-3',
        icon: 'h-10 w-10 rounded-md p-0',
        iconSm: 'h-8 w-8 rounded-md p-0',
        iconLg: 'h-12 w-12 rounded-lg p-0',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-sm',
        md: 'rounded-md',
        lg: 'rounded-lg',
        xl: 'rounded-xl',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
      rounded: 'md',
    },
  }
);

// Ripple effect component
const Ripple: React.FC<{ color?: string }> = ({ color = 'rgba(255, 255, 255, 0.5)' }) => {
  const [ripples, setRipples] = React.useState<Array<{ x: number; y: number; size: number; id: number }>>([]);
  
  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    const rippleContainer = event.currentTarget;
    const rect = rippleContainer.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const newRipple = { x, y, size, id: Date.now() };
    
    setRipples((prevRipples) => [...prevRipples, newRipple]);
    
    setTimeout(() => {
      setRipples((prevRipples) => prevRipples.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);
  };
  
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-inherit"
      onMouseDown={addRipple}
    >
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            background: color,
            animation: 'ripple 0.6s ease-out',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          from {
            transform: scale(0);
            opacity: 1;
          }
          to {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export interface AdvancedButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  ripple?: boolean;
  rippleColor?: string;
  pulse?: boolean;
  tooltip?: string;
}

const AdvancedButton = React.forwardRef<HTMLButtonElement, AdvancedButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      rounded,
      asChild = false,
      loading = false,
      success = false,
      error = false,
      icon,
      iconPosition = 'left',
      ripple = true,
      rippleColor,
      pulse = false,
      tooltip,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const isDisabled = disabled || loading;
    
    // Determine which icon to show
    let displayIcon = icon;
    if (loading) {
      displayIcon = <Loader2 className="animate-spin" />;
    } else if (success) {
      displayIcon = <Check className="text-green-500" />;
    } else if (error) {
      displayIcon = <X className="text-red-500" />;
    }
    
    const buttonContent = (
      <>
        {ripple && variant !== 'link' && <Ripple color={rippleColor} />}
        <span className="relative z-10 flex items-center justify-center gap-2">
          {displayIcon && iconPosition === 'left' && (
            <span className="inline-flex shrink-0">{displayIcon}</span>
          )}
          {children}
          {displayIcon && iconPosition === 'right' && (
            <span className="inline-flex shrink-0">{displayIcon}</span>
          )}
          {variant === 'link' && <ArrowRight className="ml-1 h-4 w-4" />}
        </span>
        {pulse && !isDisabled && (
          <span className="absolute inset-0 -z-10 animate-pulse-soft rounded-inherit bg-current opacity-10" />
        )}
      </>
    );
    
    const button = (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, rounded, className }),
          pulse && !isDisabled && 'animate-pulse-soft'
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
    
    if (tooltip) {
      return (
        <div className="relative inline-flex group">
          {button}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {tooltip}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
          </div>
        </div>
      );
    }
    
    return button;
  }
);

AdvancedButton.displayName = 'AdvancedButton';

// Button Group Component
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>*:not(:first-child)]:rounded-l-none [&>*:not(:last-child)]:rounded-r-none',
        orientation === 'horizontal'
          ? '[&>*:not(:first-child)]:-ml-px'
          : '[&>*:not(:first-child)]:-mt-px',
        className
      )}
    >
      {children}
    </div>
  );
};

// Floating Action Button
interface FABProps extends AdvancedButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FAB: React.FC<FABProps> = ({
  position = 'bottom-right',
  className,
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };
  
  return (
    <AdvancedButton
      variant="floating"
      size="iconLg"
      rounded="full"
      className={cn('fixed z-50', positionClasses[position], className)}
      {...props}
    />
  );
};

export { AdvancedButton, buttonVariants };