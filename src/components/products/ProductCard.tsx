/**
 * Product Card Component - MODERNIZED
 * Ghalinino - Tunisia E-commerce
 *
 * IMPROVEMENTS:
 * - Enhanced card design with better shadows and hover effects
 * - Improved image presentation with overlay effects
 * - Better typography hierarchy
 * - Smoother animations and transitions
 * - Enhanced visual feedback on interactions
 * - Better stock badge design
 * - Improved price display
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { cn, formatPrice } from '@/lib/utils';
import { useLanguage } from '@/hooks';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCartContext } from '@/contexts/CartContext';
import { StockBadge } from './StockBadge';
import { Button } from '@/components/common';
import { ProductPriceCompact } from './ProductPrice';

import type { Product, Category } from '@/types/database';
import { CART_ANIMATION_CONFIG } from '@/lib/constants';

// ============================================================================
// TYPES
// ============================================================================

interface ProductCardProps {
  product: Product & { category?: Category | null };
  className?: string;
}

// ============================================================================
// PLACEHOLDER IMAGE
// ============================================================================

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik0xNjAgMTYwSDE4MEwyMDAgMTgwTDI0MCAxNDBMMjgwIDE4MFYyNDBIMTIwVjE4MEwxNjAgMTYwWiIgZmlsbD0iI0UyRThGMCIvPgo8Y2lyY2xlIGN4PSIxNjAiIGN5PSIxNDAiIHI9IjIwIiBmaWxsPSIjRTJFOEYwIi8+Cjwvc3ZnPgo=';

// ============================================================================
// TRANSLATIONS
// ============================================================================

const t = {
  addToCart: { ar: 'أضف للسلة', fr: 'Ajouter' },
  added: { ar: '✓ تمت الإضافة', fr: '✓ Ajouté' },
  outOfStock: { ar: 'نفذ المخزون', fr: 'Épuisé' },
  viewDetails: { ar: 'عرض التفاصيل', fr: 'Voir détails' },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function ProductCard({ product, className }: ProductCardProps) {
  const { language } = useLanguage();
  const { profile } = useAuthContext();
  const { addToCart, openCart } = useCartContext();

  const [isAdding, setIsAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isWholesale = profile?.wholesale_status === 'approved';
  const isPendingWholesale = profile?.wholesale_status === 'pending';
  const name = language === 'ar' ? product.name_ar : product.name_fr;
  const isOutOfStock = product.quantity <= 0;

  const handleAddToCart = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isOutOfStock || isAdding) return;

      setIsAdding(true);

      try {
        const result = await addToCart(product.id, 1);

        if (result.success) {
          setTimeout(() => {
            openCart();
            setIsAdding(false);
          }, CART_ANIMATION_CONFIG.DRAWER_OPEN_DELAY);
        } else {
          setTimeout(() => {
            setIsAdding(false);
          }, 1500);
        }
      } catch (error) {
        setTimeout(() => {
          setIsAdding(false);
        }, 1500);
      }
    },
    [product.id, isOutOfStock, isAdding, addToCart, openCart]
  );

  return (
    <Link
      to={`/product/${product.slug}`}
      className={cn(
        'group block',
        'transition-all duration-300 ease-out',
        'hover:-translate-y-1',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 h-full flex flex-col transition-all duration-300 group-hover:shadow-2xl group-hover:shadow-slate-200/50 group-hover:border-slate-300">
        {/* Image Container - Enhanced */}
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          <img
            src={imageError ? PLACEHOLDER_IMAGE : (product.images?.[0] || PLACEHOLDER_IMAGE)}
            alt={name}
            onError={() => setImageError(true)}
            className={cn(
              'w-full h-full object-cover',
              'transition-transform duration-500 ease-out',
              isHovered && 'scale-110'
            )}
          />
          
          {/* Gradient Overlay on Hover */}
          <div className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent',
            'transition-opacity duration-300',
            isHovered ? 'opacity-100' : 'opacity-0'
          )} />

          {/* Badges Container */}
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2 z-10">
            {/* Stock Badge */}
            <StockBadge quantity={product.quantity} className="shadow-lg" />
          </div>

          {/* Quick View Button - Appears on Hover */}
          <div className={cn(
            'absolute bottom-3 left-3 right-3',
            'transition-all duration-300',
            isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}>
            <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl text-center text-sm font-semibold text-slate-900 shadow-lg">
              {t.viewDetails[language]}
            </div>
          </div>
        </div>

        {/* Content - Enhanced Spacing */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Product Name */}
          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-2 text-base leading-snug group-hover:text-red-600 transition-colors">
            {name}
          </h3>

          {/* Category */}
          {product.category && (
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
              {language === 'ar' ? product.category.name_ar : product.category.name_fr}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price Section */}
          <div className="mb-3">
            <ProductPriceCompact
              price={product.price}
              wholesalePrice={product.wholesale_price}
              compareAtPrice={product.compare_at_price}
            />
          </div>

          {/* Add to Cart Button - Enhanced */}
          <Button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            fullWidth
            size="sm"
            variant={isOutOfStock ? 'outline' : isAdding ? 'primary' : 'primary'}
            className={cn(
              '!rounded-xl !py-2.5 !text-sm font-semibold',
              'transition-all duration-300',
              !isOutOfStock && !isAdding && 'shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300',
              isAdding && 'bg-green-600 hover:bg-green-600 border-green-600'
            )}
          >
            {isOutOfStock ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                {t.outOfStock[language]}
              </span>
            ) : isAdding ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {t.added[language]}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {t.addToCart[language]}
              </span>
            )}
          </Button>
        </div>
      </div>
    </Link>
  );
}

// ============================================================================
// SKELETON LOADER - Enhanced
// ============================================================================

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 animate-pulse">
      <div className="aspect-square bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-6 bg-slate-200 rounded w-1/3" />
        <div className="h-10 bg-slate-200 rounded-xl" />
      </div>
    </div>
  );
}