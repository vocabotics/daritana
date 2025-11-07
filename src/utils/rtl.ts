/**
 * RTL (Right-to-Left) Support Utilities
 * Preparation for future RTL language support (Arabic, Hebrew, etc.)
 */

import { useLanguageStore } from '@/store/languageStore';

/**
 * Hook to get RTL-aware directional styles
 */
export function useRTL() {
  const { isRTL } = useLanguageStore();
  
  return {
    isRTL,
    dir: isRTL ? 'rtl' : 'ltr',
    textAlign: isRTL ? 'right' as const : 'left' as const,
    
    // Directional margin utilities
    marginStart: (value: string | number) => ({
      [isRTL ? 'marginRight' : 'marginLeft']: value
    }),
    marginEnd: (value: string | number) => ({
      [isRTL ? 'marginLeft' : 'marginRight']: value
    }),
    
    // Directional padding utilities
    paddingStart: (value: string | number) => ({
      [isRTL ? 'paddingRight' : 'paddingLeft']: value
    }),
    paddingEnd: (value: string | number) => ({
      [isRTL ? 'paddingLeft' : 'paddingRight']: value
    }),
    
    // Position utilities
    start: (value: string | number) => ({
      [isRTL ? 'right' : 'left']: value
    }),
    end: (value: string | number) => ({
      [isRTL ? 'left' : 'right']: value
    }),
    
    // Transform utilities
    translateX: (value: number) => ({
      transform: `translateX(${isRTL ? -value : value}px)`
    }),
    
    // Border utilities
    borderStart: (width: string, style?: string, color?: string) => ({
      [isRTL ? 'borderRight' : 'borderLeft']: `${width} ${style || 'solid'} ${color || 'currentColor'}`
    }),
    borderEnd: (width: string, style?: string, color?: string) => ({
      [isRTL ? 'borderLeft' : 'borderRight']: `${width} ${style || 'solid'} ${color || 'currentColor'}`
    })
  };
}

/**
 * RTL-aware className utilities
 */
export const rtlClasses = {
  // Text alignment
  textStart: 'text-start',
  textEnd: 'text-end',
  
  // Margin utilities
  ms: (value: number) => `ms-${value}`, // margin-start
  me: (value: number) => `me-${value}`, // margin-end
  
  // Padding utilities
  ps: (value: number) => `ps-${value}`, // padding-start
  pe: (value: number) => `pe-${value}`, // padding-end
  
  // Position utilities
  start: (value: number) => `start-${value}`,
  end: (value: number) => `end-${value}`,
  
  // Border utilities
  borderS: 'border-s',
  borderE: 'border-e',
  
  // Rounded corners
  roundedS: 'rounded-s',
  roundedE: 'rounded-e',
  roundedSS: 'rounded-ss', // start-start
  roundedSE: 'rounded-se', // start-end
  roundedES: 'rounded-es', // end-start
  roundedEE: 'rounded-ee', // end-end
};

/**
 * Get RTL-aware icon rotation
 * Some icons need to be flipped in RTL mode
 */
export function getIconRotation(iconName: string, isRTL: boolean): string {
  const iconsToFlip = [
    'arrow-right',
    'arrow-left',
    'chevron-right',
    'chevron-left',
    'arrow-up-right',
    'arrow-down-left',
    'log-out',
    'log-in',
    'send',
    'reply',
    'forward'
  ];
  
  if (isRTL && iconsToFlip.includes(iconName.toLowerCase())) {
    return 'scale(-1, 1)';
  }
  
  return '';
}

/**
 * Format number for RTL languages
 * Arabic and Persian use different number systems
 */
export function formatNumberRTL(num: number | string, lang: string): string {
  if (lang === 'ar') {
    // Arabic-Indic numerals
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return String(num).replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit)]);
  }
  
  if (lang === 'fa') {
    // Persian numerals
    const persianNumerals = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).replace(/[0-9]/g, (digit) => persianNumerals[parseInt(digit)]);
  }
  
  return String(num);
}

/**
 * RTL-aware animation directions
 */
export const rtlAnimations = {
  slideInStart: (isRTL: boolean) => ({
    initial: { x: isRTL ? 100 : -100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: isRTL ? -100 : 100, opacity: 0 }
  }),
  
  slideInEnd: (isRTL: boolean) => ({
    initial: { x: isRTL ? -100 : 100, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: isRTL ? 100 : -100, opacity: 0 }
  }),
  
  fadeInStart: (isRTL: boolean) => ({
    initial: { x: isRTL ? 20 : -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: isRTL ? -20 : 20, opacity: 0 }
  })
};