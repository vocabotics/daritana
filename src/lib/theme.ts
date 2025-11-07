// Daritana Theme System - 2025 Architecture Platform
// Advanced theme configuration with design tokens and utilities

export const themes = {
  light: {
    name: 'Light',
    class: '',
    colors: {
      background: 'hsl(252, 252, 251)',
      foreground: 'hsl(15, 15, 20)',
      card: 'hsl(255, 255, 255)',
      cardForeground: 'hsl(15, 15, 20)',
      popover: 'hsl(255, 255, 255)',
      popoverForeground: 'hsl(15, 15, 20)',
      primary: 'hsl(41, 98, 255)',
      primaryForeground: 'hsl(255, 255, 255)',
      secondary: 'hsl(243, 244, 246)',
      secondaryForeground: 'hsl(15, 15, 20)',
      muted: 'hsl(243, 244, 246)',
      mutedForeground: 'hsl(107, 114, 128)',
      accent: 'hsl(99, 102, 241)',
      accentForeground: 'hsl(255, 255, 255)',
      destructive: 'hsl(239, 68, 68)',
      destructiveForeground: 'hsl(255, 255, 255)',
      border: 'hsl(229, 231, 235)',
      input: 'hsl(229, 231, 235)',
      ring: 'hsl(41, 98, 255)',
    },
  },
  dark: {
    name: 'Dark',
    class: 'dark',
    colors: {
      background: 'hsl(15, 15, 20)',
      foreground: 'hsl(245, 245, 244)',
      card: 'hsl(23, 23, 30)',
      cardForeground: 'hsl(245, 245, 244)',
      popover: 'hsl(23, 23, 30)',
      popoverForeground: 'hsl(245, 245, 244)',
      primary: 'hsl(59, 130, 246)',
      primaryForeground: 'hsl(255, 255, 255)',
      secondary: 'hsl(39, 39, 46)',
      secondaryForeground: 'hsl(245, 245, 244)',
      muted: 'hsl(39, 39, 46)',
      mutedForeground: 'hsl(161, 161, 170)',
      accent: 'hsl(99, 102, 241)',
      accentForeground: 'hsl(255, 255, 255)',
      destructive: 'hsl(239, 68, 68)',
      destructiveForeground: 'hsl(255, 255, 255)',
      border: 'hsl(39, 39, 46)',
      input: 'hsl(39, 39, 46)',
      ring: 'hsl(59, 130, 246)',
    },
  },
  blueprint: {
    name: 'Blueprint',
    class: 'theme-blueprint',
    colors: {
      background: 'hsl(6, 25, 40)',
      foreground: 'hsl(173, 216, 230)',
      card: 'hsl(10, 35, 55)',
      cardForeground: 'hsl(173, 216, 230)',
      primary: 'hsl(0, 191, 255)',
      primaryForeground: 'hsl(6, 25, 40)',
      secondary: 'hsl(15, 45, 65)',
      border: 'hsl(30, 60, 80)',
      accent: 'hsl(0, 255, 255)',
    },
  },
};

// Design Tokens
export const designTokens = {
  // Spacing Scale (in rem)
  spacing: {
    px: '1px',
    0: '0',
    1: '0.25rem', // 4px
    2: '0.5rem', // 8px
    3: '0.75rem', // 12px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    32: '8rem', // 128px
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Plus Jakarta Sans', 'Noto Sans SC', 'Noto Sans Tamil', 'system-ui', 'sans-serif'],
      mono: ['DM Mono', 'Courier New', 'monospace'],
      display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
    },
    fontSize: {
      xs: '0.75rem', // 12px
      sm: '0.875rem', // 14px
      base: '1rem', // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem', // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
      '5xl': '3rem', // 48px
      '6xl': '3.75rem', // 60px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.1,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
  },
  
  // Border Radius
  borderRadius: {
    none: '0',
    sm: '0.125rem', // 2px
    base: '0.375rem', // 6px
    md: '0.5rem', // 8px
    lg: '0.75rem', // 12px
    xl: '1rem', // 16px
    '2xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },
  
  // Animation
  animation: {
    duration: {
      instant: '50ms',
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
      slower: '500ms',
      slowest: '750ms',
    },
    timing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeBounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Z-Index Scale
  zIndex: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
  },
  
  // Breakpoints
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Accessibility Utilities
export const a11y = {
  // Focus visible styles
  focusRing: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
  
  // Screen reader only
  srOnly: 'absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0',
  
  // Not screen reader only
  notSrOnly: 'static w-auto h-auto p-0 m-0 overflow-visible whitespace-normal',
  
  // Reduced motion
  reducedMotion: 'motion-reduce:transition-none motion-reduce:transform-none',
  
  // High contrast
  highContrast: 'contrast-more:border-current contrast-more:border-2',
  
  // Focus trap regions
  focusTrap: 'focus-trap focus-trap-active',
  
  // Skip links
  skipLink: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4',
};

// Component Variants
export const componentVariants = {
  button: {
    base: 'inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-accent/80',
        link: 'text-primary underline-offset-4 hover:underline',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      },
      size: {
        xs: 'h-7 px-2 text-xs rounded-md',
        sm: 'h-9 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-base rounded-md',
        lg: 'h-12 px-6 text-lg rounded-lg',
        xl: 'h-14 px-8 text-xl rounded-lg',
        icon: 'h-10 w-10 rounded-md',
      },
    },
  },
  
  card: {
    base: 'rounded-xl border bg-card text-card-foreground',
    variants: {
      variant: {
        default: 'shadow-sm',
        elevated: 'shadow-lg',
        outline: 'shadow-none',
        ghost: 'border-0 shadow-none',
      },
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
  },
  
  input: {
    base: 'flex w-full rounded-md border border-input bg-background text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
    variants: {
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-10 px-4 text-base',
        lg: 'h-12 px-4 text-lg',
      },
    },
  },
};

// Utility Functions
export const utils = {
  // Generate class names
  cn: (...classes: (string | undefined | null | false)[]) => {
    return classes.filter(Boolean).join(' ');
  },
  
  // Get current theme
  getCurrentTheme: () => {
    if (typeof window === 'undefined') return 'light';
    return localStorage.getItem('theme') || 'light';
  },
  
  // Set theme
  setTheme: (theme: keyof typeof themes) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const themeConfig = themes[theme];
    
    // Remove all theme classes
    Object.values(themes).forEach(t => {
      if (t.class) root.classList.remove(t.class);
    });
    
    // Add new theme class
    if (themeConfig.class) {
      root.classList.add(themeConfig.class);
    }
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    
    // Dispatch theme change event
    window.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  },
  
  // Get responsive value
  getResponsiveValue: <T>(values: { xs?: T; sm?: T; md?: T; lg?: T; xl?: T; '2xl'?: T }, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    
    const width = window.innerWidth;
    const breakpoints = designTokens.breakpoints;
    
    if (width >= parseInt(breakpoints['2xl']) && values['2xl']) return values['2xl'];
    if (width >= parseInt(breakpoints.xl) && values.xl) return values.xl;
    if (width >= parseInt(breakpoints.lg) && values.lg) return values.lg;
    if (width >= parseInt(breakpoints.md) && values.md) return values.md;
    if (width >= parseInt(breakpoints.sm) && values.sm) return values.sm;
    if (values.xs) return values.xs;
    
    return defaultValue;
  },
  
  // Check if device has touch
  hasTouch: () => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
  
  // Check if reduced motion is preferred
  prefersReducedMotion: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Check if high contrast is preferred
  prefersHighContrast: () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  // Format for Malaysian locale
  formatMalaysian: {
    currency: (amount: number) => {
      return new Intl.NumberFormat('ms-MY', {
        style: 'currency',
        currency: 'MYR',
      }).format(amount);
    },
    date: (date: Date) => {
      return new Intl.DateTimeFormat('ms-MY', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(date);
    },
    number: (num: number) => {
      return new Intl.NumberFormat('ms-MY').format(num);
    },
  },
};

export default {
  themes,
  designTokens,
  a11y,
  componentVariants,
  utils,
};