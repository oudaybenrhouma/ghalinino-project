/**
 * VolumeDiscounts Component
 * Display volume discount tiers for wholesale users
 */

import { useAuthContext } from '@/contexts/AuthContext';
import { useLanguage } from '@/hooks';
import { formatPrice } from '@/lib/utils';
import { getVolumeDiscounts, canSeeWholesalePrices } from '@/lib/wholesaleValidation';
import { cn } from '@/lib/utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface VolumeDiscountsProps {
  productId?: string;
  basePrice: number; // Price per unit in millimes
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function VolumeDiscounts({
  productId,
  basePrice,
  className,
}: VolumeDiscountsProps) {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  
  const wholesaleStatus = user?.wholesaleStatus;
  const showDiscounts = canSeeWholesalePrices(wholesaleStatus);

  // Don't show to retail users
  if (!showDiscounts) {
    return null;
  }

  const discounts = getVolumeDiscounts(productId);

  // Don't render if no discounts available
  if (discounts.length === 0) {
    return null;
  }

  const t = (ar: string, fr: string) => (language === 'ar' ? ar : fr);

  return (
    <div className={cn('bg-green-50 border border-green-200 rounded-lg p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h4 className="font-semibold text-green-900">
          {t('خصومات الكمية', 'Remises sur volume')}
        </h4>
      </div>

      <p className="text-sm text-green-700 mb-3">
        {t('اشتر بالجملة ووفر أكثر', 'Achetez en gros et économisez plus')}
      </p>

      <div className="grid gap-2">
        {discounts.map((discount, index) => {
          const discountedPrice = Math.round(
            basePrice * (1 - discount.discountPercentage / 100)
          );
          const savings = basePrice - discountedPrice;

          return (
            <div
              key={index}
              className="flex items-center justify-between bg-white rounded-md p-2 border border-green-100"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-green-900">
                  {discount.quantity}+ {t('وحدة', 'unités')}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  -{discount.discountPercentage}%
                </span>
              </div>
              <div className="text-end">
                <p className="font-semibold text-green-700">
                  {formatPrice(discountedPrice, language)}
                  <span className="text-xs text-green-600 font-normal">
                    /{t('وحدة', 'unité')}
                  </span>
                </p>
                <p className="text-xs text-green-600">
                  {t('وفر', 'Économisez')} {formatPrice(savings, language)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-green-600 mt-3 flex items-start gap-1">
        <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>
          {t(
            'الخصومات تطبق تلقائياً عند إضافة الكمية المطلوبة',
            'Les remises s\'appliquent automatiquement en ajoutant la quantité requise'
          )}
        </span>
      </p>
    </div>
  );
}

/**
 * Compact version for product cards (shows only best discount)
 */
export function VolumeDiscountBadge({ productId, basePrice }: Omit<VolumeDiscountsProps, 'className'>) {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  
  const wholesaleStatus = user?.wholesaleStatus;
  const showDiscounts = canSeeWholesalePrices(wholesaleStatus);

  if (!showDiscounts) return null;

  const discounts = getVolumeDiscounts(productId);
  if (discounts.length === 0) return null;

  // Show the best (highest) discount
  const bestDiscount = discounts[discounts.length - 1];

  const t = (ar: string, fr: string) => (language === 'ar' ? ar : fr);

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
          clipRule="evenodd"
        />
      </svg>
      {t('خصم حتى', 'Jusqu\'à')} {bestDiscount.discountPercentage}%
    </div>
  );
}