/**
 * Language Hook
 * Manages Arabic/French bilingual support
 */

import { useCallback } from 'react';
import { useStore } from '@/store';
import type { Language, Translation } from '@/types';
import { translations } from '@/lib/i18n';
import { setLanguage } from '@/lib/i18n';

type TranslationSection = keyof typeof translations;
type TranslationKey<S extends TranslationSection> = keyof (typeof translations)[S];

export function useLanguage() {
  const { language, setLanguage: setStoreLanguage } = useStore();

  const toggleLanguage = useCallback(() => {
    const newLanguage: Language = language === 'ar' ? 'fr' : 'ar';
    setStoreLanguage(newLanguage);
    setLanguage(newLanguage);
  }, [language, setStoreLanguage]);

  const changeLanguage = useCallback((newLanguage: Language) => {
    setStoreLanguage(newLanguage);
    setLanguage(newLanguage);
  }, [setStoreLanguage]);

  const t = useCallback(
    <S extends TranslationSection>(
      section: S,
      key: TranslationKey<S>
    ): string => {
      const translation = translations[section][key] as Translation;
      return translation[language];
    },
    [language]
  );

  const getLocalized = useCallback(
    (ar: string, fr: string): string => {
      return language === 'ar' ? ar : fr;
    },
    [language]
  );

  const isRTL = language === 'ar';

  return {
    language,
    isRTL,
    toggleLanguage,
    changeLanguage,
    t,
    getLocalized,
  };
}
