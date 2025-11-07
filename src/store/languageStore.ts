import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/i18n';
import { supportedLanguages } from '@/i18n';

interface LanguageStore {
  currentLanguage: string;
  isRTL: boolean;
  
  // Actions
  setLanguage: (language: string) => void;
  toggleLanguage: () => void;
  getCurrentLanguageInfo: () => typeof supportedLanguages[0] | undefined;
  
  // Helper methods
  isLanguageSupported: (lang: string) => boolean;
  getLanguageDirection: (lang: string) => 'ltr' | 'rtl';
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      currentLanguage: 'en',
      isRTL: false,

      setLanguage: (language: string) => {
        if (get().isLanguageSupported(language)) {
          // Update i18next
          i18n.changeLanguage(language);
          
          // Update document language attribute
          document.documentElement.lang = language;
          
          // Update text direction
          const direction = get().getLanguageDirection(language);
          document.documentElement.dir = direction;
          
          set({
            currentLanguage: language,
            isRTL: direction === 'rtl'
          });
          
          // Update page title based on language
          const pageTitle = {
            en: 'Daritana - Architecture Project Management',
            bm: 'Daritana - Pengurusan Projek Seni Bina',
            zh: 'Daritana - 建筑项目管理系统'
          };
          document.title = pageTitle[language as keyof typeof pageTitle] || pageTitle.en;
        }
      },

      toggleLanguage: () => {
        const current = get().currentLanguage;
        const languages = supportedLanguages.map(l => l.code);
        const currentIndex = languages.indexOf(current);
        const nextIndex = (currentIndex + 1) % languages.length;
        get().setLanguage(languages[nextIndex]);
      },

      getCurrentLanguageInfo: () => {
        const current = get().currentLanguage;
        return supportedLanguages.find(lang => lang.code === current);
      },

      isLanguageSupported: (lang: string) => {
        return supportedLanguages.some(supported => supported.code === lang);
      },

      getLanguageDirection: (lang: string) => {
        // RTL language support preparation
        const rtlLanguages = ['ar', 'he', 'fa', 'ur']; // Arabic, Hebrew, Persian, Urdu
        
        // Currently all our supported languages are LTR
        // When RTL languages are added, they will automatically be detected
        if (rtlLanguages.includes(lang)) {
          return 'rtl';
        }
        
        return 'ltr';
      }
    }),
    {
      name: 'daritana-language-store',
      // Only persist the language, not computed values
      partialize: (state) => ({ 
        currentLanguage: state.currentLanguage 
      }),
      // Restore RTL state on load
      onRehydrateStorage: () => (state) => {
        if (state) {
          const direction = state.getLanguageDirection(state.currentLanguage);
          state.isRTL = direction === 'rtl';
          document.documentElement.dir = direction;
          document.documentElement.lang = state.currentLanguage;
        }
      }
    }
  )
);