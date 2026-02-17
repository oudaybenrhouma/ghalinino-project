/**
 * ProductPrice Component
 * Handles dual pricing display for retail vs wholesale
 */

import { useAuthContext } from '@/contexts/AuthContext';
import { formatPrice } from '@/lib/utils';
import { canSeeWholesalePrices, isPendingWholesaleApproval } from '@/lib/wholesaleValidation';
import { useLanguage } from '@/hooks';
import { cn } from '@/lib/utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface ProductPriceProps {
  price: number; // Retail price in TND
  wholesalePrice?: number | null; // Wholesale price in TND
  compareAtPrice?: number | null; // Original price (for sales)
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSavings?: boolean;
  className?: string;
}

// ============================================
// COMPONENT
// ============================================

export function ProductPrice({
  price,
  wholesalePrice,
  compareAtPrice,
  size = 'md',
  showSavings = true,
  className,
}: ProductPriceProps) {
  const { user } = useAuthContext();
  const { language } = useLanguage();
  
  const wholesaleStatus = user?.wholesaleStatus;
  const showWholesale = canSeeWholesalePrices(wholesaleStatus);
  const isPending = isPendingWholesaleApproval(wholesaleStatus);

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
    xl: 'text-3xl',
  };

  const secondarySizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  // Calculate savings
  const displayPrice = showWholesale && wholesalePrice ? wholesalePrice : price;
  const originalPrice = compareAtPrice || (showWholesale && wholesalePrice ? price : null);
  const savingsAmount = originalPrice ? originalPrice - displayPrice : 0;
  const savingsPercentage = originalPrice
    ? Math.round((savingsAmount / originalPrice) * 100)
    : 0;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {/* Main Price */}
      <div className="flex items-baseline gap-2 flex-wrap">
        <span
          className={cn(
            'font-bold',
            sizeClasses[size],
            showWholesale && wholesalePrice ? 'text-green-600' : 'text-slate-900'
          )}
        >
          {formatPrice(displayPrice, language)}
        </span>

        {/* Original/Retail Price (strikethrough) */}
        {originalPrice && (
          <span
            className={cn(
              'line-through text-slate-400',
              secondarySizeClasses[size]
            )}
          >
            {formatPrice(originalPrice, language)}
          </span>
        )}

        {/* Savings Badge */}
        {showSavings && savingsPercentage > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            -{savingsPercentage}%
          </span>
        )}
      </div>

      {/* Wholesale Status Messages */}
      {isPending && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {language === 'ar'
            ? 'أسعار الجملة بعد الموافقة'
            : 'Prix gros après approbation'}
        </p>
      )}

      {showWholesale && wholesalePrice && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {language === 'ar' ? 'سعر الجملة' : 'Prix grossiste'}
        </p>
      )}
    </div>
  );
}

/**
 * Compact version for product cards
 */
export function ProductPriceCompact({
  price,
  wholesalePrice,
  compareAtPrice,
}: Omit<ProductPriceProps, 'size' | 'showSavings' | 'className'>) {
  return (
    <ProductPrice
      price={price}
      wholesalePrice={wholesalePrice}
      compareAtPrice={compareAtPrice}
      size="md"
      showSavings={true}
      className="items-start"
    />
  );
}

/**
 * Large version for product detail pages
 */
export function ProductPriceLarge({
  price,
  wholesalePrice,
  compareAtPrice,
}: Omit<ProductPriceProps, 'size' | 'showSavings' | 'className'>) {
  return (
    <ProductPrice
      price={price}
      wholesalePrice={wholesalePrice}
      compareAtPrice={compareAtPrice}
      size="xl"
      showSavings={true}
      className="items-start"
    />
  );
}