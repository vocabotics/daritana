import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import bmTranslations from './locales/bm.json';
import zhTranslations from './locales/zh.json';

const resources = {
  en: {
    translation: enTranslations
  },
  bm: {
    translation: bmTranslations
  },
  zh: {
    translation: zhTranslations
  }
};

// Define supported languages for Malaysia
export const supportedLanguages = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr' as const
  },
  {
    code: 'bm',
    name: 'Bahasa Malaysia',
    nativeName: 'Bahasa Malaysia',
    flag: '🇲🇾',
    dir: 'ltr' as const
  },
  {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    dir: 'ltr' as const
  }
  // Future RTL language support prepared:
  // { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  // { code: 'he', name: 'Hebrew', nativeName: 'עברית', flag: '🇮🇱', dir: 'rtl' }
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'daritana-language',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // Namespace handling
    defaultNS: 'translation',
    
    // Key separator
    keySeparator: '.',
    
    // Plural handling
    pluralSeparator: '_',
    
    // Context separator
    contextSeparator: '_',

    // Malaysian specific settings
    lng: 'en', // Default to English for Malaysian users
    supportedLngs: ['en', 'bm', 'zh'],
    
    // Load translations
    load: 'languageOnly',
    
    // React specific
    react: {
      useSuspense: false,
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'em', 'span']
    }
  });

export default i18n;