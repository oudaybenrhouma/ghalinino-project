/**
 * Language Toggle Component
 * Switch between Arabic and French
 */

import { useLanguage } from '@/hooks/useLanguage';
import { cn } from '@/lib/utils';

export function LanguageToggle() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-sm font-medium',
        'bg-slate-100 hover:bg-slate-200',
        'transition-colors duration-200',
        'focus:outline-none focus:ring-2 focus:ring-slate-400'
      )}
      aria-label={language === 'ar' ? 'Switch to French' : 'Passer en arabe'}
    >
      <span className={cn(
        'transition-all duration-200',
        language === 'ar' ? 'font-bold text-red-600' : 'text-slate-500'
      )}>
        عربي
      </span>
      <span className="text-slate-300">|</span>
      <span className={cn(
        'transition-all duration-200',
        language === 'fr' ? 'font-bold text-red-600' : 'text-slate-500'
      )}>
        FR
      </span>
    </button>
  );
}
