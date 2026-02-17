/**
 * MinimumOrderProgress Component
 * Shows progress towards wholesale minimum order value
 */

import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks';
import { formatPrice } from '@/lib/utils';
import { getMinimumOrderProgress, canSeeWholesalePrices } from '@/lib/wholesaleValidation';
import { cn } from '@/lib/utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface MinimumOrderProgressProps {
  currentTotal: number; // Cart total in TND
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function MinimumOrderProgress({
  currentTotal,
  className,
}: MinimumOrderProgressProps) {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  
  const wholesaleStatus = user?.wholesaleStatus;
  const isWholesale = canSeeWholesalePrices(wholesaleStatus);

  // Don't show for retail users
  if (!isWholesale) {
    return null;
  }

  const progress = getMinimumOrderProgress(currentTotal, isWholesale);
  const t = (ar: string, fr: string) => (language === 'ar' ? ar : fr);

  return (
    <div className={cn('bg-blue-50 border border-blue-200 rounded-lg p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-medium text-blue-900">
            {t('الحد الأدنى للطلب', 'Commande minimum')}
          </span>
        </div>
        <span className="text-sm font-semibold text-blue-700">
          {progress.percentage.toFixed(0)}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="relative w-full h-3 bg-blue-100 rounded-full overflow-hidden mb-2">
        <div
          className={cn(
            'absolute left-0 top-0 h-full rounded-full transition-all duration-300',
            progress.isMet ? 'bg-green-500' : 'bg-blue-500'
          )}
          style={{ width: `${Math.min(progress.percentage, 100)}%` }}
        />
      </div>

      {/* Status Message */}
      {progress.isMet ? (
        <p className="text-sm text-green-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {t('تم الوصول للحد الأدنى', 'Minimum atteint')} ✓
        </p>
      ) : (
        <p className="text-sm text-blue-700">
          {t('أضف', 'Ajoutez encore')}{' '}
          <span className="font-semibold">
            {formatPrice(progress.amountRemaining, language)}
          </span>{' '}
          {t('للوصول للحد الأدنى', 'pour atteindre le minimum')}
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for cart badge/tooltip
 */
export function MinimumOrderBadge({ currentTotal }: MinimumOrderProgressProps) {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  
  const wholesaleStatus = user?.wholesaleStatus;
  const isWholesale = canSeeWholesalePrices(wholesaleStatus);

  if (!isWholesale) return null;

  const progress = getMinimumOrderProgress(currentTotal, isWholesale);

  if (progress.isMet) return null; // Only show if not met

  const t = (ar: string, fr: string) => (language === 'ar' ? ar : fr);

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {formatPrice(progress.amountRemaining, language)} {t('متبقي', 'restant')}
    </div>
  );
}