/**
 * Stock Badge Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Color-coded stock indicator:
 * - Green: >10 in stock
 * - Yellow: 1-10 in stock (low stock)
 * - Red: Out of stock
 */

import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface StockBadgeProps {
  quantity: number;
  lowStockThreshold?: number;
  /** Show exact quantity or just status */
  showQuantity?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  inStock: { ar: 'متوفر', fr: 'En stock' },
  lowStock: { ar: 'كمية محدودة', fr: 'Stock limité' },
  outOfStock: { ar: 'نفذ المخزون', fr: 'Rupture de stock' },
  available: { ar: 'متوفر', fr: 'disponible' },
  availablePlural: { ar: 'متوفرة', fr: 'disponibles' },
  only: { ar: 'فقط', fr: 'Seulement' },
  left: { ar: 'متبقي', fr: 'restant' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function StockBadge({
  quantity,
  lowStockThreshold = 10,
  showQuantity = false,
  size = 'md',
  className,
}: StockBadgeProps) {
  const { language } = useLanguage();

  // Determine stock status
  const isOutOfStock = quantity <= 0;
  const isLowStock = quantity > 0 && quantity <= lowStockThreshold;

  // Get status color
  const getStatusColor = () => {
    if (isOutOfStock) return 'bg-red-100 text-red-700 border-red-200';
    if (isLowStock) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  // Get dot color
  const getDotColor = () => {
    if (isOutOfStock) return 'bg-red-500';
    if (isLowStock) return 'bg-amber-500';
    return 'bg-green-500';
  };

  // Get status text
  const getStatusText = () => {
    if (isOutOfStock) {
      return t.outOfStock[language];
    }
    
    if (showQuantity) {
      if (isLowStock) {
        return language === 'ar'
          ? `${t.only[language]} ${quantity} ${t.left[language]}`
          : `${t.only[language]} ${quantity} ${t.left[language]}`;
      }
      return `${quantity} ${quantity === 1 ? t.available[language] : t.availablePlural[language]}`;
    }
    
    if (isLowStock) {
      return t.lowStock[language];
    }
    
    return t.inStock[language];
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        getStatusColor(),
        sizeClasses[size],
        className
      )}
    >
      <span
        className={cn(
          'rounded-full shrink-0',
          getDotColor(),
          dotSizes[size],
          isLowStock && !isOutOfStock && 'animate-pulse'
        )}
      />
      {getStatusText()}
    </span>
  );
}

// ============================================================================
// STOCK INDICATOR (Simpler inline version)
// ============================================================================

interface StockIndicatorProps {
  quantity: number;
  lowStockThreshold?: number;
  className?: string;
}

export function StockIndicator({
  quantity,
  lowStockThreshold = 10,
  className,
}: StockIndicatorProps) {
  const { language } = useLanguage();

  const isOutOfStock = quantity <= 0;
  const isLowStock = quantity > 0 && quantity <= lowStockThreshold;

  if (isOutOfStock) {
    return (
      <span className={cn('text-red-600 font-medium text-sm', className)}>
        {t.outOfStock[language]}
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className={cn('text-amber-600 font-medium text-sm', className)}>
        {language === 'ar' ? `${quantity} ${t.left[language]}` : `${quantity} ${t.left[language]}`}
      </span>
    );
  }

  return (
    <span className={cn('text-green-600 font-medium text-sm', className)}>
      {t.inStock[language]}
    </span>
  );
}
