/**
 * Design System Tokens - 2025 Architecture Platform
 * Core design tokens for consistent UI across all components
 */

// Color System - Supporting both light and dark themes with architect-focused palette
export const colors = {
  // Primary Colors - Professional blue-gray palette
  primary: {
    50: '#f0f4f8',
    100: '#d9e2ec',
    200: '#bcccdc',
    300: '#9fb3c8',
    400: '#829ab1',
    500: '#627d98', // Main brand color
    600: '#486581',
    700: '#334e68',
    800: '#243b53',
    900: '#102a43',
  },
  
  // Accent Colors - Warm earth tones for highlights
  accent: {
    50: '#fef6e7',
    100: '#fce8c3',
    200: '#fad89b',
    300: '#f7c873',
    400: '#f4b84b',
    500: '#f1a823', // Main accent
    600: '#d89207',
    700: '#b87c00',
    800: '#986600',
    900: '#785000',
  },
  
  // Neutral Colors - Clean grays for UI elements
  neutral: {
    0: '#ffffff',
    50: '#fafbfc',
    100: '#f5f7fa',
    200: '#e9ecef',
    300: '#dee2e6',
    400: '#ced4da',
    500: '#adb5bd',
    600: '#868e96',
    700: '#495057',
    800: '#343a40',
    900: '#212529',
    950: '#0a0c0e',
  },
  
  // Semantic Colors
  success: {
    light: '#4ade80',
    main: '#22c55e',
    dark: '#15803d',
    contrast: '#ffffff',
  },
  warning: {
    light: '#fbbf24',
    main: '#f59e0b',
    dark: '#d97706',
    contrast: '#ffffff',
  },
  error: {
    light: '#f87171',
    main: '#ef4444',
    dark: '#dc2626',
    contrast: '#ffffff',
  },
  info: {
    light: '#60a5fa',
    main: '#3b82f6',
    dark: '#2563eb',
    contrast: '#ffffff',
  },
  
  // Role-based Colors
  roles: {
    client: '#8b5cf6',
    staff: '#3b82f6',
    contractor: '#f59e0b',
    projectLead: '#10b981',
    designer: '#ec4899',
  },
  
  // Category Colors for Tasks/Timeline
  categories: {
    design: '#8b5cf6',
    engineering: '#3b82f6',
    client: '#10b981',
    management: '#f59e0b',
    construction: '#ef4444',
  },
};

// Typography System - Clean, professional fonts
export const typography = {
  // Font Families
  fontFamily: {
    sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    display: '"Plus Jakarta Sans", Inter, sans-serif',
    mono: '"JetBrains Mono", "SF Mono", Monaco, monospace',
  },
  
  // Font Sizes - Fluid typography for responsive design
  fontSize: {
    xs: 'clamp(0.75rem, 2vw, 0.875rem)',
    sm: 'clamp(0.875rem, 2.5vw, 1rem)',
    base: 'clamp(1rem, 3vw, 1.125rem)',
    lg: 'clamp(1.125rem, 3.5vw, 1.25rem)',
    xl: 'clamp(1.25rem, 4vw, 1.5rem)',
    '2xl': 'clamp(1.5rem, 5vw, 1.875rem)',
    '3xl': 'clamp(1.875rem, 6vw, 2.25rem)',
    '4xl': 'clamp(2.25rem, 7vw, 3rem)',
    '5xl': 'clamp(3rem, 8vw, 3.75rem)',
  },
  
  // Font Weights
  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// Spacing System - 8px grid for consistency
export const spacing = {
  0: '0',
  px: '1px',
  0.5: '0.125rem', // 2px
  1: '0.25rem',    // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
};

// Border Radius - Subtle curves for modern look
export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  DEFAULT: '0.25rem', // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

// Shadows - Layered elevation system
export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  DEFAULT: '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Elevation shadows for cards and modals
  elevation: {
    1: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    2: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    3: '0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)',
    4: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
    5: '0 19px 38px rgba(0, 0, 0, 0.30), 0 15px 12px rgba(0, 0, 0, 0.22)',
  },
};

// Animation & Transitions
export const animation = {
  // Durations
  duration: {
    instant: '0ms',
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
    slower: '500ms',
    slowest: '1000ms',
  },
  
  // Easing Functions
  easing: {
    linear: 'linear',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
  
  // Predefined animations
  keyframes: {
    fadeIn: {
      '0%': { opacity: '0' },
      '100%': { opacity: '1' },
    },
    fadeOut: {
      '0%': { opacity: '1' },
      '100%': { opacity: '0' },
    },
    slideInUp: {
      '0%': { transform: 'translateY(100%)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideInDown: {
      '0%': { transform: 'translateY(-100%)', opacity: '0' },
      '100%': { transform: 'translateY(0)', opacity: '1' },
    },
    slideInLeft: {
      '0%': { transform: 'translateX(-100%)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    slideInRight: {
      '0%': { transform: 'translateX(100%)', opacity: '0' },
      '100%': { transform: 'translateX(0)', opacity: '1' },
    },
    pulse: {
      '0%, 100%': { opacity: '1' },
      '50%': { opacity: '0.5' },
    },
    bounce: {
      '0%, 100%': { transform: 'translateY(0)' },
      '50%': { transform: 'translateY(-10px)' },
    },
    shimmer: {
      '0%': { backgroundPosition: '-200% 0' },
      '100%': { backgroundPosition: '200% 0' },
    },
  },
};

// Breakpoints for responsive design
export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
  '4xl': '2560px',
};

// Z-index scale for layering
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
  notification: 1600,
};

// Grid System
export const grid = {
  columns: {
    mobile: 4,
    tablet: 8,
    desktop: 12,
    wide: 16,
  },
  gap: {
    mobile: '16px',
    tablet: '24px',
    desktop: '32px',
    wide: '40px',
  },
  margin: {
    mobile: '16px',
    tablet: '32px',
    desktop: '64px',
    wide: '80px',
  },
};

// Accessibility tokens
export const accessibility = {
  focusRing: {
    width: '2px',
    style: 'solid',
    color: colors.primary[500],
    offset: '2px',
  },
  contrast: {
    AA: 4.5,
    AAA: 7,
    largeText: {
      AA: 3,
      AAA: 4.5,
    },
  },
  motion: {
    reduce: '@media (prefers-reduced-motion: reduce)',
    normal: '@media (prefers-reduced-motion: no-preference)',
  },
};