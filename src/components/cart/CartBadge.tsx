/**
 * Cart Badge Component
 * Ghalinino - Tunisia E-commerce
 * 
 * Cart icon with item count badge for header.
 * Updates in real-time as items are added/removed.
 */

import { cn } from '@/lib/utils';
import { useCartContext } from '@/contexts/CartContext';
import { useLanguage } from '@/hooks';

// ============================================================================
// TYPES
// ============================================================================

interface CartBadgeProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom class name */
  className?: string;
  /** Show label text */
  showLabel?: boolean;
}

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  cart: { ar: 'السلة', fr: 'Panier' },
  items: { ar: 'منتج', fr: 'article(s)' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CartBadge({ size = 'md', className, showLabel = false }: CartBadgeProps) {
  const { language } = useLanguage();
  const { itemCount, toggleCart, isLoading } = useCartContext();

  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  const badgeSizes = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  };

  return (
    <button
      onClick={toggleCart}
      className={cn(
        'relative flex items-center gap-2',
        'text-slate-700 hover:text-red-600 transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded-lg',
        className
      )}
      aria-label={`${t.cart[language]} (${itemCount} ${t.items[language]})`}
    >
      {/* Cart icon container */}
      <div className={cn(
        'relative flex items-center justify-center',
        'rounded-lg hover:bg-slate-100 transition-colors',
        sizeClasses[size]
      )}>
        {/* Cart icon */}
        <svg 
          className={cn(iconSizes[size])} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
          />
        </svg>

        {/* Badge */}
        {itemCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1',
              'flex items-center justify-center',
              'bg-red-600 text-white font-bold rounded-full',
              'animate-in zoom-in duration-200',
              badgeSizes[size]
            )}
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}

        {/* Loading indicator */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
            <svg className="w-4 h-4 animate-spin text-red-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Optional label */}
      {showLabel && (
        <span className="hidden sm:inline text-sm font-medium">
          {t.cart[language]}
        </span>
      )}
    </button>
  );
}

// ============================================================================
// MINI VERSION (for mobile header)
// ============================================================================

export function CartBadgeMini() {
  const { itemCount, toggleCart } = useCartContext();

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 text-slate-700 hover:text-red-600 transition-colors"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
        />
      </svg>
      
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold rounded-full">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
